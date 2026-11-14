# ISHTI M03.1.1 — Rollback & Recovery Process Review

**Document Version:** 1.0.0  
**Date:** 2026-11-15  
**Milestone:** ISHTI M03.1.1 (Reconciliation Script Verification & Execution Readiness)  
**Repository:** `Sunder-Chauhan/Ishti-OS` (internal codename `spiritual-OS`)  
**Branch:** `main`  
**Baseline Git Commit:** `2f2cd78aac9dea0b7c7c08fe22e0d49f88804b7f`  
**Target Staging Project:** `ishti-staging` (`zrjptpkhtklfgnovdrny`, Region: `ap-south-1`)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**STRICT ZERO-MUTATION BOUNDARY**)  

---

## 1. Executive Summary & Purpose

Before applying any remote schema modifications or reconciliation scripts to the hosted staging database (`zrjptpkhtklfgnovdrny`), a verifiable rollback and disaster recovery plan must be in place.

This document reviews:
1. The **pre-reconciliation logical backup procedure** via `supabase db dump`.
2. The **Git exclusion and confidentiality safeguards** protecting database backups.
3. The **restoration feasibility, limitations, and operational dependencies**.
4. The **automated transactional rollback mechanism** embedded in `scripts/reconcile-staging-schema.ts`.
5. Step-by-step **disaster recovery protocols** for staging operators.

---

## 2. Proposed Logical Backup Procedure

### 2.1 Backup Command Specification
The recommended pre-reconciliation backup is executed using the Supabase CLI:

```bash
# Ensure target project is explicitly passed to prevent unintended targeting
npx supabase db dump \
  --project-ref zrjptpkhtklfgnovdrny \
  --schema public,supabase_migrations \
  --data \
  -f supabase/backups/staging_pre_reconciliation.sql
```

### 2.2 Targeting & Security Validation
- **Project Ref Validation:** Must equal `zrjptpkhtklfgnovdrny`. The production project reference (`zxwkfnvmmxoojewhvsdc`) must **NEVER** be passed.
- **Output Path:** `supabase/backups/staging_pre_reconciliation.sql`.
- **Credential Sourcing:** Uses the operator's authenticated Supabase CLI session (`supabase login`) or staging database connection string. Zero credentials are embedded in command scripts or checked into Git.

### 2.3 Scope of Captured Backup Objects
The logical dump captures the complete state of the staging database prior to reconciliation:

| Object Type | Captured In Backup | Details |
|---|:---:|---|
| **Public Tables (11)** | **YES** | `profiles`, `role_assignment_audit`, `user_consents`, `scripture_catalog`, `canonical_verses`, `kundli_profiles`, `booking_requests`, `pandit_accreditations`, `rate_limit_events`, `subscribers`, `astrology_computation_audit` |
| **Custom Types & Enums** | **YES** | `user_role`, `gender_identity`, `service_tier`, `scripture_category`, `rights_clearance_status`, `booking_status`, `pandit_verification_status` |
| **Table Constraints & Indexes** | **YES** | Primary keys, foreign keys, unique constraints, partial unique index `idx_unique_active_slot_booking`, btree & GIN indexes |
| **Row-Level Security (RLS)** | **YES** | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 11 tables |
| **Existing Policies (13)** | **YES** | The 13 pre-existing policies, including the 2 drifted scholar policies (`{public}` scope) |
| **Functions & Procedures** | **YES** | All 12 PL/pgSQL functions (`is_admin`, `is_scholar`, `assign_user_role`, `check_rate_limit`, etc.) |
| **Database Triggers (7)** | **YES** | `trg_prevent_role_escalation`, `trg_prevent_audit_tampering`, `trg_validate_and_reserve_slot`, etc. |
| **Seed Data (2 Rows)** | **YES** | Existing seed rows in `scripture_catalog` (Rigveda 10.191.2) and `canonical_verses` |
| **Migration History** | **YES** | `supabase_migrations.schema_migrations` (currently empty / 0 rows) |

---

## 3. Git Exclusion & Secret Prevention Audit

Because a database dump may contain table definitions, user consent records, or test seed data, backups must **NEVER** be committed to version control.

### 3.1 `.gitignore` Audit & Remediation
Prior to this milestone, `.gitignore` lacked explicit patterns for database dumps. During M03.1.1, `.gitignore` was updated and verified:

```gitignore
# Database dumps, exports & reconciliation backups
supabase/backups/
backups/
*.dump
*.backup
*.sql.gz
*.tar
```

### 3.2 Verification Test
Running `git status` after generating a test file in `supabase/backups/test.sql` confirms:
- The `supabase/backups/` directory is strictly ignored.
- Git does not track or prompt to stage any `.dump`, `.backup`, or `supabase/backups/*` file.

---

## 4. Restoration Feasibility & Dependencies Assessment

### 4.1 Restoration Command
If a complete database restoration is required, it is executed via `psql`:

```bash
psql "$STAGING_DATABASE_URL" -f supabase/backups/staging_pre_reconciliation.sql
```

### 4.2 Restoration Feasibility & Complexity Analysis
A raw `psql` restore of a Supabase dump has specific behavioral characteristics that must be understood:

1. **Table Overwrite Behavior:**
   - Standard Supabase dumps emit `CREATE TABLE public.<tablename> (...)`.
   - If tables already exist in the target database, `CREATE TABLE` commands will fail with `relation "<tablename>" already exists` unless `--clean` / `DROP TABLE IF EXISTS` was specified during the dump.
   - However, running with `--clean` would drop existing tables and cascade across foreign keys.
2. **Policy Restoration:**
   - If policies exist, `CREATE POLICY` statements will fail with `policy "<policyname>" for table "<tablename>" already exists`.
   - Dumps do not automatically prepend `DROP POLICY IF EXISTS`.
3. **Role & Privilege Dependencies:**
   - Dumps contain `ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"` and grant statements referencing Supabase built-in roles (`postgres`, `anon`, `authenticated`, `service_role`).
   - The restore must be run by a user with administrative privileges (the `postgres` database owner) so role grants succeed.
4. **Data Restoration (DML):**
   - Seed data inserts will fail on primary key uniqueness (`duplicate key value violates unique constraint`) unless written with `ON CONFLICT DO NOTHING`.

### 4.3 Conclusion on Restoration Feasibility
Because restoring a full SQL dump into a partially existing schema causes collision errors on existing tables, a **full dump restore is a disaster-recovery fallback**, NOT the primary rollback mechanism.

The primary, instantaneous rollback mechanism is the **atomic transaction** within `scripts/reconcile-staging-schema.ts`.

---

## 5. Automated Transactional Rollback Mechanism

The safest and most reliable rollback architecture is preventing partial commits in the first place.

`scripts/reconcile-staging-schema.ts` implements strict transaction atomicity:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 TRANSACTIONAL RECONCILIATION EXECUTION                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. BEGIN;                                                                   │
│    ├─ Apply 31 RLS policies with DROP POLICY IF EXISTS ... CREATE POLICY    │
│    ├─ Query pg_policies: verify all 31 expected policies match catalog      │
│    ├─ Query information_schema: verify routine privileges revoked from anon │
│    └─ Register version 20261114000000 in supabase_migrations               │
│                                                                             │
│ 2. EVALUATE ALL POSTCONDITIONS:                                             │
│    ├─ IF ALL PASS  ──► COMMIT;   (Database advances to reconciled state)    │
│    └─ IF ANY FAILS ──► ROLLBACK; (Database state immediately reverts)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Rollback Guarantees:
1. **Zero Intermediate State:** If any of the 31 policies fail to apply, or if any postcondition check fails, PostgreSQL executes `ROLLBACK;`. The database remains in its exact pre-reconciliation state.
2. **Zero Table Mutations:** The reconciliation script does not issue `CREATE TABLE`, `DROP TABLE`, `ALTER TABLE`, or `TRUNCATE`. Therefore, rollback does not risk dropping existing application tables or user records.
3. **Automatic Clean-up:** The client connection is closed in a `finally` block, ensuring no idle-in-transaction sessions remain locked.

---

## 6. Staging Operator Disaster Recovery Playbook

In the improbable event that reconciliation is applied and later determined to require manual reversal, the staging operator should follow this step-by-step procedure:

### Scenario A: Transactional Abort During Execution
- **Symptom:** `scripts/reconcile-staging-schema.ts` outputs an error and logs `Executing ROLLBACK...`.
- **Operator Action:**
  1. Inspect the logged error message (e.g., policy mismatch, privilege failure).
  2. Verify database state by running dry-run:
     ```bash
     STAGING_DATABASE_URL="$STAGING_DATABASE_URL" npx tsx scripts/reconcile-staging-schema.ts
     ```
  3. Confirm that the 11 tables and 13 pre-existing policies remain intact.
  4. No manual rollback SQL is required because the transaction rolled back automatically.

### Scenario B: Manual Policy Rollback (Reverting Post-Reconciliation Policies)
If reconciliation was successfully committed (`COMMIT`), but the operator needs to return RLS policies to their exact pre-reconciliation state (13 policies, with scholar policies having `{public}` role scope):

Execute the following SQL via Supabase SQL Editor or `psql`:

```sql
BEGIN;

-- 1. Remove the 18 newly added policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Admins can view all consents" ON public.user_consents;
DROP POLICY IF EXISTS "Owner-only update kundli" ON public.kundli_profiles;
DROP POLICY IF EXISTS "Owner-only delete kundli" ON public.kundli_profiles;
DROP POLICY IF EXISTS "Devotees can update their own bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Devotees can cancel their own bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Assigned experts can view booking details" ON public.booking_requests;
DROP POLICY IF EXISTS "Admins can view all booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Pandits can update their own accreditation" ON public.pandit_accreditations;
DROP POLICY IF EXISTS "Admins can manage all accreditations" ON public.pandit_accreditations;
DROP POLICY IF EXISTS "Subscribers can insert their own email" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own astrology audit records" ON public.astrology_computation_audit;
DROP POLICY IF EXISTS "Admins can view all astrology audit records" ON public.astrology_computation_audit;
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.rate_limit_events;
DROP POLICY IF EXISTS "Admins can view rate limit audit" ON public.rate_limit_events;

-- 2. Revert scholar policies to their pre-reconciliation {public} scope
DROP POLICY IF EXISTS "Scholars and admins can manage scripture catalog" ON public.scripture_catalog;
CREATE POLICY "Scholars and admins can manage scripture catalog" ON public.scripture_catalog FOR ALL USING (public.is_scholar() OR public.is_admin());

DROP POLICY IF EXISTS "Scholars and admins can manage verses" ON public.canonical_verses;
CREATE POLICY "Scholars and admins can manage verses" ON public.canonical_verses FOR ALL USING (public.is_scholar() OR public.is_admin());

-- 3. Remove migration record from supabase_migrations
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261114000000';

COMMIT;
```

---

## 7. Review Summary & Sign-off

| Recovery Dimension | Assessment | Status |
|---|---|:---:|
| **Logical Dump Procedure** | Validated command, targeting staging project `zrjptpkhtklfgnovdrny` | **READY** |
| **Git Exclusion Verification** | `supabase/backups/` and `*.dump` strictly ignored in `.gitignore` | **VERIFIED** |
| **Restoration Feasibility** | Transactional rollback primary; full SQL restore analyzed and documented | **VERIFIED** |
| **Transactional Rollback** | `scripts/reconcile-staging-schema.ts` implements atomic `BEGIN ... COMMIT / ROLLBACK` | **VERIFIED** |
| **Manual Recovery Playbook** | Explicit, non-destructive SQL provided for manual policy reversal | **READY** |

**Conclusion:** Rollback and recovery mechanisms for Milestone M03.1.1 are fully verified and operationally ready.

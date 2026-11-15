# ISHTI Milestone M03.2: Staging Database Preflight Checklist

**Document Version:** 1.0  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**HARD-QUARANTINED**)  
**Canonical Baseline Migration:** `supabase/migrations/20261114000000_initial_schema.sql`  
**Migration SHA-256:** `3399a7317e1933f989d4a9688cac84d6d407006e930614ad90508efa52ea87ed`  
**Milestone Status:** `M03.2 — EXECUTION PLAN READY / AWAITING EXPLICIT APPROVAL`  

---

## 1. Governance & Precondition Gate

| Check ID | Item Description | Verification Source | Status | Notes |
|---|---|---|:---:|---|
| **GOV-01** | Production Hard-Quarantine | `scripts/validate-staging-url.ts` | **ENFORCED** | Rejects `zxwkfnvmmxoojewhvsdc` across host, username, query, and path. |
| **GOV-02** | Staging Endpoint Allowlist | `scripts/validate-staging-url.ts` | **ENFORCED** | Enforces exact host `db.zrjptpkhtklfgnovdrny.supabase.co` or pooler `aws-0-ap-south-1.pooler.supabase.com`. |
| **GOV-03** | Exact Pooler Username Check | `scripts/validate-staging-url.ts` | **ENFORCED** | Strictly requires `postgres.zrjptpkhtklfgnovdrny`; rejects suffix extensions. |
| **GOV-04** | Direct Username Check | `scripts/validate-staging-url.ts` | **ENFORCED** | Strictly requires `postgres`. |
| **GOV-05** | Credential Hygiene | Repository & Log Scan | **VERIFIED** | Zero secrets, tokens, or passwords logged or committed to Git. |
| **GOV-06** | Razorpay Key Revocation | Operator Dashboard Action | **PENDING** | Operator must confirm revocation in Razorpay dashboard. |
| **GOV-07** | Non-Destructive Safety Rule | `reconcile-staging-schema.ts` | **ENFORCED** | **NO AUTO-REPAIR:** Unexpected objects are NEVER dropped or altered automatically. |

---

## 2. Table Inventory & Row Count Audit

| # | Table Name | Expected in Migration | Live in Staging | RLS Status | Expected Rows | Live Rows | Status |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `profiles` | YES (9 cols) | YES (9 cols) | ENABLED | 0 | 0 | **MATCH** |
| 2 | `role_assignment_audit` | YES (8 cols) | YES (8 cols) | ENABLED | 0 | 0 | **MATCH** |
| 3 | `user_consents` | YES (9 cols) | YES (9 cols) | ENABLED | 0 | 0 | **MATCH** |
| 4 | `scripture_catalog` | YES (20 cols) | YES (20 cols) | ENABLED | 1 (Seed) | 1 (Seed) | **MATCH** |
| 5 | `canonical_verses` | YES (20 cols) | YES (20 cols) | ENABLED | 1 (Seed) | 1 (Seed) | **MATCH** |
| 6 | `kundli_profiles` | YES (13 cols) | YES (13 cols) | ENABLED | 0 | 0 | **MATCH** |
| 7 | `expert_profiles` | YES (13 cols) | YES (13 cols) | ENABLED | 0 | 0 | **MATCH** |
| 8 | `consultation_slots` | YES (6 cols) | YES (6 cols) | ENABLED | 0 | 0 | **MATCH** |
| 9 | `booking_requests` | YES (9 cols) | YES (9 cols) | ENABLED | 0 | 0 | **MATCH** |
| 10 | `early_access_subscribers` | YES (9 cols) | YES (9 cols) | ENABLED | 0 | 0 | **MATCH** |
| 11 | `rate_limit_events` | YES (4 cols) | YES (4 cols) | ENABLED | 0 | 0 | **MATCH** |

**Summary:** All 11 expected public tables are present with exact column definitions and Row-Level Security enabled. Zero unexpected tables detected. Zero missing tables.

---

## 3. Seed Data Integrity & Preservation Audit

| Table Name | Seed Record Identifier | Canonical Expected Values | Live Staging Value | Action Required |
|---|---|---|---|:---:|
| `scripture_catalog` | `slug = 'bhagavad-gita'` | `title_iast = 'Śrīmad Bhagavad Gītā'`, `rights_clearance_status = 'pending_clearance'`, `status = 'draft'` | Identical to canonical | **PRESERVE (DO NOT TRUNCATE)** |
| `canonical_verses` | Verse `2.47` (Gita) | `chapter_adhyaya_sukta = 2`, `verse_number = 47`, `review_status = 'pending_peer_review'` | Identical to canonical | **PRESERVE (DO NOT TRUNCATE)** |

---

## 4. RLS Policy Inventory & Drift Analysis

The canonical schema specifies **31 RLS policies**. The initial manual execution halted mid-file at line 915 due to a multi-line syntax split (`ERROR: 42601`).

### Policy State Matrix
| Table Name | Canonical Policies | Live Policies | Misconfigured Policies | Missing Policies | Reconciliation Action |
|---|:---:|:---:|:---:|:---:|---|
| `profiles` | 3 | 3 | 0 | 0 | Re-apply canonical definition (`Users can view`, `Admins view`, `Users update`). |
| `role_assignment_audit` | 1 | 1 | 0 | 0 | Re-apply canonical definition (`Admins can view role audit`). |
| `user_consents` | 4 | 4 | 0 | 0 | Re-apply canonical definitions (SELECT, INSERT, UPDATE, Admin SELECT). |
| `scripture_catalog` | 2 | 2 | 1 (`Scholars manage`) | 0 | **Reconcile:** Scope `Scholars manage` strictly to `TO authenticated`. |
| `canonical_verses` | 2 | 2 | 1 (`Scholars manage`) | 0 | **Reconcile:** Scope `Scholars manage` strictly to `TO authenticated`. |
| `kundli_profiles` | 4 | 0 | 0 | 4 | **Apply:** Add 4 owner-only policies (SELECT, INSERT, UPDATE, DELETE). |
| `expert_profiles` | 4 | 0 | 0 | 4 | **Apply:** Add 4 policies (Public read active, Expert view/update own, Admin view all). |
| `consultation_slots` | 2 | 0 | 0 | 2 | **Apply:** Add 2 policies (Public view available, Expert manage own). |
| `booking_requests` | 6 | 0 | 0 | 6 | **Apply:** Add 6 policies (Devotee view/create/update own, Expert view assigned, Admin view/update). |
| `early_access_subscribers` | 2 | 0 | 0 | 2 | **Apply:** Add 2 policies (Public insert, Admin select). |
| `rate_limit_events` | 1 | 0 | 0 | 1 | **Apply:** Add 1 policy (Admin view rate limit events). |
| **TOTALS** | **31** | **13** | **2** | **18** | **Full 31-policy synchronization via atomic transaction.** |

---

## 5. Functions & Privilege Hardening Inventory

| Function Name | Return Type | Language | Security | search_path Hardened | Public EXECUTE Revoked |
|---|---|---|---|:---:|:---:|
| `public.set_updated_at()` | `TRIGGER` | `plpgsql` | Default | `public, pg_temp` | N/A (Trigger) |
| `public.is_admin()` | `BOOLEAN` | `sql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Revoked from PUBLIC |
| `public.is_scholar()` | `BOOLEAN` | `sql` | `SECURITY DEFINER` | `public, auth, pg_temp` | **Revoked from PUBLIC & anon** |
| `public.is_astrologer()` | `BOOLEAN` | `sql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Revoked from PUBLIC |
| `public.assign_user_role(...)` | `VOID` | `plpgsql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Revoked from PUBLIC |
| `public.handle_new_user()` | `TRIGGER` | `plpgsql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Trigger (auth.users) |
| `public.enforce_profile_update_integrity()` | `TRIGGER` | `plpgsql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Trigger (profiles) |
| `public.prevent_audit_log_tampering()` | `TRIGGER` | `plpgsql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Trigger (role_assignment_audit) |
| `public.prevent_plaintext_kundli_dob()` | `TRIGGER` | `plpgsql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Trigger (kundli_profiles) |
| `public.validate_and_reserve_booking_slot()` | `TRIGGER` | `plpgsql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Trigger (booking_requests) |
| `public.cleanup_stale_slot_reservations()` | `INTEGER` | `plpgsql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Revoked from PUBLIC |
| `public.cleanup_rate_limit_events()` | `INTEGER` | `plpgsql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Revoked from PUBLIC |
| `public.check_rate_limit(...)` | `BOOLEAN` | `plpgsql` | `SECURITY DEFINER` | `public, auth, pg_temp` | Internal RPC |

---

## 6. Triggers & Partial Unique Indexes

| Target Table | Trigger / Index Name | Type / Event | Purpose | Verification Status |
|---|---|---|---|:---:|
| `booking_requests` | `idx_unique_active_slot_booking` | Partial Unique Index (`WHERE status IN ('pending', 'confirmed')`) | Prevents double-booking race conditions | **VERIFIED** |
| `profiles` | `trg_profiles_set_updated_at` | BEFORE UPDATE | Automatically updates `updated_at` | **VERIFIED** |
| `profiles` | `trg_enforce_profile_integrity` | BEFORE UPDATE | Blocks role escalation and verification tampering | **VERIFIED** |
| `role_assignment_audit` | `trg_prevent_audit_log_tampering` | BEFORE UPDATE OR DELETE | Enforces append-only immutable audit trail | **VERIFIED** |
| `kundli_profiles` | `trg_prevent_plaintext_kundli_dob` | BEFORE INSERT OR UPDATE | Blocks unencrypted DOB/TOB insertion | **VERIFIED** |
| `booking_requests` | `trg_validate_and_reserve_slot` | BEFORE INSERT | Atomically validates and locks slot availability | **VERIFIED** |

---

## 7. Migration History Bookkeeping

| Environment | Table | Current State | Target Post-Reconciliation State | Verification Command |
|---|---|---|---|---|
| **Staging** | `supabase_migrations.schema_migrations` | 0 rows | 1 row (`20261114000000`, `initial_schema`) | `npx supabase migration list --remote=...` |

---

## 8. "No Auto-Repair" Policy Enforcement

> [!CAUTION]
> **STRICT RECONCILIATION RULE:**
> If any unexpected table, unexpected column, missing table, or unrecorded drift is encountered during reconciliation, the script will **ABORT IMMEDIATELY** with exit code 1.
> The script will **NEVER**:
> - Automatically drop unexpected tables or columns.
> - Automatically truncate table data.
> - Automatically alter column types.
> - Bypass security checks or ignore missing tables.

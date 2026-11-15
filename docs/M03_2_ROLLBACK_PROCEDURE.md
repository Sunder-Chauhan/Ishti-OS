# ISHTI Milestone M03.2: Staging Database Rollback & Recovery Runbook

**Document Version:** 1.0  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**STRICTLY UNTOUCHED — NEVER TARGETED**)  
**Milestone Status:** `M03.2 — EXECUTION PLAN READY / AWAITING EXPLICIT APPROVAL`  

---

## 1. Rollback Philosophy & Tiered Recovery Strategy

The ISHTI staging reconciliation strategy is designed with a defense-in-depth recovery architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: Automatic In-Transaction Rollback                             │
│ Trigger: Any query failure or postcondition assertion failure          │
│ Action:  Instantaneous PostgreSQL ROLLBACK; zero objects persisted     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ If transaction committed but issues
                                   ▼ arise in subsequent application tests
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: Selective Post-Reconciliation Rollback                         │
│ Trigger: Schema synchronized, but downstream integration test fails   │
│ Action:  Execute emergency SQL script to revert policies & migration   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ If severe data corruption or
                                   ▼ unrecoverable drift occurs
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 3: Full Disaster-Recovery Restoration                            │
│ Trigger: Unrecoverable state requiring full point-in-time revert       │
│ Action:  Restore pre-reconciliation logical schema and data dumps      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Level 1: Automatic In-Transaction Rollback

[`scripts/reconcile-staging-schema.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/reconcile-staging-schema.ts) wraps all mutating DDL and the migration history insert inside a single atomic transaction:

```sql
BEGIN;
  -- Synchronize all 31 RLS policies
  -- Validate pg_policies postcondition state
  -- Validate routine_privileges for public.is_scholar()
  -- Register migration in supabase_migrations.schema_migrations
COMMIT;
```

**Failure Behavior:**
- If any error occurs prior to `COMMIT`, the script intercepts the exception, issues `ROLLBACK;`, and terminates with exit code 1.
- No policies are added, no roles altered, and no migration records persisted.
- **Recovery Time:** 0 seconds (Immediate).

---

## 3. Level 2: Selective Post-Reconciliation Rollback (Emergency SQL)

If the reconciliation transaction commits successfully, but subsequent application testing (Gate C) reveals an unexpected issue, the operator can execute the following targeted SQL script to return the database to its exact pre-reconciliation state:

### Emergency Rollback SQL Script
```sql
-- ==============================================================================
-- ISHTI M03.2: EMERGENCY RECONCILIATION ROLLBACK SCRIPT
-- Target: zrjptpkhtklfgnovdrny ONLY
-- ==============================================================================

BEGIN;

-- 1. Deregister migration version from Supabase CLI bookkeeping
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20261114000000';

-- 2. Drop the 18 downstream policies that were missing before reconciliation
DROP POLICY IF EXISTS "Owner-only select kundli" ON public.kundli_profiles;
DROP POLICY IF EXISTS "Owner-only insert kundli" ON public.kundli_profiles;
DROP POLICY IF EXISTS "Owner-only update kundli" ON public.kundli_profiles;
DROP POLICY IF EXISTS "Owner-only delete kundli" ON public.kundli_profiles;

DROP POLICY IF EXISTS "Public read active experts" ON public.expert_profiles;
DROP POLICY IF EXISTS "Experts can view their own profile" ON public.expert_profiles;
DROP POLICY IF EXISTS "Admins can view all expert profiles" ON public.expert_profiles;
DROP POLICY IF EXISTS "Experts can update their own profile" ON public.expert_profiles;

DROP POLICY IF EXISTS "Public view available slots" ON public.consultation_slots;
DROP POLICY IF EXISTS "Experts can manage their own slots" ON public.consultation_slots;

DROP POLICY IF EXISTS "Devotees can view their bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Experts can view assigned bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Devotees can create bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Devotees can update their own bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.booking_requests;

DROP POLICY IF EXISTS "Public insert early access" ON public.early_access_subscribers;
DROP POLICY IF EXISTS "Admins only view early access subscribers" ON public.early_access_subscribers;

DROP POLICY IF EXISTS "Admins can view rate limit events" ON public.rate_limit_events;

-- 3. Revert scholar-management policies back to pre-reconciliation syntax (without TO authenticated)
DROP POLICY IF EXISTS "Scholars and admins can manage scripture catalog" ON public.scripture_catalog;
CREATE POLICY "Scholars and admins can manage scripture catalog" ON public.scripture_catalog FOR ALL
  USING (public.is_scholar())
  WITH CHECK (public.is_scholar());

DROP POLICY IF EXISTS "Scholars and admins can manage verses" ON public.canonical_verses;
CREATE POLICY "Scholars and admins can manage verses" ON public.canonical_verses FOR ALL
  USING (public.is_scholar())
  WITH CHECK (public.is_scholar());

COMMIT;
```

---

## 4. Level 3: Full Disaster-Recovery Restoration Runbook

In the unlikely event of database corruption or unrecoverable drift, the database can be fully restored from the pre-reconciliation logical backups captured during Gate A.

### 4.1 Prerequisites
1. Staging backup files exist:
   - `supabase/backups/staging_schema_pre_reconciliation.sql`
   - `supabase/backups/staging_data_pre_reconciliation.sql`
2. Checksums match the recorded SHA-256 hashes from Gate A execution.
3. Target environment is verified to be staging (`zrjptpkhtklfgnovdrny`).

### 4.2 Step-by-Step Restoration Sequence

```bash
# Step 1: Export validated staging connection URL
export STAGING_DATABASE_URL="postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres"

# Step 2: Validate URL to prevent accidental production connection
npx tsx scripts/backup-staging.ts

# Step 3: Restore DDL Schema
# Uses psql to apply the schema backup containing IF NOT EXISTS declarations
psql "$STAGING_DATABASE_URL" -f supabase/backups/staging_schema_pre_reconciliation.sql

# Step 4: Restore Data Records with trigger bypass
# The data dump starts with SET session_replication_role = replica;
psql "$STAGING_DATABASE_URL" -f supabase/backups/staging_data_pre_reconciliation.sql
```

### 4.3 Post-Restoration Verification Queries
Execute against staging to verify clean restoration:

```sql
-- 1. Verify 11 tables present
SELECT count(*) FROM pg_tables WHERE schemaname = 'public';
-- Expected: 11

-- 2. Verify RLS is enabled on all 11 tables
SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: 11

-- 3. Verify seed row counts
SELECT count(*) FROM public.scripture_catalog;
-- Expected: 1
SELECT count(*) FROM public.canonical_verses;
-- Expected: 1

-- 4. Verify migration history state
SELECT count(*) FROM supabase_migrations.schema_migrations;
-- Expected: 0 (pre-reconciliation baseline)
```

---

## 5. Critical Prohibitions & Role Dump Safeguards

> [!WARNING]
> **ROLE DUMP PROHIBITION:**
> The file `staging_roles_pre_reconciliation.sql` contains cluster roles managed exclusively by the Supabase Cloud control plane (`postgres`, `anon`, `authenticated`, `service_role`).
> It must **NEVER** be executed against a hosted Supabase project. Attempting to restore it will cause permission errors and could disrupt database access roles.

> [!CAUTION]
> **PRODUCTION QUARANTINE:**
> All rollback procedures must be strictly verified against staging project reference `zrjptpkhtklfgnovdrny`.
> Under **NO CIRCUMSTANCES** should any rollback script, SQL file, or connection string be pointed at production project `zxwkfnvmmxoojewhvsdc`.

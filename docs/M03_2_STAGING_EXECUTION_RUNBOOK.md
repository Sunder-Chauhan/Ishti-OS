# ISHTI Milestone M03.2: Controlled Staging Execution Runbook

**Document Version:** 1.1 (Updated for M03.2.1 Gate A Review)  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Current Branch:** `main`  
**Baseline Git Commit:** `906caf1`  
**Migration Target:** `supabase/migrations/20261114000000_initial_schema.sql`  
**Migration SHA-256:** `3399a7317e1933f989d4a9688cac84d6d407006e930614ad90508efa52ea87ed`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**HARD-QUARANTINED — ZERO REMOTE ACCESS**)  
**Milestone Status:** `M03.2.1 — GATE A READINESS REVIEW COMPLETE / AWAITING EXPLICIT GATE A APPROVAL`  

---

## 1. Executive Summary & Governance Boundaries

This runbook defines the exact operational sequence required to execute the staging database reconciliation for the ISHTI platform.

### Mandatory Environment Boundaries
- **Target Staging Project (`zrjptpkhtklfgnovdrny`):** All actions in this runbook target exclusively this disposable staging database.
- **Production Project (`zxwkfnvmmxoojewhvsdc`):** **STRICTLY QUARANTINED.** Hard-blocked across all validation scripts. Zero connections, migrations, backups, or DDL/DML are authorized.
- **Three Separate Approval Gates:** Staging backup execution (Gate A), schema reconciliation (Gate B), and application integration testing (Gate C) are strictly decoupled. **Approval for one gate does NOT authorize execution of any subsequent gate.**
- **Decoupled Credential Dependencies:** Razorpay credential rotation is an essential prerequisite for payment sandbox integration (Gate C), but is decoupled from Gate A (Database Backup) and Gate B (Schema Reconciliation). The Razorpay exposure incident remains **UNRESOLVED** until dashboard revocation is explicitly confirmed.

---

## 2. Gate A: Hosted Pre-Reconciliation Staging Backup

### 2.1 Objective
Capture a complete, non-destructive, 3-pass logical snapshot of staging project `zrjptpkhtklfgnovdrny` before executing any DDL or DML changes.

### 2.2 Preconditions
1. **Docker Desktop Running:** Supabase CLI requires the Docker engine running locally to execute containerized `pg_dump` passes.
2. **Untracked Environment Configuration:** The operator must export `STAGING_DATABASE_URL` in their local, untracked shell. Never commit connection strings to Git.
3. **Endpoint Validation:** The connection URL must satisfy [`scripts/validate-staging-url.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/validate-staging-url.ts).
4. **Explicit Operator Approval Gate A:** The operator must grant explicit authorization for Gate A. No payment credentials or application secrets are required for Gate A.

### 2.3 Command Sequence
The repository provides a validated runner ([`scripts/backup-staging.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/backup-staging.ts)) that validates the endpoint, enforces the staging allowlist, masks credentials, handles partial failures safely, calculates SHA-256 hashes, emits a metadata manifest, and invokes the 3-pass CLI backup:

```bash
# Step 1: Export staging database URL (Operator action - untracked shell)
# Direct connection (port 5432) or Supabase pooler (port 6543/5432)
export STAGING_DATABASE_URL="postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres"

# Step 2: Dry-run endpoint inspection (mutates zero files)
npx tsx scripts/backup-staging.ts

# Step 3: Execute 3-pass logical backup
npx tsx scripts/backup-staging.ts --execute

# Step 4: Verify backup integrity against companion metadata manifest
npx tsx scripts/backup-staging.ts --verify
```

*Equivalent Raw Supabase CLI Commands (if executed manually):*
```bash
# Pass 1: Schema DDL Dump (public and supabase_migrations)
npx supabase db dump \
  --remote="postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres" \
  --schema public,supabase_migrations \
  --keep-comments \
  -f supabase/backups/staging_schema_[TIMESTAMP].sql

# Pass 2: Data Records Dump (public and supabase_migrations)
npx supabase db dump \
  --remote="postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres" \
  --schema public,supabase_migrations \
  --data-only \
  --use-copy \
  -f supabase/backups/staging_data_[TIMESTAMP].sql

# Pass 3: Cluster Roles Dump (Reference only)
npx supabase db dump \
  --remote="postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres" \
  --role-only \
  -f supabase/backups/staging_roles_[TIMESTAMP].sql
```

### 2.4 Integrity Verification & File Hygiene
A backup is considered valid **only if ALL of the following criteria are met**:
1. **Three Complete Passes Generated:** All three dump files (`staging_schema_*.sql`, `staging_data_*.sql`, and `staging_roles_*.sql`) exist on disk.
2. **Non-Zero File Sizes:** Every dump file has size > 0 bytes.
3. **Cryptographic Integrity:** SHA-256 checksums are calculated and match the companion metadata manifest (`staging_backup_*.meta.json`).
4. **Target Project Attribution:** The manifest records project reference `zrjptpkhtklfgnovdrny`.
5. **Lock Down Local File Permissions:**
   - *Linux/macOS:* `chmod 600 supabase/backups/*.sql supabase/backups/*.json`
   - *Windows PowerShell:*
     ```powershell
     icacls supabase/backups/* /inheritance:r /grant:r "$($env:USERNAME):(R,W)"
     ```
6. **Git Exclusion Verification:**
   Confirm Git status remains clean and backup files are ignored:
   ```bash
   git status --ignored supabase/backups/
   ```
7. **Prohibition of Hosted Role Restoration:**
   `staging_roles_*.sql` contains platform cluster roles (`postgres`, `anon`, `authenticated`, `service_role`). It is captured strictly for local disaster-recovery reference and must **NEVER** be restored into a hosted Supabase project.
8. **Historical Preservation & Zero Cloud Uploads:**
   The runner never deletes pre-existing historical backups and never uploads artifacts to external cloud services.

---

## 3. Gate B: Hosted Staging Schema Reconciliation

### 3.1 Objective
Synchronize all 31 RLS policies, ensure correct `TO authenticated` role scoping on scholar policies, verify function execution restrictions, and atomically record migration version `20261114000000` in `supabase_migrations.schema_migrations`.

### 3.2 Preconditions
1. **Gate A Passed & Verified:** Backup files exist, non-zero sizes confirmed, SHA-256 recorded, integrity verified via `--verify`.
2. **Preflight Checklist Passed:** All Gate B items in [`docs/M03_2_PREFLIGHT_CHECKLIST.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_PREFLIGHT_CHECKLIST.md) verified.
3. **Explicit Operator Approval Gate B:** Operator grants separate explicit approval to execute reconciliation. Gate A approval does NOT constitute Gate B approval.

### 3.3 Command Sequence
Reconciliation is managed by [`scripts/reconcile-staging-schema.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/reconcile-staging-schema.ts):

```bash
# Step 1: Execute dry-run inspection against hosted staging
npx tsx scripts/reconcile-staging-schema.ts

# Review preflight output:
# - Confirms 11 tables present with RLS enabled
# - Confirms 2 seed rows present
# - Confirms 13 functions present
# - Identifies 18 missing policies + 2 misconfigured scholar policies
# - Reports migration registration pending

# Step 2: Execute live transactional reconciliation
npx tsx scripts/reconcile-staging-schema.ts --execute
```

### 3.4 Transaction Guarantees & Verification
- All policy synchronizations and the migration bookkeeping insert execute inside a single transaction (`BEGIN ... COMMIT`).
- If any policy creation fails or postcondition check in `pg_policies` or `routine_privileges` detects a mismatch, the script executes `ROLLBACK;` and exits with code 1.
- Zero tables are dropped, zero columns altered, zero seed rows truncated.
- **No `supabase db push` without `--dry-run`:** Ordinary `db push` is forbidden as it would attempt destructive re-execution.
- **No `supabase migration repair`:** Repair commands are forbidden as a substitute for SQL execution.

### 3.5 Post-Reconciliation Verification
Verify CLI migration history synchronization:
```bash
# 1. Verify migration status reported by Supabase CLI
npx supabase migration list --remote="$STAGING_DATABASE_URL"

# Expected Output:
# {"migrations":[{"local":"20261114000000","remote":"20261114000000"}],"message":"Migrations listed"}

# 2. Verify CLI push reports database is up to date
npx supabase db push --dry-run --remote="$STAGING_DATABASE_URL"

# Expected Output:
# {"upToDate":true,"message":"Remote database is up to date."}
```

---

## 4. Gate C: Hosted Integration Tests & Payment Sandbox Testing

### 4.1 Objective
Verify application-level data operations, client-side RLS enforcement, and cryptographic round-trips against the reconciled hosted database, followed by payment sandbox validation.

### 4.2 Preconditions
1. **Gate B Passed & Verified:** Reconciled state confirmed, CLI reports remote up to date.
2. **Credential Provisioning:** Operator exports Phase 2 credentials in untracked environment:
   - `NEXT_PUBLIC_SUPABASE_URL=https://zrjptpkhtklfgnovdrny.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=[STAGING_ANON_KEY]`
   - `SUPABASE_SERVICE_ROLE_KEY=[STAGING_SERVICE_ROLE_KEY]`
   - `KUNDLI_ENCRYPTION_KEY_V1=[64-HEX-STRING]`
   - `RATE_LIMIT_HMAC_SECRET=[32-BYTE-SECRET]`
3. **Razorpay Key Revocation & Rotation Confirmed:**
   - **MANDATORY PREREQUISITE FOR GATE C:** The operator must confirm that the previously exposed Razorpay test key has been permanently deactivated/revoked in the Razorpay dashboard, and a fresh sandbox key has been provisioned.
   - The credential exposure incident remains marked **UNRESOLVED** until dashboard confirmation is supplied.
4. **Explicit Operator Approval Gate C:** Operator grants separate explicit approval to execute hosted integration tests.

### 4.3 Test Sequence
```bash
# Step 1: Run comprehensive local test suite to ensure client code stability
npm run test:security

# Step 2: Verify typecheck
npm run typecheck

# Step 3: Run targeted hosted verification script (read-only queries first)
# Devotee public queries on scripture catalog & canonical verses
# Verify anonymous queries receive 0 rows for unverified verses without 42501 crash
# Verify authenticated devotee cannot view unverified verses
# Verify authenticated scholar can view unverified verses
```

---

## 5. Summary of Approval Gates & Operator Responsibilities

```
                                  [ START ]
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │        OPERATOR APPROVAL: GATE A             │
               │   (Authorize Hosted Staging Backup Only)     │
               │   Prerequisite: STAGING_DATABASE_URL only    │
               └──────────────────────────────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │    Execute scripts/backup-staging.ts         │
               │   Verify Checksums, Sizes & .meta.json       │
               │   Command: npx tsx backup-staging.ts --verify│
               └──────────────────────────────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │        OPERATOR APPROVAL: GATE B             │
               │ (Authorize Staging Reconciliation Execution) │
               │   Prerequisite: Verified Gate A Backup       │
               └──────────────────────────────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │ Execute scripts/reconcile-staging-schema.ts  │
               │ Verify CLI Sync: migration list & db push    │
               └──────────────────────────────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │  Operator: Confirm Razorpay Key Revocation   │
               │  Provision Fresh Sandbox Key & App Secrets   │
               └──────────────────────────────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │        OPERATOR APPROVAL: GATE C             │
               │ (Authorize Hosted App Integration Testing)   │
               │   Prerequisite: Reconciled DB + Rotated Keys │
               └──────────────────────────────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │   Execute Hosted Integration Test Suite      │
               │          CLOSE MILESTONE M03                 │
               └──────────────────────────────────────────────┘
```

**Standing Restriction:** Under NO circumstances may any command target production project `zxwkfnvmmxoojewhvsdc`.

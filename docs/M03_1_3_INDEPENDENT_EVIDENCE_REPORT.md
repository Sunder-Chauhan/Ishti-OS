# ISHTI Milestone M03.1.3: Independent Evidence Verification & Execution Safety Report

**Project:** ISHTI (Repository: `Sunder-Chauhan/Ishti-OS`, Branch: `main`)  
**Target Staging Supabase Project:** `zrjptpkhtklfgnovdrny` (Region `ap-south-1`, Mumbai)  
**Quarantined Production Supabase Project:** `zxwkfnvmmxoojewhvsdc` (**STRICTLY UNTOUCHED**)  
**Supabase CLI Target:** `3.1.0`  
**Milestone Scope:** Strictly Read-Only Independent Verification  
**Final Gate Verdict:** **`NOT READY — CREDENTIAL BLOCKERS`**  

---

## 1. Executive Summary & Verification Scope

In accordance with operator instructions for Milestone M03.1.3, an independent, strictly read-only technical verification was conducted across the codebase, Supabase CLI 3.1.0 engine, migration history bookkeeping, backup procedures, endpoint validation, and policy definitions.

**Zero remote mutations** were executed against either remote Supabase project (`zrjptpkhtklfgnovdrny` or `zxwkfnvmmxoojewhvsdc`). No remote backups or DDL/DML statements were sent to remote servers. All verification procedures were executed locally against isolated, native PostgreSQL 18.6 simulation environments using real Supabase schemas, real cryptographic engines, and the official Supabase CLI.

| Verification Area | M03.1.2 Status | M03.1.3 Independent Finding | Status |
|---|---|---|---|
| **Failed CLI Experiment** | Logged exit code 1 without explanation | Root cause identified (PowerShell backtick escaping + external directory module resolution + URL protocol format); in-repo reproducible test passing | **RESOLVED** |
| **Migration Bookkeeping** | Indicated pass via CLI | Verified exact `schema_migrations` DDL, `migration list`, and `db push --dry-run` interoperability | **VERIFIED** |
| **Backup Commands & Restore** | Syntax confirmed, restoration unvalidated | Executed 3-pass CLI dump inspection, full local database restore, verified 11 tables, 31 policies, seed data, and migration record | **VERIFIED** |
| **Endpoint Validator** | Substring / prefix check | Tightened to exact pooler username (`postgres.zrjptpkhtklfgnovdrny`) and exact direct username (`postgres`); added 4 unit tests (13 total) | **HARDENED** |
| **Remote Script Coverage** | Single runner only | Added dedicated `scripts/backup-staging.ts` sharing `validateStagingDatabaseUrl`; zero unvalidated paths | **COMPLETE** |
| **Policy Matrix (31 Policies)** | Reported pass | Line-by-line verification against SQL AST; confirmed `TO authenticated` and `REVOKE EXECUTE FROM PUBLIC` on scholar policies | **VERIFIED** |
| **Razorpay Key Rotation** | Exposed test key | Hard-blocked; awaiting dashboard revocation by account owner | **BLOCKED** |
| **Staging Execution Approval** | Not approved | Staging database untouched; quarantined production untouched | **ENFORCED** |

---

## 2. Post-Mortem: Resolution of the Failed CLI Experiment

### 2.1 The Issue
The M03.1.2 execution log contained a failed background task:
```
test Supabase CLI with schema_migrations record — Exited with code 1
```
The previous report did not adequately document the specific cause of this failure, leaving technical ambiguity regarding whether the Supabase CLI or `schema_migrations` record had failed.

### 2.2 Root Cause Analysis
Independent investigation of the full transcript logs (`transcript_full.jsonl`, steps 3764–3770) reveals three distinct sequential issues:

1. **PowerShell Inline String Syntax Error (Step 3764):**
   - *Command:* Inline `node -e` command evaluated via Windows PowerShell.
   - *Error:* `SyntaxError: Invalid or unexpected token` at `[eval]:21 await testClient.query(\`.
   - *Cause:* PowerShell stripped and misinterpreted backticks inside the inline template string before passing it to Node.js.
2. **Node.js Module Resolution Failure (Step 3767 & 3769):**
   - *Command:* `node scratch/test_cli_migration.js` and `npx tsx scratch/test_cli_migration.js`.
   - *Error:* `MODULE_NOT_FOUND: Cannot find module 'embedded-postgres'`.
   - *Cause:* The script was created in the scratch directory `<appDataDir>/brain/<conversation-id>/scratch/` outside the workspace root (`spiritual-OS`). Node.js module resolution traverses upward from the script file location. Because no `node_modules` exists above the scratch directory, Node.js failed to resolve `embedded-postgres`.
3. **Supabase CLI Protocol Prefix Requirement (Discovered in M03.1.3):**
   - *Command:* `npx.cmd supabase migration list --remote="postgresql://..."`
   - *Error:* `{"_tag":"Error","error":{"code":"InvalidValue","message":"--remote takes a postgres:// URL, a project ref or a branch name."}}`
   - *Cause:* The official Supabase CLI `--remote` argument strictly requires the `postgres://` protocol prefix, rejecting `postgresql://`.

### 2.3 Corrective Action & Reproducible Passing Test
To resolve this permanently and cleanly:
1. Created an in-repo verification suite: [`scripts/verify-migration-compat.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/verify-migration-compat.ts).
2. Placed the script within `scripts/` so it natively inherits the repository's root `node_modules`.
3. Normalized connection strings passed to Supabase CLI to use the `postgres://` prefix.
4. Added the npm lifecycle script: `"test:migration-compat": "npx tsx scripts/verify-migration-compat.ts"`.
5. Execution verified: **Exited with code 0** (see Section 3).

---

## 3. Migration History Compatibility & Bookkeeping Proof

The reconciliation script records the baseline migration in `supabase_migrations.schema_migrations` during the reconciliation transaction. Independent testing was conducted using embedded PostgreSQL 18 and Supabase CLI 3.1.0 to prove equivalence with official CLI behavior.

### 3.1 `supabase_migrations.schema_migrations` Table Structure
Verification via `information_schema.columns` confirmed the exact schema:
- `version`: `text` (NOT NULL, PRIMARY KEY)
- `statements`: `ARRAY` / `text[]` (NULLABLE)
- `name`: `text` (NULLABLE)

### 3.2 Registration SQL Verification
The reconciliation script executes:
```sql
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version TEXT PRIMARY KEY,
  statements TEXT[],
  name TEXT
);
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261114000000', 'initial_schema')
ON CONFLICT (version) DO UPDATE
  SET name = EXCLUDED.name;
```

### 3.3 Supabase CLI Interoperability Results
Running against a test database with this exact record yielded:

1. **`npx supabase migration list --remote="postgres://..."`**:
   ```json
   {
     "migrations": [
       { "local": "20261114000000", "remote": "20261114000000", "time": "2026-11-14 00:00:00" }
     ],
     "message": "Migrations listed"
   }
   ```
   *Result:* **PASS** — Both local and remote are synchronized at `20261114000000`.

2. **`npx supabase db push --dry-run --remote="postgres://..."`**:
   ```json
   {
     "upToDate": true,
     "dryRun": true,
     "migrations": [],
     "seeds": [],
     "roles": [],
     "message": "Remote database is up to date."
   }
   ```
   *Result:* **PASS** — The CLI recognizes that zero pending migrations exist.

3. **Repeat-Run Idempotency:**
   - Repeated execution of the `INSERT ... ON CONFLICT (version) DO UPDATE` query resulted in exactly 1 record remaining.
   - Zero errors or duplicate key violations.

4. **Transaction Rollback Proof:**
   - Testing an uncommitted migration insert followed by `ROLLBACK` verified that uncommitted migration records are discarded cleanly without leaving residual artifacts.

*Detailed report:* [docs/M03_1_3_MIGRATION_HISTORY_COMPATIBILITY.md](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_3_MIGRATION_HISTORY_COMPATIBILITY.md)

---

## 4. Backup Commands & Restoration Validation

Testing in [`scripts/verify-backup-restore.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/verify-backup-restore.ts) independently validated the 3-pass Supabase CLI backup architecture.

### 4.1 The 3-Pass Backup Commands
```bash
# Pass 1: Schema DDL (public and supabase_migrations)
npx supabase db dump --remote="postgres://..." --schema public,supabase_migrations --keep-comments -f supabase/backups/staging_schema.sql

# Pass 2: Data Records (public and supabase_migrations)
npx supabase db dump --remote="postgres://..." --schema public,supabase_migrations --data-only --use-copy -f supabase/backups/staging_data.sql

# Pass 3: Cluster Roles
npx supabase db dump --remote="postgres://..." --role-only -f supabase/backups/staging_roles.sql
```

### 4.2 CLI Engine Inspection via `--dry-run`
Inspection of the underlying bash pipelines emitted by Supabase CLI 3.1.0 demonstrated:
- **Schema Dump:** Invokes `pg_dump --schema-only --schema=public|supabase_migrations` piped through sed expressions that inject `IF NOT EXISTS` on `CREATE TABLE` / `CREATE SCHEMA` statements and comment out `supabase_admin` default privileges.
- **Data Dump:** Automatically prepends `SET session_replication_role = replica;` (temporarily disabling triggers during restore) and appends `RESET ALL;`.
- **Role Dump:** Invokes `pg_dumpall --roles-only` and passes through an awk/sed filter that **strips all Supabase reserved roles** (`anon`, `authenticated`, `service_role`, `postgres`, `supabase_admin`).

### 4.3 End-to-End Restoration Test Results
Schema and data dumps were restored into a secondary clean disposable database. Post-restoration verification confirmed:
- **Tables:** 11/11 application tables created with RLS enabled.
- **Policies:** Exactly 31 active RLS policies in `pg_policies`.
- **Migration History:** Version `20261114000000` (`initial_schema`) present in `supabase_migrations.schema_migrations`.
- **Seed & User Data:** Exact row counts verified (`scripture_catalog`: 1, `canonical_verses`: 1, `profiles`: 1, `user_consents`: 1).
- **Restoration Errors:** Exactly 0.

*Detailed report:* [docs/M03_1_3_BACKUP_RESTORE_TEST.md](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_3_BACKUP_RESTORE_TEST.md)

---

## 5. Endpoint Security & Allowlist Hardening

The endpoint validator in [`scripts/validate-staging-url.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/validate-staging-url.ts) was tightened and extended:

1. **Exact Pooler Username Match:**
   - Changed from prefix match (`rawUser.startsWith(...)`) to **exact equality**:
     `rawUser === "postgres." + APPROVED_STAGING_PROJECT_REF`
   - Suffix-extended usernames (e.g. `postgres.zrjptpkhtklfgnovdrny_evil` or `postgres.zrjptpkhtklfgnovdrny.admin`) are strictly rejected.
2. **Direct Connection Username Enforcement:**
   - Verified that direct connection username must strictly equal `"postgres"`.
3. **Comprehensive Script Coverage:**
   - Authored [`scripts/backup-staging.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/backup-staging.ts), importing `validateStagingDatabaseUrl`.
   - Verified that **every remote execution path** in the repository validates the exact allowlist before connecting.
4. **Unit Test Suite (13 Tests):**
   - Added 4 new security unit tests in [`scripts/run-comprehensive-tests.js`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/run-comprehensive-tests.js):
     - Test 10: Suffix-extended pooler usernames strictly rejected.
     - Test 11: Non-postgres username on direct connection rejected.
     - Test 12: Production project reference in URL query string rejected.
     - Test 13: Zero credential exposure in sanitized outputs and exceptions.
   - Result: **All 13 Staging URL Validator unit tests passed (100%)**.

---

## 6. Exact SQL & Policy Verification Matrix (All 31 Policies)

An independent line-by-line comparison was performed between Section 11 of [`supabase/migrations/20261114000000_initial_schema.sql`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/supabase/migrations/20261114000000_initial_schema.sql) and the reconciliation expectations:

| # | Table Name | Policy Name | Command | Target Roles | USING Clause | WITH CHECK Clause |
|---|---|---|---|---|---|---|
| 1 | `profiles` | Users can view their own profile | SELECT | `{public}` | `(auth.uid() = id)` | — |
| 2 | `profiles` | Admins can view all profiles | SELECT | `{public}` | `(public.is_admin())` | — |
| 3 | `profiles` | Users can update their own profile | UPDATE | `{public}` | `(auth.uid() = id)` | `(auth.uid() = id)` |
| 4 | `role_assignment_audit` | Admins can view role audit | SELECT | `{public}` | `(public.is_admin())` | — |
| 5 | `user_consents` | Users can view their own consents | SELECT | `{public}` | `(auth.uid() = user_id)` | — |
| 6 | `user_consents` | Users can insert their own consents | INSERT | `{public}` | — | `(auth.uid() = user_id)` |
| 7 | `user_consents` | Users can update their own consents | UPDATE | `{public}` | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| 8 | `user_consents` | Admins can view all consents | SELECT | `{public}` | `(public.is_admin())` | — |
| 9 | `scripture_catalog` | Public read scripture catalog | SELECT | `{public}` | `(status = 'curated' AND rights_clearance_status = 'cleared')` | — |
| 10 | `scripture_catalog` | Scholars and admins can manage scripture catalog | ALL | `{authenticated}` | `(public.is_scholar())` | `(public.is_scholar())` |
| 11 | `canonical_verses` | Public read verified verses | SELECT | `{public}` | `(review_status = 'verified' AND rights_clearance_status = 'cleared')` | — |
| 12 | `canonical_verses` | Scholars and admins can manage verses | ALL | `{authenticated}` | `(public.is_scholar())` | `(public.is_scholar())` |
| 13 | `kundli_profiles` | Owner-only select kundli | SELECT | `{public}` | `(auth.uid() = user_id)` | — |
| 14 | `kundli_profiles` | Owner-only insert kundli | INSERT | `{public}` | — | `(auth.uid() = user_id)` |
| 15 | `kundli_profiles` | Owner-only update kundli | UPDATE | `{public}` | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| 16 | `kundli_profiles` | Owner-only delete kundli | DELETE | `{public}` | `(auth.uid() = user_id)` | — |
| 17 | `expert_profiles` | Public read active experts | SELECT | `{public}` | `(is_active = TRUE AND verification_status = 'accredited')` | — |
| 18 | `expert_profiles` | Experts can view their own profile | SELECT | `{public}` | `(auth.uid() = user_id)` | — |
| 19 | `expert_profiles` | Admins can view all expert profiles | SELECT | `{public}` | `(public.is_admin())` | — |
| 20 | `expert_profiles` | Experts can update their own profile | UPDATE | `{public}` | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| 21 | `consultation_slots` | Public view available slots | SELECT | `{public}` | `(is_booked = FALSE AND EXISTS (...accredited expert...))` | — |
| 22 | `consultation_slots` | Experts can manage their own slots | ALL | `{public}` | `(EXISTS (...expert user_id = auth.uid()...))` | — |
| 23 | `booking_requests` | Devotees can view their bookings | SELECT | `{public}` | `(auth.uid() = user_id)` | — |
| 24 | `booking_requests` | Experts can view assigned bookings | SELECT | `{public}` | `(EXISTS (...expert user_id = auth.uid()...))` | — |
| 25 | `booking_requests` | Admins can view all bookings | SELECT | `{public}` | `(public.is_admin())` | — |
| 26 | `booking_requests` | Devotees can create bookings | INSERT | `{public}` | — | `(auth.uid() = user_id)` |
| 27 | `booking_requests` | Devotees can update their own bookings | UPDATE | `{public}` | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| 28 | `booking_requests` | Admins can update bookings | UPDATE | `{public}` | `(public.is_admin())` | — |
| 29 | `early_access_subscribers` | Public insert early access | INSERT | `{public}` | — | `(true)` |
| 30 | `early_access_subscribers` | Admins only view early access subscribers | SELECT | `{public}` | `(public.is_admin())` | — |
| 31 | `rate_limit_events` | Admins can view rate limit events | SELECT | `{public}` | `(public.is_admin())` | — |

### 6.1 Critical Scholar Policy Verification
- **Policies 10 & 12:** Both `scripture_catalog` and `canonical_verses` management policies explicitly declare `TO authenticated`.
- **Privilege Revocation:** Section 10 of the migration executes:
  ```sql
  REVOKE ALL ON FUNCTION public.is_scholar() FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.is_scholar() TO authenticated;
  ```
- **Security Guarantee:** Anonymous (`anon`) or unauthenticated users can never evaluate `public.is_scholar()`.

---

## 7. Credential Incident Status

1. **Razorpay Sandbox Key:**
   - Previously exposed test credential `rzp_test_...` remains classified as **`BLOCKED / PENDING DASHBOARD REVOCATION`**.
   - No replacement secret has been requested, printed, or committed.
   - Live payment integration tests remain quarantined until dashboard revocation is confirmed by the account owner.
2. **Staging Database Credentials:**
   - `STAGING_DATABASE_URL` remains unset in tracked source and git.
   - All tests use local disposable PostgreSQL instances; hosted staging database remains untouched.

---

## 8. Test Suite & Build Verification Summary

- **Security & Integrity Suite:** `102 passed, 0 failed` (100% passing across all 5 active categories; 3 pending remote infrastructure).
- **Migration Compatibility Suite:** `scripts/verify-migration-compat.ts` passed (100%).
- **Backup & Restore Suite:** `scripts/verify-backup-restore.ts` passed (100%).
- **TypeScript Typecheck:** `npm run typecheck` passed with **0 errors** across mobile, web, and types packages.

---

## 9. Final Gate Verdict & Boundary Enforcement

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           VERDICT: NOT READY — CREDENTIAL BLOCKERS                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Reason for Verdict
While **all source-level, script, migration bookkeeping, backup command, and local restoration verifications have passed with 100% proof**, execution against the remote staging database is strictly withheld because:
1. Razorpay key rotation remains pending in the external merchant dashboard.
2. Hosted staging credentials (`STAGING_DATABASE_URL`) have not been provided for execution.
3. Explicit staging execution approval has not yet been granted.

### Strict Environment Boundary Summary
- Remote Staging Project (`zrjptpkhtklfgnovdrny`): **UNTOUCHED (0 mutations, 0 remote queries).**
- Quarantined Production Project (`zxwkfnvmmxoojewhvsdc`): **HARD-BLOCKED & QUARANTINED.**
- Secrets: **ZERO COMMITTED, ZERO LOGGED, ZERO REQUESTED.**

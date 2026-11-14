# ISHTI M03.1.1 — Staging Reconciliation Execution Readiness Checklist

**Document Version:** 1.0.0  
**Date:** 2026-11-15  
**Milestone:** ISHTI M03.1.1 (Reconciliation Script Verification & Execution Readiness)  
**Repository:** `Sunder-Chauhan/Ishti-OS` (internal codename `spiritual-OS`)  
**Branch:** `main`  
**Current Baseline Commit:** `2f2cd78aac9dea0b7c7c08fe22e0d49f88804b7f`  
**Target Staging Project:** `ishti-staging` (`zrjptpkhtklfgnovdrny`, Region: `ap-south-1`)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**ABSOLUTE ZERO-MUTATION BOUNDARY**)  

---

## 1. Status Label Taxonomy

Every checklist item in this milestone is evaluated and assigned one of the following explicit status labels:

- **`[PASS]`**: Verified, tested, and meeting all security and architectural specifications.
- **`[FAIL]`**: Tested and failed specifications; requires engineering remediation.
- **`[BLOCKED]`**: Execution blocked due to missing external dependencies, secrets, or approvals.
- **`[NOT VERIFIED]`**: Cannot be definitively proven under current configuration (e.g., unset exclusions).
- **`[SIMULATED]`**: Verified locally using simulated PostgreSQL 18 or Supabase CLI; pending remote execution.
- **`[NOT TESTED]`**: Remote tests intentionally not yet run against hosted infrastructure.

---

## 2. Checklist Matrix

### 2.1 Repository & Code Integrity

| Item | Requirement | Verification Method | Status | Details / Notes |
|---|---|---|:---:|---|
| **REP-01** | Git Branch & Working Tree | `git status`, `git branch --show-current` | `[PASS]` | On branch `main`. Baseline commit `2f2cd78`. Working tree clean prior to M03.1.1 updates. |
| **REP-02** | Migration File Integrity | Cryptographic SHA-256 Checksum | `[PASS]` | `3399a7317e1933f989d4a9688cac84d6d407006e930614ad90508efa52ea87ed` (43,836 bytes, 1,040 lines). |
| **REP-03** | Git History Immutability | Audit of commit log & remotes | `[PASS]` | Zero history rewrites, zero force-pushes. Historical commits preserved honestly. |
| **REP-04** | Backup & Secret Git Exclusion | `.gitignore` inspection | `[PASS]` | `.gitignore` explicitly excludes `.env*`, `supabase/backups/`, `backups/`, `*.dump`, `*.backup`, `*.sql.gz`, `*.tar`. |
| **REP-05** | Production Decoupling | Repository-wide codebase search | `[PASS]` | Zero references to production ref `zxwkfnvmmxoojewhvsdc` in application code or configuration. |

### 2.2 Cryptographic Keys & Secret Hygiene

| Item | Requirement | Verification Method | Status | Details / Notes |
|---|---|---|:---:|---|
| **KEY-01** | AES-256 Kundli Encryption Key | Format: 64-char hex, 32 decoded bytes | `[PASS]` | Generated via `crypto.randomBytes(32)` in staging setup. Validated in `.env` and `apps/web/.env.local`. |
| **KEY-02** | Rate Limiting HMAC Secret | Format: String $\ge 32$ bytes | `[PASS]` | Generated via `crypto.randomBytes(32).toString('hex')` (64 bytes). Validated in staging environment files. |
| **KEY-03** | Staging Secret Key Consistency | Root `.env` vs `apps/web/.env.local` | `[PASS]` | Both files contain identical staging cryptographic secrets. |
| **KEY-04** | Staging Key Separation | Not equal to production keys | `[NOT VERIFIED]` | `PROD_KEYS_TO_EXCLUDE` is unset in local environment. Reported truthfully as `[NOT VERIFIED]`. |
| **KEY-05** | Razorpay Sandbox Credential Rotation | Dashboard rotation of exposed key pair | `[BLOCKED]` | Hardcoded literals purged from source code; live key pair remains pending rotation in Razorpay Dashboard by account owner. |
| **KEY-06** | Tracked File Secret Scans | Git repository & history scan | `[PASS]` | Current working tree contains zero credentials, secrets, or key markers. |

### 2.3 Staging Database Drift & Object Inventory

| Item | Target Requirement | Baseline Live Staging State | Status | Drift Details |
|---|---|---|:---:|---|
| **DB-01** | Public Application Tables (11) | 11 tables present | `[PASS]` | All 11 tables exist with RLS enabled: `profiles`, `role_assignment_audit`, `user_consents`, `scripture_catalog`, `canonical_verses`, `kundli_profiles`, `booking_requests`, `pandit_accreditations`, `rate_limit_events`, `subscribers`, `astrology_computation_audit`. |
| **DB-02** | Initial Seed Rows | 2 rows present | `[PASS]` | 1 row in `scripture_catalog` (Rigveda 10.191.2), 1 row in `canonical_verses`. Both marked `pending_clearance`. |
| **DB-03** | Database Functions (12) | 12 functions present | `[PASS]` | All 12 PL/pgSQL functions present with `SECURITY DEFINER` and `SET search_path = ''`. |
| **DB-04** | Database Triggers (7) | 7 triggers present | `[PASS]` | All 7 integrity triggers present (`trg_prevent_role_escalation`, `trg_validate_and_reserve_slot`, etc.). |
| **DB-05** | Row-Level Security Policies (31) | 13 policies present | `[FAIL]` | **18 policies missing**; **2 scholar policies drifted** to `{public}` role scope. Requires reconciliation. |
| **DB-06** | Migration History Table | 0 recorded migrations | `[FAIL]` | `supabase_migrations.schema_migrations` empty. Requires recording version `20261114000000` post-reconciliation. |

### 2.4 Reconciliation Script Verification (`reconcile-staging-schema.ts`)

| Item | Feature / Safeguard | Verification Method | Status | Details / Notes |
|---|---|---|:---:|---|
| **SCR-01** | Production Project Hard-Block | CLI test with fake production URL | `[PASS]` | Immediately aborts with exit code 1 if `zxwkfnvmmxoojewhvsdc` is detected. Tested and verified. |
| **SCR-02** | Staging Project Allowlist | CLI test with non-staging URL | `[PASS]` | Immediately aborts with exit code 1 if `zrjptpkhtklfgnovdrny` is absent. Tested and verified. |
| **SCR-03** | Dry-Run Default | CLI invocation without `--execute` | `[PASS]` | Defaults to read-only inspection; exits cleanly with 0 mutations. Tested and verified. |
| **SCR-04** | Explicit `--execute` Gate | CLI argument parsing | `[PASS]` | Mutation requires explicit `--execute` argument along with valid `STAGING_DATABASE_URL`. |
| **SCR-05** | Transaction Atomicity & Rollback | Code audit & simulated failure | `[PASS]` | Wrapped in `BEGIN ... COMMIT / ROLLBACK`. Reverts all changes if any postcondition fails. |
| **SCR-06** | Non-Destructive Invariants | SQL statement analysis | `[PASS]` | Zero `DROP TABLE`, zero `TRUNCATE`, zero column alterations, zero seed row deletion. |
| **SCR-07** | Policy Idempotency | `DROP POLICY IF EXISTS ... CREATE POLICY` | `[PASS]` | Single-statement atomic drop-and-recreate pattern eliminates duplicate policy collisions. |
| **SCR-08** | Scholar Role Scope Hardening | Exact policy definition match | `[PASS]` | Explicitly sets `TO authenticated` and `WITH CHECK (public.is_scholar() OR public.is_admin())`. |
| **SCR-09** | Exact 31-Policy Postcondition | Query against `pg_policies` | `[PASS]` | Baseline defect remediated; validates all 31 policies, tables, commands, roles, and clauses. |
| **SCR-10** | Function Execution Privilege Check | Query against `routine_privileges` | `[PASS]` | Validates `is_scholar` has execute privileges revoked from `PUBLIC` and `anon`. |
| **SCR-11** | Safe Migration Registration | Insert into `schema_migrations` | `[PASS]` | Registers version `20261114000000` with `ON CONFLICT (version) DO NOTHING` inside transaction. |

### 2.5 Automated Test Execution Status

| Category | Suite / Runner | Tests Passed | Tests Failed | Status | Execution Tier |
|---|---|:---:|:---:|:---:|---|
| **1. Static Integrity** | `run-comprehensive-tests.js` | 29 | 0 | `[PASS]` | Static code analysis & regex scanners |
| **2. Cryptography & Net** | `run-comprehensive-tests.js` | 31 | 0 | `[PASS]` | Unit tests (AES-256-GCM, AAD, proxy headers, IP validation) |
| **3. Application Integration** | `run-comprehensive-tests.js` | 3 | 0 | `[PASS]` | Service integration & server-only boundaries |
| **4. PostgreSQL 18 & RLS** | Embedded PG 18 (port 54321) | 22 | 0 | `[SIMULATED]` | Native PostgreSQL with multi-connection pools & RLS evaluation |
| **5. Concurrency & Locking** | Embedded PG 18 (port 54321) | 4 | 0 | `[SIMULATED]` | Advisory lock concurrency & slot reservation race tests |
| **Total Executed Tests** | Local Automated Test Suite | **89** | **0** | `[PASS]` | **100% pass rate** across all executed local tests |
| **6. Hosted Staging Tests** | Remote Staging (`zrjptpkhtklfgnovdrny`) | 0 | 0 | `[NOT TESTED]` | Remote queries pending reconciliation execution & credentials |

### 2.6 Credential Availability & Configuration

| Credential Name | Environment Scope | Current Value State | Status | Action Required |
|---|---|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Client | `https://zrjptpkhtklfgnovdrny.supabase.co` | `[PASS]` | Configured and pointing to staging. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Client | `awaiting_staging_publishable_anon_key` | `[BLOCKED]` | Staging project anon key must be retrieved from Supabase dashboard. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only Secret | `awaiting_staging_secret_service_role_key` | `[BLOCKED]` | Staging project service role key must be retrieved from Supabase dashboard. |
| `STAGING_DATABASE_URL` | Infrastructure Secret | Unset in local environment | `[BLOCKED]` | Direct/Pooler connection string required for reconciliation runner. |
| `PROD_KEYS_TO_EXCLUDE` | Verification Variable | Unset in local environment | `[NOT VERIFIED]` | Optional exclusion list for production key comparison verifier. |
| `RAZORPAY_KEY_ID` / `_SECRET` | Sandbox Third-Party | Purged from source; unrotated in dashboard | `[BLOCKED]` | Account owner must rotate sandbox test key in Razorpay dashboard. |

---

## 3. Final Execution Readiness Verdict

Select exactly one of the four milestone verdict options:

1. `READY FOR EXPLICIT STAGING EXECUTION APPROVAL`
2. `NOT READY — SCRIPT DEFECTS`
3. **`NOT READY — CREDENTIAL BLOCKERS`**
4. `NOT READY — DATABASE DRIFT OR VERIFICATION GAPS`

### Assigned Verdict:
# **`NOT READY — CREDENTIAL BLOCKERS`**

### Detailed Justification:
1. **Script Verification Complete:** All four baseline script defects in `scripts/reconcile-staging-schema.ts` (slice marker mismatch, missing staging allowlist, superficial policy checks, missing routine privilege checks) have been identified, remediated, and verified. The script is technically sound, non-destructive, transactionally atomic, and safe.
2. **Local Simulation Complete:** 89/89 automated tests pass with 100% success rate across static, cryptographic, PostgreSQL 18 simulation, and concurrency suites. TypeScript typecheck passes with 0 errors.
3. **Credential Blockers:**
   - `STAGING_DATABASE_URL` is unset in the local environment, preventing the script from connecting to the staging database.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` remain unpopulated placeholders in `.env` and `apps/web/.env.local`.
   - The compromised Razorpay sandbox key pair remains pending rotation in the Razorpay Dashboard.
   - `PROD_KEYS_TO_EXCLUDE` is unset, leaving production-key non-reuse as `[NOT VERIFIED]`.
4. **Governance Gate:** Remote database mutation against `zrjptpkhtklfgnovdrny` remains strictly prohibited until real staging credentials are provided and the operator explicitly authorizes execution.

---

## 4. Operator Action Items to Unblock Execution

To transition from `NOT READY — CREDENTIAL BLOCKERS` to `READY FOR EXPLICIT STAGING EXECUTION APPROVAL`:

1. **Retrieve Staging Database Credentials:**
   - In Supabase Dashboard -> `ishti-staging` (`zrjptpkhtklfgnovdrny`) -> Project Settings -> Database.
   - Obtain connection string (port 5432 direct or 6543 pooler).
2. **Retrieve Staging API Keys:**
   - In Supabase Dashboard -> Project Settings -> API.
   - Copy `anon` publishable key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy `service_role` secret key to `SUPABASE_SERVICE_ROLE_KEY`.
3. **Rotate Razorpay Sandbox Key:**
   - In Razorpay Dashboard -> Settings -> API Keys -> Regenerate Key.
   - Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in local environment.
4. **Execute Pre-Reconciliation Backup:**
   ```bash
   npx supabase db dump --project-ref zrjptpkhtklfgnovdrny -f supabase/backups/staging_pre_reconciliation.sql
   ```
5. **Execute Reconciliation Runner with Explicit Approval:**
   ```bash
   STAGING_DATABASE_URL="postgresql://..." npx tsx scripts/reconcile-staging-schema.ts --execute
   ```

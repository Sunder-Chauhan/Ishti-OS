# ISHTI Milestone M03.2.1: Gate A Backup Readiness Review

**Document Version:** 1.0  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Current Branch:** `main`  
**Baseline Git Commit:** `906caf1`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**HARD-QUARANTINED — ZERO REMOTE ACCESS**)  
**Milestone Type:** Inspection-Only Readiness Audit  
**Review Status:** **COMPLETE**  
**Final Verdict:** **`READY FOR EXPLICIT GATE A APPROVAL`**  

---

## 1. Executive Summary

Milestone **M03.2.1** performs a comprehensive inspection and verification of the staging backup implementation, credential dependencies, failure containment policies, and governance safeguards prior to requesting explicit operator authorization for **Gate A (Hosted Staging Backup)**.

In accordance with strict project governance:
- **Zero remote operations** were executed against either the staging database (`zrjptpkhtklfgnovdrny`) or the quarantined production database (`zxwkfnvmmxoojewhvsdc`).
- **Production remains completely untouched and quarantined.**
- **No secrets, tokens, or passwords were logged or committed.**
- All backup tooling, URL validators, checksum verifiers, and failure recovery handlers have been verified locally via automated unit and integration tests (106/106 tests passed).

---

## 2. Implementation Audit: Code & Configuration

The backup and validation architecture is anchored by two hardened TypeScript implementations in `scripts/`:

### 2.1 Staging Endpoint Validator (`scripts/validate-staging-url.ts`)
- **WHATWG URL Parsing:** Strict URL parsing rejecting malformed URIs, non-standard protocols (only `postgresql:` and `postgres:` permitted).
- **Production Hard-Block:** Active inspection of hostname, decoded username, query string, and raw URL text against `zxwkfnvmmxoojewhvsdc`. Any match immediately triggers `CRITICAL SECURITY VIOLATION` and aborts execution.
- **Strict Hostname Allowlist:** Only two host patterns are permitted:
  1. Direct Host: `db.zrjptpkhtklfgnovdrny.supabase.co` on port `5432`, database `/postgres`, username `postgres`.
  2. Pooler Host: `aws-0-ap-south-1.pooler.supabase.com` on port `5432` or `6543`, database `/postgres`, exact username `postgres.zrjptpkhtklfgnovdrny` (rejects arbitrary suffixes).
- **Sanitized URL Generation:** Credential masking replaces raw passwords with `:*****@` for safe display in operator consoles.

### 2.2 Backup Runner & Integrity Verifier (`scripts/backup-staging.ts`)
- **Default Mode:** Dry-run inspection. Analyzes `STAGING_DATABASE_URL`, validates the endpoint, prints planned target paths, and exits without executing commands or mutating files.
- **Execution Mode:** Requires explicit `--execute` flag.
- **Cross-Platform CLI Compatibility:** Automatically selects `npx.cmd` on Windows and `npx` on POSIX environments (`process.platform === "win32"`).
- **Credential Sanitization in Error Logs:** Implements `sanitizeErrorMessage()` wrapping all `execSync` output and error objects, scrubbing plaintext passwords and normalizing connection strings to `postgres://[REDACTED_CREDENTIALS]@...` before logging.
- **Cryptographic SHA-256 Manifest:** Emits a companion metadata manifest (`supabase/backups/staging_backup_[TIMESTAMP].meta.json`) recording timestamp, project reference, CLI version, and exact file sizes and SHA-256 hashes for all passes.
- **Automated Verification Mode (`--verify`):** Provides built-in CLI verification (`npx tsx scripts/backup-staging.ts --verify [timestamp]`) to confirm manifest existence, project attribution, file presence, non-zero file sizes, and cryptographic SHA-256 checksum parity.

---

## 3. Credential Dependency Decoupling

### 3.1 Separation of Razorpay Key Rotation from Gate A & Gate B
In prior documentation iterations, Razorpay key revocation was listed sequentially before Gate A. Under M03.2.1:
- **Database Backup (Gate A)** and **Schema Reconciliation (Gate B)** require exclusively database connection authorization (`STAGING_DATABASE_URL`) to staging project `zrjptpkhtklfgnovdrny`.
- **Payment Sandbox Testing (Gate C)** is the first operational phase that exercises the payment provider integration.
- Therefore, **Razorpay key rotation is decoupled from Gate A and Gate B.** Gate A and Gate B may proceed without blocking on Razorpay dashboard operations.
- **Razorpay key rotation remains an absolute prerequisite for Gate C.**

### 3.2 Unresolved Credential Exposure Status
The previously exposed Razorpay test key (`rzp_test_...`) remains marked **UNRESOLVED** in the project risk register:
- Git removal, verifier hardening, and environment masking have eliminated the key from the source code.
- However, **revocation cannot be inferred from repository state**.
- The incident will be marked **RESOLVED** only upon explicit operator confirmation that the key has been permanently deactivated in the Razorpay dashboard and a fresh test secret generated.

---

## 4. Audit of Backup Execution Mechanics

### 4.1 Supabase CLI 3.1.0 Command Syntax Verification
The three-pass logical backup structure executed by `scripts/backup-staging.ts` utilizes verified Supabase CLI v3 command flags:

| Pass | Target Content | Supabase CLI Command Syntax | Flags & Purpose |
|---|---|---|---|
| **Pass 1** | Schema DDL | `supabase db dump --remote="postgres://..." --schema public,supabase_migrations --keep-comments -f "<schemaFile>"` | Dumps table schemas, triggers, indexes, and RLS policies for `public` and `supabase_migrations`. Retains SQL comments. Excludes table data and cluster roles. |
| **Pass 2** | Table Data | `supabase db dump --remote="postgres://..." --schema public,supabase_migrations --data-only --use-copy -f "<dataFile>"` | Exports table rows using PostgreSQL `COPY` syntax. Disables triggers on restore via `SET session_replication_role = replica;`. Dumps seed data for `scripture_catalog` and `canonical_verses`. Excludes DDL. |
| **Pass 3** | Cluster Roles | `supabase db dump --remote="postgres://..." --role-only -f "<rolesFile>"` | Dumps cluster roles for disaster-recovery reference only. Strips reserved platform roles (`supabase_admin`, etc.). |

### 4.2 Output Directory & Filesystem Isolation
- All backup artifacts are written to `supabase/backups/`.
- The directory and all contained files (`*.sql`, `*.json`, `*.dump`) are explicitly excluded from version control by `.gitignore` (verified via `git check-ignore`).
- Local access permissions must be locked down immediately following generation (`chmod 600` on POSIX; `icacls` restricted inheritance on Windows).

### 4.3 Safe Handling of Partial Failures
If any individual pass fails during backup execution:
1. The overall backup is immediately reported as **`FAILED`** (never `PARTIAL SUCCESS`).
2. All partial files generated during that specific attempt are isolated and renamed with a `.FAILED_INCOMPLETE` suffix (or cleanly removed).
3. A failure audit manifest (`staging_backup_[TIMESTAMP].FAILED.json`) is recorded documenting the failed pass and sanitized error message.
4. **Historical Preservation:** Pre-existing valid backups from earlier runs are **NEVER deleted or touched**.
5. **Zero External Uploads:** The runner writes strictly to local disk; zero automated uploads to S3, GCS, or third-party cloud services are attempted.

---

## 5. Backup Integrity Requirements Matrix

A backup is classified as **VALID AND RECOVERY-READY** only when all seven conditions below are satisfied:

| # | Integrity Criterion | Verification Method | Enforcement Mechanism | Status |
|---|---|---|---|:---:|
| 1 | **All Three Dump Files Exist** | Filesystem inspection (`schema`, `data`, `roles`) | `verifyBackupIntegrity()` in runner | **VERIFIED** |
| 2 | **Non-Zero File Sizes** | `fs.statSync().size > 0` on all 3 dumps | `verifyBackupIntegrity()` in runner | **VERIFIED** |
| 3 | **SHA-256 Checksums Match** | `crypto.createHash('sha256')` matches manifest | `scripts/backup-staging.ts --verify` | **VERIFIED** |
| 4 | **Staging Project Attribution** | Manifest records `zrjptpkhtklfgnovdrny` | Manifest schema assertion | **VERIFIED** |
| 5 | **Strict Git Exclusion** | `git status --ignored supabase/backups/` | `.gitignore` rule line 16 | **VERIFIED** |
| 6 | **Local Filesystem Permissions** | `chmod 600` or Windows ACL inheritance stripped | Operator post-backup runbook action | **DOCUMENTED** |
| 7 | **Role Dump Restoration Block** | Explicit prohibition in code, manifest, and docs | Manifest `prohibitions.roleDumpRestoration` | **VERIFIED** |

> [!WARNING]
> **ROLE DUMP RESTORATION PROHIBITION:**
> The role dump contains cluster-level roles managed by the Supabase Cloud platform. It must **NEVER** be applied to a hosted Supabase instance. Doing so will trigger permission errors and risk disrupting platform access roles.

---

## 6. Gate B Safeguards Verification

The execution runbook ([`docs/M03_2_STAGING_EXECUTION_RUNBOOK.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_STAGING_EXECUTION_RUNBOOK.md)) enforces the following strict controls on Gate B:
1. **Separate Operator Approval:** Gate B may execute only after Gate A has passed integrity verification and the operator grants distinct authorization for Gate B.
2. **Custom Reconciliation Script:** Reconciliation is performed exclusively by [`scripts/reconcile-staging-schema.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/reconcile-staging-schema.ts), which applies all 31 RLS policies inside a single atomic transaction (`BEGIN ... COMMIT`).
3. **No Destructive `supabase db push`:** Ordinary `supabase db push` is forbidden as it would attempt re-executing already-applied DDL statements. Supabase CLI is used exclusively with `--dry-run` to verify remote synchronization.
4. **No `supabase migration repair` as DDL Substitute:** `migration repair` only modifies metadata and does not apply SQL; it is prohibited as a substitute for execution.
5. **CLI Inspection & Synchronization:**
   - `supabase migration list --remote="..."` confirms version `20261114000000` is tracked.
   - `supabase db push --dry-run --remote="..."` confirms `"upToDate": true`.
6. **Post-Reconciliation Verification:** `scripts/reconcile-staging-schema.ts` asserts `pg_policies` count equals 31 and confirms `routine_privileges` restrictions on `public.is_scholar()`.

---

## 7. Rollback Safeguards & Governance

[`docs/M03_2_ROLLBACK_PROCEDURE.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_ROLLBACK_PROCEDURE.md) defines three recovery levels with strict authorization gates:

1. **Level 1 (In-Transaction Rollback):** Automatic. Any error during reconciliation triggers immediate PostgreSQL `ROLLBACK;`. Zero database objects are modified or persisted.
2. **Level 2 (Selective Emergency SQL):** Reverts the 18 missing policies and deregisters the migration record. **Requires explicit operator approval.**
3. **Level 3 (Disaster Recovery Restoration):** Restores schema and data dumps using `psql`. **Requires explicit operator approval.**
4. **Mandatory Prohibition:** Automated scripts are strictly forbidden from automatically restoring, dropping, or truncating hosted database objects following a failed operation.

---

## 8. Verification Results

| Test Category | Description | Executed | Passed | Failed |
|---|---|:---:|:---:|:---:|
| **Static Security Checks** | Brand migration, non-recursive RLS, SECURITY DEFINER paths, indexes | 29 | 29 | 0 |
| **Unit Tests (Crypto & Network)** | AES-256-GCM, Context AAD, Tamper Rejection, Reverse Proxy Anti-Spoofing, URL Validation, Backup Verifier | 48 | 48 | 0 |
| **Real Application Integration** | Full Kundli DTO round-trip, normalization, server-only barriers | 3 | 3 | 0 |
| **Real PostgreSQL 18 & RLS** | Native Postgres 18 instance: RLS enforcement, role isolation, audit triggers | 22 | 22 | 0 |
| **Concurrency Tests** | Advisory locks, atomic slot reservations (10 concurrent -> exactly 1 success) | 4 | 4 | 0 |
| **TypeScript Typecheck** | Zero errors across `@spiritual-os/mobile` and `@spiritual-os/web` workspaces | 2 | 2 | 0 |
| **FULL SUITE TOTAL** | All automated tests passing 100% | **106** | **106** | **0** |

---

## 9. Final Review Verdict

```
==============================================================================
ISHTI MILESTONE M03.2.1 AUDIT VERDICT:
READY FOR EXPLICIT GATE A APPROVAL
==============================================================================
- Target Staging Project:     zrjptpkhtklfgnovdrny (VERIFIED ALLOWLIST)
- Quarantined Production:    zxwkfnvmmxoojewhvsdc (HARD-BLOCKED)
- Backup Runner & Verifier:  Hardened, partial failure protected, SHA-256 manifest
- Credential Dependencies:   Razorpay rotated key decoupled to Gate C
- Remote Database Status:    UNTOUCHED (Zero mutations executed)
- Authorization Required:    Explicit Operator Approval for Gate A
==============================================================================
```

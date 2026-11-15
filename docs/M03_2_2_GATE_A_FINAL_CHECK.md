# ISHTI Milestone M03.2.2: Final Gate A Operational Checks & ACL Hardening

**Document Version:** 1.0  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Current Branch:** `main`  
**Baseline Commit:** `ea839a4`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**HARD-QUARANTINED — ZERO REMOTE ACCESS**)  
**Milestone Type:** Inspection-Only Readiness Audit & Permission Hardening  
**Final Verdict:** **`READY FOR EXPLICIT GATE A APPROVAL`**  

---

## 1. Executive Summary & Verdict

Milestone **M03.2.2** concludes the operational verification required before requesting explicit operator authorization for **Gate A (Hosted Staging Pre-Reconciliation Backup)**.

Key accomplishments in this milestone:
1. **Reconciled Test & Typecheck Accounting:** Corrected test reporting by completely decoupling automated behavioral test counts from TypeScript compiler typechecks. Documented exact commands, exit codes, and suite breakdowns.
2. **Hardened Windows ACL & POSIX Permissions:** Implemented programmatic Windows Access Control List (ACL) enforcement in [`scripts/backup-staging.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/backup-staging.ts), stripping inherited permissions (`/inheritance:r`), restricting access exclusively to the current operator and `SYSTEM`, removing broad groups (`Users`, `Everyone`), querying and verifying effective ACLs in real time, and maintaining equivalent POSIX `0700`/`0600` modes.
3. **Preservation of Historical Backups:** Enforced that permission hardening and partial failure containment operate non-destructively, preserving all pre-existing valid backups.
4. **Final Gate A Dry-Run Executed:** Executed local dry-run endpoint validation, production quarantine hard-block, and unit test suites with zero remote connections.

```
==============================================================================
ISHTI MILESTONE M03.2.2 FINAL VERDICT:
READY FOR EXPLICIT GATE A APPROVAL
==============================================================================
- Target Staging Project:     zrjptpkhtklfgnovdrny (Verified Allowlist)
- Quarantined Production:    zxwkfnvmmxoojewhvsdc (Hard-Blocked Across All Scripts)
- Automated Test Suite:      108 passed, 0 failed (Exit code: 0)
- TypeScript Typecheck:      0 errors across all workspaces (Exit code: 0)
- Windows ACL Security:      Verified (Inheritance removed; restricted to operator & SYSTEM)
- Partial Failure Safety:    Fail-closed, quarantines current run, preserves history
- Credential Dependencies:   Razorpay rotated key decoupled to Gate C (Payment Sandbox)
- Remote Database Status:    UNTOUCHED (Zero remote mutations executed)
- Authorization Required:    Explicit Operator Approval for Gate A Execution
==============================================================================
```

---

## 2. Reconciled Test & Typecheck Accounting

In prior reporting, the TypeScript typecheck was included alongside test categories in summary tables, causing ambiguity between compiler validation and behavioral automated test counts. Under M03.2.2, these suites are strictly decoupled and reported independently.

### 2.1 Automated Behavioral Test Suite

- **Exact Command:** `npm.cmd run test:security`  
  *(Invokes `npx tsx scripts/run-comprehensive-tests.js`)*
- **Execution Environment:** Windows PowerShell / Node.js v24.11.1 / Native PostgreSQL 18.6 (MSVC x64) on port 54321
- **Process Exit Code:** `0`
- **Total Executed Automated Tests:** **108 passed, 0 failed**
- **Execution Completion:** 100% complete. Zero tests were cancelled, timed out, or terminated prematurely.

#### Category Breakdown
| # | Test Category | Description | Executed | Passed | Failed | Exit Code |
|---|---|---|:---:|:---:|:---:|:---:|
| 1 | **Static Integrity Checks** | Brand migration, anti-privilege escalation, non-recursive RLS helpers, `SECURITY DEFINER` search paths, partial unique index, role audit trigger | 29 | 29 | 0 | 0 |
| 2 | **Unit Tests (Crypto & Network)** | AES-256-GCM AEAD, fresh 96-bit IVs, context-bound AAD, tamper rejection, key loading, reverse proxy anti-spoofing, IP validation, staging URL validator, backup runner credential sanitizer, SHA-256 manifest verifier, Windows ACL validator | 50 | 50 | 0 | 0 |
| 3 | **Real Application Integration** | Full Kundli Profile DTO encryption/decryption round-trip, plaintext date rejection, server-only module isolation barriers | 3 | 3 | 0 | 0 |
| 4 | **Real PostgreSQL 18 & RLS** | Native PostgreSQL 18 instance: RLS enforcement, role isolation (`anon`, `authenticated`, `scholar`, `astrologer`), role audit immutability, booking lifecycle triggers | 22 | 22 | 0 | 0 |
| 5 | **Concurrency Tests** | Native PostgreSQL 18: 20 concurrent rate limit requests (exactly 5 allowed), 10 concurrent booking reservations (exactly 1 succeeds, 9 receive conflict error) | 4 | 4 | 0 | 0 |
| **SUBTOTAL** | **All Executed Tests** | **Comprehensive Automated Security & Cryptography Suite** | **108** | **108** | **0** | **0** |

*Tests Not Yet Executable (Documented as pending live deployment, NOT counted as passed):*
1. `Live hosted PostgreSQL query against staging project zrjptpkhtklfgnovdrny` (Awaiting Gate B reconciliation)
2. `Live Twilio / SMS Gateway Phone OTP delivery` (Requires live carrier integration & SMS API key)
3. `Live Razorpay / Cashfree webhook payment signature verification` (Requires active merchant account)

---

### 2.2 TypeScript Static Typecheck

- **Exact Command:** `npm.cmd run typecheck`  
  *(Invokes `npm run typecheck --workspaces --if-present`)*
- **Nature of Verification:** Static compilation check via TypeScript compiler (`tsc --noEmit`), verifying type safety, interface conformance, and module boundaries. **Not counted as an automated test.**
- **Process Exit Code:** `0`
- **Workspace Results:**
  - `@spiritual-os/mobile`: `tsc --noEmit` -> **0 errors (Exit code 0)**
  - `@spiritual-os/web`: `tsc --noEmit` -> **0 errors (Exit code 0)**

---

## 3. Windows Backup Permissions (ACL Implementation Audit)

### 3.1 Vulnerability Context & Requirements
Default filesystem creation on Windows inherits Access Control Entries (ACEs) from parent directories, which often grant read access to broad user groups (`BUILTIN\Users`, `Authenticated Users`, or sandbox users). For database backups containing schemas, seed data, and role definitions, broad access represents a local information disclosure vulnerability.

M03.2.2 establishes programmatic, verifiable filesystem security in [`scripts/backup-staging.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/backup-staging.ts).

### 3.2 Implementation Architecture

1. **Inheritance Removal:**
   - Invokes `icacls "${dirPath}" /inheritance:r` to strip all inherited permissions from the parent directory tree.
2. **Restrictive Principal Granting:**
   - Grants Full Control exclusively to the current operator (`%USERNAME%`): `/grant:r "${username}:(OI)(CI)F"`
   - Grants Full Control to the operating system service account: `/grant:r "SYSTEM:(OI)(CI)F"`
   - `(OI)(CI)` flags ensure container and object inheritance so that new files inherit restricted permissions.
   - For individual files: `icacls "${filePath}" /inheritance:r /grant:r "${username}:F" /grant:r "SYSTEM:F"`
3. **Broad Access Prohibition:**
   - The helper `hasBroadPermissionsWindows()` inspects effective ACL output and rejects any grants to `Everyone:`, `BUILTIN\Users:`, `Authenticated Users:`, `Users:`, or `CodexSandboxUsers:`.
4. **Active Verification of Effective ACL:**
   - Immediately following permission modification, the runner executes `icacls` to inspect the effective ACL on disk.
   - If broad groups are detected or if the operator / SYSTEM accounts are missing, the check **fails fast**.
5. **Readiness Check Hard-Fail:**
   - `secureDirectoryPermissions()` runs during dry-run and pre-execution. If permissions cannot be secured and verified, the backup runner terminates immediately with exit code 1.
6. **Preservation of Existing Completed Backups:**
   - Permissions modifications target the directory and the current run's files specifically. No historical files are modified, truncated, or deleted.
7. **POSIX Parity:**
   - On Linux/macOS, enforces mode `0700` (`rwx------`) on `supabase/backups/` and mode `0600` (`rw-------`) on all `.sql` and `.json` dump files, verifying that group and other bits (`mode & 0o077`) are strictly 0.

### 3.3 Live Verification Output on Windows
Executed during dry-run inspection:
```
Filesystem Security: Directory permissions successfully secured for operator 'as' and SYSTEM.
Effective ACL:
  C:\Users\as\Documents\GitHub\spiritual-OS\supabase\backups NT AUTHORITY\SYSTEM:(OI)(CI)(F)
                                                             DESKTOP-5BUIUJM\as:(OI)(CI)(F)
  
  Successfully processed 1 files; Failed processing 0 files
```

---

## 4. Final Gate A Dry-Run Execution Evidence

The local dry-run was executed to verify all operational pathways without establishing remote connections to Supabase.

### 4.1 Staging Endpoint Validation Evidence
- **Command:**
  ```powershell
  $env:STAGING_DATABASE_URL="postgres://postgres:mockpassword123@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres"
  npx.cmd tsx scripts/backup-staging.ts
  ```
- **Exit Code:** `0`
- **Output:**
  ```
  ==============================================================================
  ISHTI M03.2.2: CONTROLLED STAGING DATABASE BACKUP RUNNER
  ==============================================================================
  Execution Mode:     DRY-RUN INSPECTION (Read-Only)
  Target Staging Ref: zrjptpkhtklfgnovdrny (STRICT ALLOWLIST ENFORCED)
  Prohibited Target:  zxwkfnvmmxoojewhvsdc (STRICT PRODUCTION QUARANTINE)
  ==============================================================================

  Endpoint Verified:  postgres://postgres:*****@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres
  Connection Mode:    Direct PostgreSQL (5432)
  Host & Port:        db.zrjptpkhtklfgnovdrny.supabase.co:5432
  Database Name:      postgres

  Filesystem Security: Directory permissions successfully secured for operator 'as' and SYSTEM.
  Effective ACL:
    C:\Users\as\Documents\GitHub\spiritual-OS\supabase\backups NT AUTHORITY\SYSTEM:(OI)(CI)(F)
                                                               DESKTOP-5BUIUJM\as:(OI)(CI)(F)
  
  Planned Backup Targets:
    1. Schema DDL:   supabase/backups/staging_schema_[TIMESTAMP].sql
    2. Data Records: supabase/backups/staging_data_[TIMESTAMP].sql
    3. Cluster Roles: supabase/backups/staging_roles_[TIMESTAMP].sql
    4. Metadata:     supabase/backups/staging_backup_[TIMESTAMP].meta.json

  ==============================================================================
  DRY-RUN COMPLETE: Endpoint and filesystem permissions are verified.
  To execute the backup against hosted staging, invoke with --execute.
  ==============================================================================
  ```

---

### 4.2 Production Hard-Quarantine Evidence
- **Command:**
  ```powershell
  $env:STAGING_DATABASE_URL="postgres://postgres:mockpassword123@db.zxwkfnvmmxoojewhvsdc.supabase.co:5432/postgres"
  npx.cmd tsx scripts/backup-staging.ts
  ```
- **Exit Code:** `1`
- **Output:**
  ```
  ==============================================================================
  ISHTI M03.2.2: CONTROLLED STAGING DATABASE BACKUP RUNNER
  ==============================================================================
  Execution Mode:     DRY-RUN INSPECTION (Read-Only)
  Target Staging Ref: zrjptpkhtklfgnovdrny (STRICT ALLOWLIST ENFORCED)
  Prohibited Target:  zxwkfnvmmxoojewhvsdc (STRICT PRODUCTION QUARANTINE)
  ==============================================================================

  CRITICAL SECURITY VIOLATION: CRITICAL SECURITY VIOLATION: Production project reference 'zxwkfnvmmxoojewhvsdc' detected in database connection string! Connection refused. Production environment is quarantined.
  ```

---

### 4.3 Three-Pass Command Construction Audit
The runner constructs three explicit, containerized Supabase CLI 3.1.0 dump passes:
1. **Pass 1 (Schema DDL):**
   `npx supabase db dump --remote="${cliNormalizedUrl}" --schema public,supabase_migrations --keep-comments -f "${schemaFile}"`
2. **Pass 2 (Table Data):**
   `npx supabase db dump --remote="${cliNormalizedUrl}" --schema public,supabase_migrations --data-only --use-copy -f "${dataFile}"`
3. **Pass 3 (Cluster Roles):**
   `npx supabase db dump --remote="${cliNormalizedUrl}" --role-only -f "${rolesFile}"`

---

### 4.4 Automated Integrity & Permission Verification Mode (`--verify`)
The verification command independently inspects generated backups:
```bash
npx tsx scripts/backup-staging.ts --verify [timestamp-or-manifest]
```
Verification criteria enforced:
- Backup directory exists and satisfies restrictive permissions (`icacls` / `0700`).
- Manifest file exists, parses cleanly, has `status: "COMPLETED"`, and matches `projectRef: "zrjptpkhtklfgnovdrny"`.
- All three dump files exist on disk with non-zero size (`size > 0`).
- File sizes match the manifest recorded byte counts.
- Real-time cryptographic SHA-256 calculation matches manifest checksums.
- Individual file permissions satisfy restrictive ACL policy (`icacls` / `0600`).

---

## 5. Decoupled Credential Dependencies Summary

1. **Gate A (Staging Backup):** Requires exclusively `STAGING_DATABASE_URL` (database connection credentials for `zrjptpkhtklfgnovdrny`). It has zero dependency on payment credentials or application secrets.
2. **Gate B (Schema Reconciliation):** Requires exclusively verified Gate A backup artifacts and `STAGING_DATABASE_URL`. Zero dependency on Razorpay.
3. **Gate C (Payment Integration Testing):** Mandatory prerequisite: Operator must confirm that the previously exposed Razorpay test key has been revoked in the merchant dashboard and a fresh test secret generated.
4. **Risk Register State:** The Razorpay incident remains classified as **UNRESOLVED** until operator dashboard confirmation is received.

---

## 6. Strict Governance Boundaries & Invariants

Under project governance:
- **Zero remote operations** were executed in M03.2.2.
- `backup-staging.ts --execute` was **NOT** run.
- `reconcile-staging-schema.ts --execute` was **NOT** run.
- `supabase db push` was **NOT** run.
- `supabase migration repair` was **NOT** run.
- Zero remote SQL commands were executed against staging or production.
- Production project `zxwkfnvmmxoojewhvsdc` remains completely untouched.
- Rollback procedures modifying hosted state strictly require explicit operator authorization (automated restoration is forbidden).

---

## 7. Operational Instructions for Gate A Authorization

When the operator is ready to authorize Gate A:

```bash
# 1. Export staging database URL (Operator action - untracked local shell)
export STAGING_DATABASE_URL="postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres"

# 2. Run pre-execution dry-run check (verifies endpoint & filesystem permissions)
npx tsx scripts/backup-staging.ts

# 3. Execute 3-pass logical backup against hosted staging
npx tsx scripts/backup-staging.ts --execute

# 4. Verify backup integrity, checksums, and ACL permissions
npx tsx scripts/backup-staging.ts --verify
```

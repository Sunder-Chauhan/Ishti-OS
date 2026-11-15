# ISHTI Milestone M03.2.3: Gate A Local Operational Preflight Report

**Document Version:** 1.0  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Current Branch:** `main`  
**Baseline Git Commit:** `e458a14`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**HARD-QUARANTINED — ZERO REMOTE ACCESS**)  
**Milestone Type:** Preflight Inspection Only  
**Final Verdict:** **`BLOCKED — DOCKER UNAVAILABLE`** *(Secondary Blocker: `STAGING_DATABASE_URL MISSING`)*  

---

## 1. Executive Summary & Gating Status

Milestone **M03.2.3** executed local operational preflight checks to assess whether the local environment is ready for the operator to authorize and execute **Gate A (Hosted Pre-Reconciliation Backup)**.

In accordance with strict preflight protocols:
- **Zero live backups** were initiated.
- **Zero remote database connections** or queries were executed against staging (`zrjptpkhtklfgnovdrny`) or quarantined production (`zxwkfnvmmxoojewhvsdc`).
- Preflight inspection determined that **Gate A is currently BLOCKED** due to two missing local operational prerequisites:
  1. **Docker Desktop is not running** (required by Supabase CLI for containerized `pg_dump`).
  2. **`STAGING_DATABASE_URL` is not configured** in the active PowerShell session.

---

## 2. Preflight Checklist & Verification Results

| # | Inspection Item | Verification Command / Check | Expected Result | Actual Result | Status |
|---|---|---|---|---|:---:|
| 1 | **Git Branch** | `git branch --show-current` | `main` | `main` | **PASS** |
| 2 | **HEAD Commit** | `git log -1 --oneline` | `e458a14` | `e458a14` | **PASS** |
| 3 | **Working Tree** | `git status` | Clean (nothing to commit) | Clean (nothing to commit) | **PASS** |
| 4 | **Backup Runner File** | `Test-Path scripts/backup-staging.ts` | `True` | `True` | **PASS** |
| 5 | **M03.2.2 Audit Report** | `Test-Path docs/M03_2_2_GATE_A_FINAL_CHECK.md` | `True` | `True` | **PASS** |
| 6 | **Docker Daemon** | `docker info` | Server engine running | `failed to connect to the docker API` (Daemon stopped) | **BLOCKED** |
| 7 | **Staging URL Configured** | `$env:STAGING_DATABASE_URL` check | Configured in session | Not configured (`MISSING`) | **BLOCKED** |
| 8 | **Endpoint & Allowlist** | `scripts/validate-staging-url.ts` | Allows `zrjptpkhtklfgnovdrny`, rejects `zxwkfnvmmxoojewhvsdc` | Verified in unit test suite (108/108 passing) | **PASS** |
| 9 | **Windows ACL Permissions** | `icacls supabase\backups` | Operator and SYSTEM only | `NT AUTHORITY\SYSTEM:(OI)(CI)(F)`, `as:(OI)(CI)(F)` | **PASS** |
| 10 | **Dry-Run Execution** | `npx.cmd tsx scripts/backup-staging.ts` | Clean dry-run (mutates zero files) | Skipped per gating rules (Prerequisites 6 & 7 blocked) | **SKIPPED** |
| 11 | **Remote Database Touch** | Audit of active tasks & commands | Zero remote connections | Confirmed: Zero remote connections or queries | **PASS** |

---

## 3. Detailed Preflight Findings

### 3.1 Repository Integrity
- **Branch:** `main`
- **Commit:** `e458a14` (`docs: clarify Docker Desktop prerequisite in project tracker for Gate A`)
- **Working Tree:** Completely clean; zero untracked credentials, secrets, or temporary artifacts.
- **Backup Runner:** [`scripts/backup-staging.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/backup-staging.ts) is present, incorporating Windows ACL enforcement, credential masking in error logs, partial failure quarantine, SHA-256 companion manifest generation, and `--verify` mode.

### 3.2 Docker Desktop Verification
- **Command:** `docker info`
- **Exit Code:** `1`
- **Output Summary:**
  ```
  Client: Version 29.7.2, Context desktop-linux
  Server: failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine;
          check if the path is correct and if the daemon is running:
          open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
  ```
- **Finding:** The Docker Desktop client CLI is installed, but the Docker Desktop background engine is not running. Supabase CLI v3 containerizes `pg_dump` tools within Docker; without the Docker daemon, any live `db dump` pass will fail immediately.
- **Remediation:** The human operator must launch Docker Desktop and wait until its tray icon indicates "Docker Engine is running".

### 3.3 Staging Database Connection Configuration
- **Check:** PowerShell environment inspection for `STAGING_DATABASE_URL`.
- **Result:** `MISSING` (not set in the active terminal environment).
- **Security Confirmation:** Zero credentials were read, printed, logged, or exposed in chat or repository files.
- **Allowlist & Quarantine Rule:** When configured, `STAGING_DATABASE_URL` is parsed by [`scripts/validate-staging-url.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/validate-staging-url.ts):
  - Strictly requires staging project reference: `zrjptpkhtklfgnovdrny`.
  - Rejects production project reference: `zxwkfnvmmxoojewhvsdc` across host, username, query parameters, and raw text.
- **Remediation:** The operator must export the connection string locally in their untracked PowerShell session prior to dry-run or execution.

### 3.4 Backup Runner Dry-Run Status
- **Gating Rule:** Section 4 of the preflight protocol specifies that the dry-run command is executed only if both Docker and staging URL prerequisites pass.
- **Action Taken:** In accordance with this rule, `npx.cmd tsx scripts/backup-staging.ts` was **NOT executed** in this turn to avoid triggering known validation failures.
- **Confirmation:** Zero dump files (`.sql`) or metadata manifests (`.meta.json`) were generated. Zero remote database queries were dispatched.

### 3.5 Windows ACL Verification Result
Inspection of `supabase/backups/` via `icacls supabase\backups`:
```
supabase\backups NT AUTHORITY\SYSTEM:(OI)(CI)(F)
                 DESKTOP-5BUIUJM\as:(OI)(CI)(F)

Successfully processed 1 files; Failed processing 0 files
```
- **Inheritance:** Disabled (`/inheritance:r`).
- **Principals:** Only `NT AUTHORITY\SYSTEM` and the current operator (`DESKTOP-5BUIUJM\as`) hold Full Control `(OI)(CI)(F)`.
- **Broad Access Groups:** `Everyone`, `BUILTIN\Users`, `Authenticated Users`, and sandbox users are verified absent.
- **Historical Preservation:** Existing directory permissions are secured non-destructively; no files were deleted.

---

## 4. Confirmation of Prohibited Operations

The following operations were strictly prohibited and confirmed **NOT executed**:
- `npx.cmd tsx scripts/backup-staging.ts --execute` (NOT executed)
- `npx.cmd tsx scripts/backup-staging.ts --verify` (NOT executed)
- `npx supabase db push` (NOT executed)
- `npx supabase migration repair` (NOT executed)
- Remote SQL execution against staging or production (NOT executed)
- Staging schema reconciliation (NOT executed)
- Production access of any kind (NOT executed)
- Credential rotation or changes to payment configuration (NOT executed)

---

## 5. Corrective Action Plan for Operator

To resolve the two blockers and achieve Gate A execution readiness, the human operator must perform the following three local actions:

### Action 1: Launch Docker Desktop
1. Open the Docker Desktop application on Windows.
2. Wait until the Docker status indicator displays **Engine running**.
3. Verify in PowerShell:
   ```powershell
   docker info
   ```
   *Expected:* Command exits with code `0` and displays server engine details.

### Action 2: Set `STAGING_DATABASE_URL` in Local PowerShell
In the active PowerShell terminal in the repository root, export the connection string targeting staging project `zrjptpkhtklfgnovdrny`:
```powershell
# Direct connection (port 5432):
$env:STAGING_DATABASE_URL = "postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres"

# OR Supabase transaction pooler (port 6543):
# $env:STAGING_DATABASE_URL = "postgres://postgres.zrjptpkhtklfgnovdrny:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
```
*Do not paste credentials in chat, commit them to Git, or add them to tracked files.*

### Action 3: Execute Local Dry-Run
Run the non-mutating preflight dry-run:
```powershell
npx.cmd tsx scripts/backup-staging.ts
```
*Expected:* Endpoint verified, Windows ACL verified, planned targets displayed, exit code `0`.

---

## 6. Preflight Conclusion & Verdict

```
==============================================================================
ISHTI MILESTONE M03.2.3 PREFLIGHT VERDICT:
BLOCKED — DOCKER UNAVAILABLE
(Secondary Blocker: STAGING URL MISSING)
==============================================================================
- Docker Daemon:         NOT RUNNING (open //./pipe/dockerDesktopLinuxEngine failed)
- STAGING_DATABASE_URL:  NOT CONFIGURED in session
- Windows ACL Security:  VERIFIED (Restricted to operator and SYSTEM)
- Repository Integrity:  VERIFIED (Branch main, commit e458a14, clean working tree)
- Remote Database:       UNTOUCHED (Zero live backups or mutations dispatched)
==============================================================================
```

**Next Step:** Operator completes Actions 1-3 above, verifies dry-run exit code `0`, and then explicitly issues:
> **"I explicitly authorize Gate A only."**

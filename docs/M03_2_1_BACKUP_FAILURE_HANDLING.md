# ISHTI Milestone M03.2.1: Backup Failure Modes & Recovery Runbook

**Document Version:** 1.0  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**HARD-QUARANTINED**)  
**Runner:** [`scripts/backup-staging.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/backup-staging.ts)  
**Scope:** Controlled handling, containment, and operator remediation for all backup failure modes  

---

## 1. Overview & Core Failure Principles

The ISHTI staging backup procedure is designed under strict fail-closed governance principles:

1. **Atomic Pass Rule:** A backup consists of three required passes: Pass 1 (Schema DDL), Pass 2 (Data Records), and Pass 3 (Cluster Roles). **If any individual pass fails or produces an empty file, the entire backup is classified as `FAILED`.** There is no concept of a "partial success".
2. **Containment & Quarantine:** Incomplete files created during a failed attempt must be immediately isolated with a `.FAILED_INCOMPLETE` suffix so they cannot be mistaken for usable recovery assets.
3. **Preservation of History:** The failure handler **never deletes, overwrites, or prunes pre-existing historical backups**. Earlier valid backups are preserved intact.
4. **Local Isolation & Zero Uploads:** Backup operations are local to the operator's machine (`supabase/backups/`). The runner contains zero external upload logic (no automated transfer to AWS S3, Google Cloud Storage, or third-party buckets).
5. **Credential Masking:** All error outputs, stderr streams, and exception stack traces are sanitized via `sanitizeErrorMessage()` to prevent database passwords or raw connection strings from leaking into terminal logs or failure manifests.

---

## 2. Failure Mode Taxonomy & Automated Behaviors

| Failure Mode | Root Cause / Trigger | Automated System Behavior | Resulting State |
|---|---|---|---|
| **FM-1: Docker Engine Unavailable** | Docker Desktop is not running or socket is unresponsive. Supabase CLI cannot launch containerized `pg_dump`. | CLI fails immediately on Pass 1. Exception intercepted. Zero dump files created. | Status: `FAILED`. Failure manifest recorded. Exit code 1. |
| **FM-2: Network Timeout / Disconnect** | Transient network interruption, TCP reset, or DNS timeout reaching `db.zrjptpkhtklfgnovdrny.supabase.co` or pooler. | Active pass aborts. Any files generated in current run quarantined with `.FAILED_INCOMPLETE`. | Status: `FAILED`. Existing historical backups intact. Exit code 1. |
| **FM-3: Authentication Rejection** | Incorrect database password, expired pooler credentials, or SSL handshake rejection. | Connection fails on Pass 1. Sanitizer scrubs password. No files written. | Status: `FAILED`. Error sanitized to `[REDACTED_CREDENTIALS]`. Exit code 1. |
| **FM-4: Intermediate Pass Failure** | Pass 1 (Schema) succeeds, but Pass 2 (Data) or Pass 3 (Roles) fails (e.g. timeout, memory limit, killed process). | Runner intercepts failure. Renames `staging_schema_[TS].sql` to `staging_schema_[TS].sql.FAILED_INCOMPLETE`. Writes failure manifest. | Status: `FAILED`. Incomplete schema dump cannot be mistaken for full backup. Exit code 1. |
| **FM-5: Zero-Byte Output File** | CLI process exits 0 or hangs, but dump file on disk is empty (`size === 0`). | File size assertion triggers: `Schema dump file is empty (0 bytes)`. Run aborted. Files quarantined. | Status: `FAILED`. Empty files quarantined. Exit code 1. |
| **FM-6: Local Disk Exhaustion** | Insufficient storage on local drive hosting `supabase/backups/`. | Write fails with `ENOSPC`. Exception caught. Partial files unlinked/renamed. | Status: `FAILED`. Failure manifest written if disk allows. Exit code 1. |
| **FM-7: Production Project Reference** | `STAGING_DATABASE_URL` accidentally contains production ref `zxwkfnvmmxoojewhvsdc`. | Validator aborts immediately at Step 1 before touching network or invoking CLI. | Status: `CRITICAL SECURITY VIOLATION`. Execution refused. Exit code 1. |

---

## 3. Automated Containment Lifecycle

```
                             [ START BACKUP ]
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │    Validate Endpoint & Host  │
                      └──────────────┬───────────────┘
                                     │ Fails? ──► [ ABORT: Exit 1, Zero Files ]
                                     ▼
                      ┌──────────────────────────────┐
                      │ Execute Pass 1: Schema DDL   │
                      └──────────────┬───────────────┘
                                     │ Fails? ──► [ QUARANTINE: Mark FAILED ]
                                     ▼
                      ┌──────────────────────────────┐
                      │ Execute Pass 2: Data Records │
                      └──────────────┬───────────────┘
                                     │ Fails? ──► [ QUARANTINE Pass 1: Mark FAILED ]
                                     ▼
                      ┌──────────────────────────────┐
                      │ Execute Pass 3: Roles        │
                      └──────────────┬───────────────┘
                                     │ Fails? ──► [ QUARANTINE Pass 1 & 2: Mark FAILED ]
                                     ▼
                      ┌──────────────────────────────┐
                      │ Assert All Sizes > 0 Bytes   │
                      │ Calculate SHA-256 Checksums  │
                      │ Write .meta.json Manifest    │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      [ BACKUP COMPLETE (Exit 0) ]
```

### Quarantined Artifact Naming Convention
- Schema dump: `supabase/backups/staging_schema_[TIMESTAMP].sql.FAILED_INCOMPLETE`
- Data dump: `supabase/backups/staging_data_[TIMESTAMP].sql.FAILED_INCOMPLETE`
- Role dump: `supabase/backups/staging_roles_[TIMESTAMP].sql.FAILED_INCOMPLETE`
- Failure manifest: `supabase/backups/staging_backup_[TIMESTAMP].FAILED.json`

### Failure Manifest Schema Example
```json
{
  "timestamp": "2026-11-15T10:15:30.123Z",
  "projectRef": "zrjptpkhtklfgnovdrny",
  "status": "FAILED",
  "cliVersion": "3.1.0",
  "targetAllowlist": "zrjptpkhtklfgnovdrny",
  "quarantinedProduction": "zxwkfnvmmxoojewhvsdc",
  "failureDetails": {
    "failedPass": "Pass 2/3: Data Records (--data-only --use-copy)",
    "error": "Error: Command failed: npx supabase db dump --remote=\"postgres://[REDACTED_CREDENTIALS]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres\" ...",
    "quarantinedFiles": [
      "staging_schema_2026-11-15T10-15-30-123Z.sql.FAILED_INCOMPLETE"
    ]
  },
  "prohibitions": {
    "roleDumpRestoration": "FORBIDDEN: The role dump contains platform cluster roles and must NEVER be restored to a hosted Supabase project.",
    "gitInclusion": "FORBIDDEN: Backup files and metadata must remain untracked and excluded by .gitignore."
  }
}
```

---

## 4. Operator Remediation Runbook

When a backup attempt fails, the operator must execute the following troubleshooting sequence before retrying Gate A:

### Step 1: Diagnose Failure Cause
Inspect the terminal output. Credential scrubbing ensures passwords are not exposed.
- If error contains `Cannot connect to the Docker daemon`:
  - **Remedy:** Launch Docker Desktop. Verify `docker info` exits 0.
- If error contains `password authentication failed`:
  - **Remedy:** Re-check the database password retrieved from the Supabase dashboard (Project Settings -> Database). Re-export `STAGING_DATABASE_URL` in the local untracked shell.
- If error contains `connect ETIMEDOUT` or `ENOTFOUND`:
  - **Remedy:** Check local internet connectivity. Verify firewall permits outbound traffic to port 5432 / 6543.
- If error contains `CRITICAL SECURITY VIOLATION`:
  - **Remedy:** Inspect the provided URL. Ensure it does not contain the production reference `zxwkfnvmmxoojewhvsdc`.

### Step 2: Clean Up Quarantined Artifacts (Optional)
The quarantined files (`*.FAILED_INCOMPLETE` and `*.FAILED.json`) are already ignored by Git. They may be purged if desired:
```bash
# Optional: remove failed attempt artifacts
rm supabase/backups/*.FAILED_INCOMPLETE
rm supabase/backups/*.FAILED.json
```
*Never delete valid `.sql` or `.meta.json` files from prior completed backups.*

### Step 3: Run Dry-Run Endpoint Verification
Verify endpoint connectivity and allowlist conformance without executing dumps:
```bash
npx tsx scripts/backup-staging.ts
```
Expected output:
```
Endpoint Verified:  postgres://postgres:*****@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres
DRY-RUN COMPLETE: The endpoint is validated and ready for backup.
```

### Step 4: Re-Execute Backup
Re-invoke the runner with live execution:
```bash
npx tsx scripts/backup-staging.ts --execute
```

### Step 5: Verify Integrity
Confirm all three dump files exist and match the manifest:
```bash
npx tsx scripts/backup-staging.ts --verify
```
Expected output:
```
[PASS] All 3 backup files verified (schema, data, roles). Checksums and sizes match manifest.
RESULT: VERIFICATION PASSED — BACKUP INTEGRITY CONFIRMED
```

---

## 5. Security & Governance Invariants

1. **Gate Progression Rule:** Gate B (Schema Reconciliation) must **NEVER** be authorized if the latest backup run resulted in status `FAILED`.
2. **No Automated Rollback on Backup Failure:** A backup failure leaves the hosted staging database completely unchanged because `db dump` is a read-only operation. No rollback or restoration commands should be executed after a backup failure.
3. **No Role Restoration:** If Level 3 disaster recovery is ever required, only `staging_schema_*.sql` and `staging_data_*.sql` may be restored via `psql`. `staging_roles_*.sql` must **NEVER** be applied to hosted Supabase.

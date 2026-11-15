# ISHTI Milestone M03.2.5: Gate A DNS Failure Investigation & Recovery Planning

**Document Version:** 1.0  
**Repository:** `C:\Users\as\Documents\GitHub\spiritual-OS`  
**Current Branch:** `main`  
**Baseline Git Commit:** `abb33a5`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**HARD-QUARANTINED — STRICT ZERO ACCESS**)  
**Milestone Type:** Local Diagnostic & Recovery Planning Only  
**Final Verdict:** **`DNS ISSUE IDENTIFIED — SAFE RECOVERY PLAN READY`**  

---

## 1. Executive Summary & Incident Overview

During the initial authorized execution of **Gate A (Hosted Pre-Reconciliation Staging Backup)** on 2026-11-15, the backup runner (`scripts/backup-staging.ts --execute`) failed during **Pass 1/3 (Schema DDL)** with a fatal name resolution error:

```
pg_dump: error: could not translate host name "db.zrjptpkhtklfgnovdrny.supabase.co" to address: Name or service not known
error running container: exit 1
```

The runner halted execution, generated a failure record (`staging_backup_2026-11-15T18-35-08-939Z.FAILED.json`), and exited with code 1. Subsequent verification via `scripts/backup-staging.ts --verify` reported that zero completed backup manifests existed.

Milestone **M03.2.5** was initiated as a strict **local diagnostic and recovery planning task** to:
1. Inspect the failed backup artifacts in `supabase/backups/`.
2. Empirically test DNS resolution on Windows host versus Docker container environments.
3. Determine architectural differences between the direct endpoint and the Supabase session pooler.
4. Audit the failure containment and quarantine behavior of `scripts/backup-staging.ts`.
5. Formulate a verified, non-destructive recovery plan.

### Summary of Key Findings
1. **Direct Endpoint is IPv6-Only:** `db.zrjptpkhtklfgnovdrny.supabase.co` resolves exclusively to an IPv6 `AAAA` record (`2406:da1a:109c:2601:80fe:2d88:a0f6:74b1`). It possesses **zero IPv4 `A` records**.
2. **Docker WSL2 DNS Gateway Lacks IPv6 Forwarding:** While the Windows host resolves the `AAAA` record via `8.8.8.8`, Docker Desktop's internal virtual bridge DNS forwarder (`192.168.65.7:53`) returns `NXDOMAIN` for `db.zrjptpkhtklfgnovdrny.supabase.co`. Because Supabase CLI containerizes `pg_dump` inside `public.ecr.aws/supabase/postgres:17.11.0.018`, `pg_dump` inside the container cannot resolve the direct hostname.
3. **Mumbai Pooler Provides Full IPv4 Compatibility:** The Supabase Mumbai Session Pooler (`aws-0-ap-south-1.pooler.supabase.com`) resolves cleanly to dual IPv4 addresses (`3.111.105.85`, `65.0.195.55`) inside both Windows and Docker containers.
4. **Endpoint Validator is Pre-Engineered for Pooler:** [`scripts/validate-staging-url.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/validate-staging-url.ts) already strictly supports and validates the pooler configuration (`aws-0-ap-south-1.pooler.supabase.com:5432` with user `postgres.zrjptpkhtklfgnovdrny`).
5. **Zero Credential Exposure:** Error logs, failure manifests, and diagnostic runs contain zero passwords or secrets.

---

## 2. Inspection of Failed Backup Artifacts

An audit of `supabase/backups/` was conducted immediately following the failure:

```powershell
Get-ChildItem -Path supabase/backups/ -Force
```

### Observed Disk State
| Artifact Name | Size | Created / Modified | Type | State / Assessment |
|---|:---:|---|:---:|---|
| `staging_backup_2026-11-15T18-35-08-939Z.FAILED.json` | 3,934 B | 2026-11-16 00:06 IST | JSON Manifest | Complete failure manifest. Credential scrubbing verified. |
| `staging_schema_2026-11-15T18-35-08-939Z.sql` | 0 B | 2026-11-16 00:05 IST | SQL Dump | Empty 0-byte orphan file created by CLI before `pg_dump` failed. |
| `test/` | - | 2026-11-15 02:40 IST | Directory | Automated unit test sandbox. Untouched. |

### Failure Manifest Analysis
Inspection of `staging_backup_2026-11-15T18-35-08-939Z.FAILED.json`:
- **`status`:** `"FAILED"`
- **`failedPass`:** `"Pass 1/3: Schema DDL (public, supabase_migrations)"`
- **`projectRef`:** `"zrjptpkhtklfgnovdrny"`
- **`cliVersion`:** `"3.1.0"`
- **`error`:** Contains the sanitized container output:
  ```
  Target: custom Postgres (db.zrjptpkhtklfgnovdrny.supabase.co:5432)
  Dumping schemas from remote database...
  Status: Downloaded newer image for public.ecr.aws/supabase/postgres:17.11.0.018
  pg_dump: error: could not translate host name "db.zrjptpkhtklfgnovdrny.supabase.co" to address: Name or service not known
  error running container: exit 1
  ```
- **Historical Preservation:** Zero historical backups were present or touched.
- **Credential Hygiene:** No passwords, connection strings, or authorization headers are present in the JSON file.

### Filesystem Permissions (Windows ACL)
```
supabase\backups\staging_backup_2026-11-15T18-35-08-939Z.FAILED.json NT AUTHORITY\SYSTEM:(F)
                                                                     DESKTOP-5BUIUJM\as:(F)

supabase\backups\staging_schema_2026-11-15T18-35-08-939Z.sql NT AUTHORITY\SYSTEM:(I)(F)
                                                             DESKTOP-5BUIUJM\as:(I)(F)
```
- Permissions are strictly confined to `DESKTOP-5BUIUJM\as` and `NT AUTHORITY\SYSTEM`.
- Inheritance is disabled on the directory; broad groups (`Users`, `Everyone`) remain eliminated.

---

## 3. Host (Windows) DNS Investigation

Windows DNS resolution was tested against `db.zrjptpkhtklfgnovdrny.supabase.co` and `aws-0-ap-south-1.pooler.supabase.com`:

### 3.1 Direct Endpoint Resolution
```powershell
Resolve-DnsName db.zrjptpkhtklfgnovdrny.supabase.co
nslookup db.zrjptpkhtklfgnovdrny.supabase.co
```

**Observed Output:**
```text
Name                                Type  TTL  Section  IPAddress
----                                ----  ---  -------  ---------
db.zrjptpkhtklfgnovdrny.supabase.co AAAA  30   Answer   2406:da1a:109c:2601:80fe:2d88:a0f6:74b1

Server:  dns.google
Address: 8.8.8.8

Name:    db.zrjptpkhtklfgnovdrny.supabase.co
Address: 2406:da1a:109c:2601:80fe:2d88:a0f6:74b1
```

### 3.2 Explicit IPv4 (`A` Record) Query
```powershell
Resolve-DnsName db.zrjptpkhtklfgnovdrny.supabase.co -Type A
```

**Observed Output:**
```text
Name         Type TTL Section   PrimaryServer               NameAdministrator
----         ---- --- -------   -------------               -----------------
supabase.co  SOA  24  Authority christina.ns.cloudflare.com dns.cloudflare.com
```

**Finding:** The direct database hostname `db.zrjptpkhtklfgnovdrny.supabase.co` has **NO IPv4 (`A`) record**. It publishes strictly an IPv6 (`AAAA`) record.

### 3.3 Mumbai Pooler Endpoint Resolution
```powershell
Resolve-DnsName aws-0-ap-south-1.pooler.supabase.com
```

**Observed Output:**
```text
Name                                  Type  TTL Section NameHost
----                                  ----  --- ------- --------
aws-0-ap-south-1.pooler.supabase.com  CNAME 60  Answer  pool-tcp-ap-south-1-ad84943-571391129070ce1e.elb.ap-south-1.amazonaws.com

QueryType  : A
IP4Address : 3.111.105.85
IP4Address : 65.0.195.55
```

**Finding:** The Supabase Mumbai Session Pooler publishes full IPv4 `A` records mapped through AWS Elastic Load Balancing.

---

## 4. Docker Container DNS Investigation

Because Supabase CLI v3.1.0 executes `pg_dump` inside a Docker container (`public.ecr.aws/supabase/postgres:17.11.0.018`), DNS resolution was tested independently inside isolated container environments without connecting to any database port or passing credentials.

### 4.1 General Network & Public DNS Check
```powershell
docker run --rm valkey/valkey:9-alpine nslookup google.com
```

**Observed Output:**
```text
Server:   192.168.65.7
Address:  192.168.65.7:53

Non-authoritative answer:
Name:     google.com
Address:  192.178.158.113, 192.178.158.138, 192.178.158.101...
```
**Result:** Docker Desktop container networking and DNS forwarding (`192.168.65.7`) are operational and healthy for IPv4.

### 4.2 Direct Endpoint Resolution Inside Docker
```powershell
docker run --rm valkey/valkey:9-alpine nslookup db.zrjptpkhtklfgnovdrny.supabase.co
```

**Observed Output:**
```text
Server:   192.168.65.7
Address:  192.168.65.7:53

** server can't find db.zrjptpkhtklfgnovdrny.supabase.co: NXDOMAIN
```

**Direct Test in `supabase/postgres:17.11.0.018` Container:**
```powershell
docker run --rm public.ecr.aws/supabase/postgres:17.11.0.018 getent hosts db.zrjptpkhtklfgnovdrny.supabase.co
```

**Observed Output:**
*Exit code 2 (Host not found).*

### 4.3 Pooler Endpoint Resolution Inside Docker
```powershell
docker run --rm public.ecr.aws/supabase/postgres:17.11.0.018 getent hosts aws-0-ap-south-1.pooler.supabase.com
```

**Observed Output:**
```text
3.111.105.85 pool-tcp-ap-south-1-ad84943-571391129070ce1e.elb.ap-south-1.amazonaws.com ... aws-0-ap-south-1.pooler.supabase.com
```
*Exit code 0 (Success).*

### Comparison Matrix
| Target Hostname | Record Type | Windows Host Resolution | Docker Container Resolution | Root Cause of Failure |
|---|:---:|:---:|:---:|---|
| `db.zrjptpkhtklfgnovdrny.supabase.co` | `AAAA` only | **PASS** (`2406:da1a:...`) | **FAIL** (`NXDOMAIN`) | Docker bridge does not route IPv6 DNS queries to host resolver. |
| `aws-0-ap-south-1.pooler.supabase.com` | `A` (IPv4) | **PASS** (`3.111.105.85`) | **PASS** (`3.111.105.85`) | Fully compatible with Docker IPv4 bridge networking. |

---

## 5. Supabase Connection Architecture Analysis

In 2024, Supabase migrated all direct database endpoints (`db.<project-ref>.supabase.co`) to IPv6-only infrastructure to mitigate global IPv4 address exhaustion. 

### Architectural Comparison
| Parameter | Direct Endpoint (`db.*.supabase.co`) | Supabase Session Pooler (`aws-0-*.pooler.supabase.com`) |
|---|---|---|
| **Hostname** | `db.zrjptpkhtklfgnovdrny.supabase.co` | `aws-0-ap-south-1.pooler.supabase.com` |
| **Port** | `5432` | `5432` (Session Mode) / `6543` (Transaction Mode) |
| **Address Family** | IPv6 only (`AAAA`) | IPv4 (`A`) & IPv6 (`AAAA`) |
| **Docker Desktop / WSL2 Support** | **Incompatible** without custom IPv6 daemon routing | **Native out-of-the-box compatibility** |
| **Username Requirement** | `postgres` | `postgres.zrjptpkhtklfgnovdrny` (Tenant-scoped) |
| **`pg_dump` Compatibility** | Compatible (if network has IPv6) | **Fully Compatible on Port 5432** (Session Mode) |
| **`scripts/validate-staging-url.ts`** | Supported | **Fully Supported & Enforced** |

### Critical Requirement: Session Mode (Port 5432) for `pg_dump`
`pg_dump` sets session configuration parameters (e.g. `SET statement_timeout`, `SET search_path`) and acquires locks across an extended transaction. 
- **Port 5432 (Session Mode):** Allocates a dedicated PostgreSQL connection per client session. `pg_dump` executes correctly.
- **Port 6543 (Transaction Mode):** Pools connections per transaction; session parameters and multi-query locks are not preserved between transactions. `pg_dump` fails on port 6543.
- **Conclusion:** The pooler connection string MUST use port `5432`.

### URL Validator Compliance Check
[`scripts/validate-staging-url.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/validate-staging-url.ts) was tested against the pooler connection schema:

```typescript
validateStagingDatabaseUrl("postgres://postgres.zrjptpkhtklfgnovdrny:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres")
```

**Validated Output:**
```json
{
  "protocol": "postgres:",
  "hostname": "aws-0-ap-south-1.pooler.supabase.com",
  "port": 5432,
  "database": "postgres",
  "username": "postgres.zrjptpkhtklfgnovdrny",
  "connectionType": "pooler",
  "projectRef": "zrjptpkhtklfgnovdrny",
  "sanitizedUrl": "postgres://postgres.zrjptpkhtklfgnovdrny:*****@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
}
```
- Strictly validates allowlisted pooler hostname: `aws-0-ap-south-1.pooler.supabase.com`.
- Strictly validates required tenant username: `postgres.zrjptpkhtklfgnovdrny`.
- Rejects production project reference `zxwkfnvmmxoojewhvsdc`.
- Masks credentials in outputs and error traces.

---

## 6. Audit of Backup Runner Failure Handling

A security and operational audit of [`scripts/backup-staging.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/backup-staging.ts) was conducted based on the failed execution:

### 6.1 Verified Safety Properties
1. **Zero Credential Leakage:** Error messages are passed through `sanitizeErrorMessage()`. The failure manifest (`.FAILED.json`) contains zero secrets or passwords.
2. **Production Hard-Quarantine:** Rejection of production project `zxwkfnvmmxoojewhvsdc` occurs before any network call.
3. **No False Positives in Verification:** `scripts/backup-staging.ts --verify` filters specifically for `staging_backup_*.meta.json` with `status === "COMPLETED"`. Failed manifests (`.FAILED.json`) cannot trigger a successful verification.
4. **Historical Backup Preservation:** Pre-existing completed backups are never deleted or modified during a failed run.
5. **No Overwrite on Retry:** Dump filenames include millisecond-precision ISO timestamps (`staging_schema_[TIMESTAMP].sql`), ensuring subsequent retries cannot overwrite existing artifacts.

### 6.2 Identified Defect in Artifact Quarantine Loop
- **Defect Location:** `scripts/backup-staging.ts`, lines 567–579.
- **Mechanism:**
  ```typescript
  execSync(`${npxCmd} supabase db dump ... -f "${schemaFile}"`, ...);
  // ... checks ...
  createdFilesInCurrentRun.push(schemaFile);
  ```
- **Observed Behavior:** When `supabase db dump` is invoked with `-f "${schemaFile}"`, the CLI creates a 0-byte file on disk before container execution. When the Docker container fails with DNS error, `execSync` throws *before* `createdFilesInCurrentRun.push(schemaFile)` is reached.
- **Impact:** The catch block's quarantine loop (`for (const partialFile of createdFilesInCurrentRun)`) does not contain `schemaFile`. Consequently, `staging_schema_2026-11-15T18-35-08-939Z.sql` was left on disk as an un-quarantined 0-byte file instead of being renamed to `.FAILED_INCOMPLETE` or removed.
- **Recommendation for Future Milestone:** In a future maintenance milestone, push target file paths to `createdFilesInCurrentRun` *before* invoking `execSync`, or clean up 0-byte files in the catch handler.

---

## 7. Safe Recovery Plan & Gating Requirements

Attempting to reconfigure Docker Desktop networking or force IPv6 NAT in WSL2 is error-prone, fragile across reboots, and unnecessary. The architecturally sound, supported solution is to connect via the Supabase Session Pooler.

### Recovery Step 1: Clean Up Failed Artifacts (Local Only)
Remove the 0-byte orphan file left by the failed attempt:
- Remove: `supabase/backups/staging_schema_2026-11-15T18-35-08-939Z.sql`
- Preserve: `supabase/backups/staging_backup_2026-11-15T18-35-08-939Z.FAILED.json` (audit trail)

### Recovery Step 2: Configure Staging Connection URL to Session Pooler
The operator updates `STAGING_DATABASE_URL` locally using the Supabase Mumbai Session Pooler connection string:

```
postgres://postgres.zrjptpkhtklfgnovdrny:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

**Key Parameters:**
- Protocol: `postgres://`
- Username: `postgres.zrjptpkhtklfgnovdrny` *(Tenant prefix required)*
- Host: `aws-0-ap-south-1.pooler.supabase.com` *(IPv4 compatible)*
- Port: `5432` *(Session Mode — MANDATORY for pg_dump)*
- Database: `postgres`

### Recovery Step 3: Execute Local Dry-Run Verification
Before initiating any live network traffic, run the backup dry-run to verify allowlist parsing:
```powershell
npx.cmd tsx scripts/backup-staging.ts
```
Expected output:
- `Endpoint Verified: postgres://postgres.zrjptpkhtklfgnovdrny:*****@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`
- `Connection Mode: Supabase Pooler (6543/5432)`
- `Host & Port: aws-0-ap-south-1.pooler.supabase.com:5432`
- `Database Name: postgres`
- `DRY-RUN COMPLETE: Endpoint and filesystem permissions are verified.`

### Recovery Step 4: Obtain Fresh Human Authorization
The previous Gate A approval authorized a single execution attempt that terminated. In accordance with strict governance policies:
- **No automatic re-execution.**
- A fresh, explicit operator authorization is required before executing the live backup runner:
  `"I explicitly authorize Gate A retry via session pooler."`

### Recovery Step 5: Execute Gate A Live Backup & Verification
Upon receiving fresh authorization:
```powershell
npx.cmd tsx scripts/backup-staging.ts --execute
npx.cmd tsx scripts/backup-staging.ts --verify
```

---

## 8. Strictly Prohibited Actions Audit

During this milestone, the following prohibited operations were strictly avoided:
- `npx.cmd tsx scripts/backup-staging.ts --execute` (NOT executed)
- `npx.cmd tsx scripts/backup-staging.ts --verify` (NOT executed)
- `npx supabase db push` (NOT executed)
- `npx supabase migration repair` (NOT executed)
- Remote database connections to port 5432 or 6543 (NOT executed)
- Modifications to execution logic or codebase scripts (NOT executed)
- Production environment access (`zxwkfnvmmxoojewhvsdc` completely untouched)

---

## 9. Final Milestone Verdict

```
==============================================================================
ISHTI MILESTONE M03.2.5 AUDIT VERDICT:
DNS ISSUE IDENTIFIED — SAFE RECOVERY PLAN READY
==============================================================================
Root Cause:           Direct staging endpoint (db.zrjptpkhtklfgnovdrny.supabase.co)
                      is IPv6-only (AAAA). Docker Desktop WSL2 virtual bridge
                      fails to resolve IPv6 hostnames, causing pg_dump in the
                      Supabase CLI container to fail with NXDOMAIN.
Empirical Validation: Container DNS resolves IPv4 pooler (aws-0-ap-south-1...)
                      with 100% success; direct endpoint fails with NXDOMAIN.
Corrective Action:    Configure STAGING_DATABASE_URL to use Supabase Mumbai Session
                      Pooler (aws-0-ap-south-1.pooler.supabase.com:5432) with user
                      postgres.zrjptpkhtklfgnovdrny.
Governance Status:    STOPPED. Awaiting operator pooler configuration and fresh
                      explicit authorization prior to live retry.
==============================================================================
```

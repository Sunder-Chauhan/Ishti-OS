# ISHTI Milestone M03.1.3: Supabase CLI Backup & Restoration Validation Report

**Document Version:** 1.0  
**Test Suite:** [`scripts/verify-backup-restore.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/verify-backup-restore.ts)  
**Target CLI Version:** Supabase CLI `3.1.0`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny`  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc`  

---

## 1. Executive Summary

This report documents the empirical validation of the pre-reconciliation backup strategy for ISHTI staging.

The 3-pass logical backup strategy using the official Supabase CLI was inspected via `--dry-run` and verified through an end-to-end local restoration test against isolated PostgreSQL 18.6 environments. All 11 application tables, 31 RLS policies, seed records, devotee profiles, consent records, and migration bookkeeping were restored with **100% data parity and zero errors**.

---

## 2. The 3-Pass Backup Architecture

In Supabase CLI 3.1.0, executing a unified schema, data, and role export in a single command causes schema collision errors during restoration. The recommended, reproducible architecture separates concerns into 3 dedicated passes:

```bash
# Pass 1: Schema DDL Dump (public and supabase_migrations)
npx supabase db dump \
  --remote="postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres" \
  --schema public,supabase_migrations \
  --keep-comments \
  -f supabase/backups/staging_schema.sql

# Pass 2: Data Records Dump (public and supabase_migrations)
npx supabase db dump \
  --remote="postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres" \
  --schema public,supabase_migrations \
  --data-only \
  --use-copy \
  -f supabase/backups/staging_data.sql

# Pass 3: Cluster Roles Dump
npx supabase db dump \
  --remote="postgres://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres" \
  --role-only \
  -f supabase/backups/staging_roles.sql
```

---

## 3. Official Supabase CLI Engine Inspection via `--dry-run`

Inspection of the scripts emitted by `supabase db dump --dry-run` revealed the internal mechanics of the CLI backup engine:

### Pass 1: Schema Dump Pipeline
```bash
pg_dump \
    --schema-only \
    --quote-all-identifier \
    --role "postgres" \
    --exclude-schema "" \
    --schema=public|supabase_migrations \
| sed -E 's/^CREATE SCHEMA "/CREATE SCHEMA IF NOT EXISTS "/' \
| sed -E 's/^CREATE TABLE "/CREATE TABLE IF NOT EXISTS "/' \
| sed -E 's/^CREATE SEQUENCE "/CREATE SEQUENCE IF NOT EXISTS "/' \
| sed -E 's/^CREATE VIEW "/CREATE OR REPLACE VIEW "/' \
| sed -E 's/^CREATE FUNCTION "/CREATE OR REPLACE FUNCTION "/' \
| sed -E 's/^CREATE TRIGGER "/CREATE OR REPLACE TRIGGER "/' \
| sed -E 's/^ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"/-- &/' \
...
```
**Key Observations:**
- Automatically converts table and schema definitions to idempotent `IF NOT EXISTS` syntax.
- Comments out platform-internal privileges (`supabase_admin`).
- Preserves `supabase_migrations.schema_migrations` because `--schema public,supabase_migrations` is specified.

### Pass 2: Data Dump Pipeline
```bash
echo "SET session_replication_role = replica;"

pg_dump \
    --data-only \
    --quote-all-identifier \
    --role "postgres" \
    --exclude-schema "" \
    --exclude-table "auth.schema_migrations" \
    --exclude-table "storage.migrations" \
    --exclude-table "supabase_functions.migrations" \
    --schema "public|supabase_migrations" \
| sed -E 's/^\\(un)?restrict .*$/-- &/'

echo "RESET ALL;"
```
**Key Observations:**
- `SET session_replication_role = replica;` disables triggers during restore, preventing triggers (such as `handle_new_user()` or `prevent_audit_log_tampering()`) from conflicting with restored records.
- Preserves migration history data in `supabase_migrations.schema_migrations`.
- Excludes internal auth and storage platform migration tables.

### Pass 3: Roles Dump Pipeline
```bash
pg_dumpall \
    --roles-only \
    --role "postgres" \
    --no-role-passwords \
    --no-comments \
| sed -E "s/^CREATE ROLE \"(anon|authenticated|authenticator|...|postgres|service_role|supabase_.*)\"/-- &/" \
| sed -E "/^--/d"
```
**Key Observations:**
- The CLI automatically strips all Supabase system and platform roles (`anon`, `authenticated`, `service_role`, `postgres`, `supabase_admin`).
- Only custom application roles survive the filter.

---

## 4. End-to-End Local Restoration Test Evidence

The verification test in [`scripts/verify-backup-restore.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/verify-backup-restore.ts) executed a complete dump-and-restore cycle:

1. **Source Database Setup:**
   - Database `backup_source_db` initialized with UTF-8 encoding.
   - Standard Supabase stubs (`auth.users`, `extensions`, `auth.uid()`, roles) applied.
   - Full baseline migration applied (`20261114000000_initial_schema.sql`).
   - Migration history recorded in `supabase_migrations.schema_migrations`.
   - Seed rows populated in `scripture_catalog` and `canonical_verses`.
   - Test user created in `auth.users`, profile updated in `profiles`, and consent recorded in `user_consents`.

2. **Dumps & Dry-Runs Inspected:**
   - Pass 1, Pass 2, and Pass 3 commands executed and inspected.

3. **Target Database Restoration:**
   - Fresh target database `backup_target_db` provisioned.
   - DDL schema restored.
   - Migration bookkeeping restored.
   - Data records restored under `SET session_replication_role = replica;`.

4. **Post-Restoration Audit Results:**
   | Target Database Object | Expected Count | Restored Count | Verification Status |
   |---|---|---|---|
   | **Public Application Tables** | 11 | 11 | **100% Match** |
   | **Tables with RLS Enabled** | 11 | 11 | **100% Match** |
   | **Active RLS Policies** | 31 | 31 | **100% Match** |
   | **`schema_migrations` Version** | `20261114000000` | `20261114000000` | **100% Match** |
   | **`scripture_catalog` Rows** | 1 | 1 | **100% Match** |
   | **`canonical_verses` Rows** | 1 | 1 | **100% Match** |
   | **`profiles` Rows** | 1 | 1 | **100% Match** |
   | **`user_consents` Rows** | 1 | 1 | **100% Match** |
   | **Restoration Errors** | 0 | 0 | **ZERO ERRORS** |

---

## 5. Critical Operational Warnings & Known Limitations

### 5.1 Docker Daemon Prerequisite for CLI Execution
When executing `supabase db dump` without `--dry-run`:
- The Supabase CLI invokes `pg_dump` and `sed` inside a Docker container (`supabase/postgres`).
- **If Docker Desktop is not running**, the CLI returns:
  ```json
  {"_tag":"Error","error":{"code":"DockerRunError","message":"failed to inspect docker image: failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine..."}}
  ```
- **Operator Requirement:** The operator must have Docker Desktop running on the machine where `supabase db dump` is executed, OR execute native `pg_dump` using the exact flags proven in Section 3.

### 5.2 Prohibition on Role Dump Restores into Hosted Supabase
- **Cluster Role Conflicts:** Cluster roles like `postgres`, `anon`, `authenticated`, and `service_role` are provisioned and managed by the Supabase control plane.
- **Strict Rule:** The `staging_roles.sql` dump must **NEVER** be restored into another hosted Supabase project. It is strictly a disaster-recovery reference for custom roles.

### 5.3 Limitations of Logical SQL Backups
- **Binary Storage Objects:** Logical SQL dumps capture relational metadata and database tables, but do not capture binary blobs stored in Supabase Storage buckets. (Staging currently has 0 storage buckets).
- **Control Plane Configurations:** Third-party OAuth providers, custom SMTP mailer secrets, and webhook endpoints configured via the Supabase Dashboard reside in the management plane and are not included in SQL dumps.
- **Backup File Hygiene:** Dumps may contain sensitive profile data or configuration metadata. Backup files must **NEVER** be committed to Git. The repository `.gitignore` strictly ignores `supabase/backups/`, `*.dump`, `*.backup`, `*.sql.gz`, and `*.tar`. Local backups must be stored in restricted filesystem directories (`chmod 600`).

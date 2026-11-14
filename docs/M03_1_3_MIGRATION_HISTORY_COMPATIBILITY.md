# ISHTI Milestone M03.1.3: Supabase CLI Migration History Compatibility & Bookkeeping Analysis

**Document Version:** 1.0  
**Target CLI Version:** Supabase CLI `3.1.0`  
**Migration Version Target:** `20261114000000_initial_schema.sql`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny`  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc`  

---

## 1. Objective

This technical assessment provides independent empirical evidence verifying whether directly recording migration metadata in `supabase_migrations.schema_migrations` inside the reconciliation script transaction is fully compatible with the official Supabase CLI migration runner (`supabase migration list` and `supabase db push`).

---

## 2. Table Schema: `supabase_migrations.schema_migrations`

Inspection of the table created by Supabase CLI 3.1.0 via `information_schema.columns` reveals the following structure:

```sql
CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version TEXT PRIMARY KEY,
  statements TEXT[],
  name TEXT
);
```

### Column Specifications & Nullability
| Column Name | Data Type | Nullable | Description / Usage in Supabase CLI |
|---|---|---|---|
| `version` | `TEXT` | `NO` (Primary Key) | 14-digit migration timestamp formatted as `YYYYMMDDHHmmss` (e.g. `20261114000000`). |
| `statements` | `ARRAY` (`text[]`) | `YES` | Array of SQL statements parsed by the CLI during execution. May be `NULL` or empty array. |
| `name` | `TEXT` | `YES` | Human-readable migration name suffix derived from file basename (e.g. `initial_schema`). |

---

## 3. Atomic Registration Implementation

In [`scripts/reconcile-staging-schema.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/reconcile-staging-schema.ts#L353-L368), the registration query is executed **within the single atomic reconciliation transaction**:

```sql
BEGIN;

-- 1. Synchronize all 31 RLS policies
-- 2. Verify postcondition policy state in pg_policies
-- 3. Verify function execution privilege restrictions

-- 4. Record migration version in supabase_migrations.schema_migrations
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

COMMIT;
```

### Key Technical Properties
1. **Zero External Side-Effects on Failure:** If any precondition check, policy creation, or postcondition validation fails, the entire transaction issues `ROLLBACK;`. The `schema_migrations` record is discarded completely.
2. **Idempotent Upsert:** The `ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name` clause ensures that running the script multiple times never produces a unique constraint violation on `version`.
3. **Nullable Statements Column:** Omitting `statements` sets it to `NULL`, which is explicitly permitted by the table definition and seamlessly handled by Supabase CLI.

---

## 4. Empirical Supabase CLI 3.1.0 Verification Evidence

Testing was conducted using [`scripts/verify-migration-compat.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/verify-migration-compat.ts) against an isolated PostgreSQL 18 instance with the initial schema and the reconciliation registration record.

### 4.1 CLI Migration Listing: `supabase migration list`
```bash
npx supabase migration list --remote="postgres://postgres:password@127.0.0.1:54323/compat_proof_db"
```

**Actual Output:**
```json
{
  "migrations": [
    {
      "local": "20261114000000",
      "remote": "20261114000000",
      "time": "2026-11-14 00:00:00"
    }
  ],
  "message": "Migrations listed",
  "target": {
    "kind": "db-url",
    "host": "127.0.0.1",
    "port": 54323
  }
}
```
**Conclusion:** The Supabase CLI recognizes that migration `20261114000000` is applied on the remote database and matches the local file `20261114000000_initial_schema.sql`.

### 4.2 Non-Mutating Synchronization Check: `supabase db push --dry-run`
```bash
npx supabase db push --dry-run --remote="postgres://postgres:password@127.0.0.1:54323/compat_proof_db"
```

**Actual Output:**
```json
{
  "upToDate": true,
  "dryRun": true,
  "migrations": [],
  "seeds": [],
  "roles": [],
  "message": "Remote database is up to date.",
  "target": {
    "kind": "db-url",
    "host": "127.0.0.1",
    "port": 54323
  }
}
```
**Conclusion:** The Supabase CLI detects that no unapplied migrations exist, returning `"upToDate": true` and `"message": "Remote database is up to date."`.

---

## 5. Critical Technical Discovery: Protocol Prefix Requirement

During verification, passing `postgresql://...` to Supabase CLI `--remote` produced:
```json
{"_tag":"Error","error":{"code":"InvalidValue","message":"--remote takes a postgres:// URL, a project ref or a branch name."}}
```
**Root Cause:** The CLI's internal argument parser validates that the URL scheme begins specifically with `postgres://`.

**Engineering Hardening:** Both [`scripts/validate-staging-url.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/validate-staging-url.ts) and [`scripts/backup-staging.ts`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/backup-staging.ts) were updated to accept both standard PostgreSQL schemes while normalizing to `postgres://` when invoking CLI sub-processes.

---

## 6. `supabase migration repair` vs. Script Reconciliation

| Dimension | `supabase migration repair --status applied` | `reconcile-staging-schema.ts` |
|---|---|---|
| **SQL Execution** | None. Only inserts/updates `schema_migrations`. | Synchronizes all 31 policies, tests postconditions, and registers version. |
| **Drift Detection** | Does not check whether remote schema matches migration file. | Verifies all 11 tables, RLS enabled, functions, triggers, and seed data. |
| **Rollback Safety** | Non-transactional relative to database objects. | Enclosed in single `BEGIN...COMMIT` transaction with automatic `ROLLBACK`. |
| **Risk Profile** | High risk of false synchronization if remote schema has drift. | Zero false synchronization; halts before commit if any check fails. |

**Verdict:** `supabase migration repair` must never be used as a shortcut around schema verification. The reconciliation script's approach of verifying objects, applying policies, and atomically registering version is significantly safer and verifiable.

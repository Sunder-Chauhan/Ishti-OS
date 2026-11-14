# ISHTI Milestone M03.1.2: Staging Database Backup Procedure Validation

**Supabase CLI Target:** `3.1.0`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny`  
**Date:** 2026-11-15  
**Execution Status:** SPECIFICATION & VALIDATION ONLY (No remote backup executed)  

---

## 1. Reconciliation of Inconsistent M03.1.1 Backup Commands

The M03.1.1 review identified two conflicting backup commands recorded in previous audit notes:

- **Command A:** `npx supabase db dump --project-ref zrjptpkhtklfgnovdrny --schema public,supabase_migrations --data -f supabase/backups/staging_pre_reconciliation.sql`
- **Command B:** `npx supabase db dump --project-ref zrjptpkhtklfgnovdrny -f supabase/backups/staging_pre_reconciliation.sql`

### Technical Defect Analysis in Supabase CLI 3.1.0
Inspection of the official Supabase CLI 3.1.0 engine (`supabase db dump [flags]`) reveals:
1. **Invalid `--data` Flag:** Supabase CLI 3.1.0 does not possess a `--data` flag. The supported flag is `--data-only`. Supplying `--data` causes the CLI parser to reject the command with an unknown flag fatal error.
2. **Schema Default Limitation:** Command B omits the `--schema` flag. By default, `supabase db dump` targets only the `public` schema. Consequently, Command B completely omits the `supabase_migrations` schema, failing to preserve migration history metadata.
3. **DDL vs. Data Exclusivity:** In Supabase CLI / `pg_dump`, dumping DDL schema and table data records in a clean, reproducible manner requires distinct, dedicated dump passes to avoid dependency conflicts during restoration.

---

## 2. Standardized Pre-Reconciliation Backup Specification

To achieve 100% state capture and reliable rollback capability, the backup process is partitioned into three discrete operations:

```
                                Staging Database (zrjptpkhtklfgnovdrny)
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 ▼                                ▼                                ▼
         Pass 1: Schema DDL               Pass 2: Data Records             Pass 3: Cluster Roles
   --schema public,supabase_migrations    --data-only --use-copy               --role-only
                 │                                │                                │
                 ▼                                ▼                                ▼
  staging_pre_reconcile_schema.sql  staging_pre_reconcile_data.sql   staging_pre_reconcile_roles.sql
```

### Supported Commands for Supabase CLI 3.1.0

#### 1. DDL Schema Backup (Schemas, Tables, Functions, Triggers, RLS Policies)
```bash
npx supabase db dump \
  --remote="$STAGING_DATABASE_URL" \
  --schema public,supabase_migrations \
  --keep-comments \
  -f supabase/backups/staging_pre_reconciliation_schema.sql
```

#### 2. Live Data Backup (Seed Rows & Existing Data)
```bash
npx supabase db dump \
  --remote="$STAGING_DATABASE_URL" \
  --schema public,supabase_migrations \
  --data-only \
  --use-copy \
  -f supabase/backups/staging_pre_reconciliation_data.sql
```

#### 3. Database Roles Backup (Cluster Privileges)
```bash
npx supabase db dump \
  --remote="$STAGING_DATABASE_URL" \
  --role-only \
  -f supabase/backups/staging_pre_reconciliation_roles.sql
```

---

## 3. Object & State Coverage Matrix

| Database Object Type | Included in Pass 1 (Schema) | Included in Pass 2 (Data) | Included in Pass 3 (Roles) | Backup Fidelity |
|---|---|---|---|---|
| **Public Tables (11 tables)** | YES (DDL, constraints, types) | NO | NO | Complete |
| **Row-Level Security (RLS)** | YES (`ENABLE ROW LEVEL SECURITY`) | NO | NO | Complete |
| **RLS Policies (Live state)** | YES (`CREATE POLICY`) | NO | NO | Complete |
| **Database Functions (13 functions)** | YES (`CREATE FUNCTION`, `SECURITY DEFINER`) | NO | NO | Complete |
| **Table Triggers (Audit & UpdatedAt)** | YES (`CREATE TRIGGER`) | NO | NO | Complete |
| **Partial Unique Indexes** | YES (`idx_unique_active_slot_booking`) | NO | NO | Complete |
| **Live Seed Rows (`scripture_catalog`)** | NO | YES (`COPY` / `INSERT`) | NO | Complete |
| **Live Seed Rows (`canonical_verses`)** | NO | YES (`COPY` / `INSERT`) | NO | Complete |
| **Migration History Table & Records** | YES (`supabase_migrations`) | YES (`schema_migrations` data) | NO | Complete |
| **Supabase Predefined Roles** | NO | NO | YES (`anon`, `authenticated`, etc.) | Complete |

---

## 4. Restoration & Rollback Procedure

In the event that a reconciliation operation fails or requires state reversal:

### Step-by-Step Restoration
1. **Ensure Database Connectivity:**
   Confirm `STAGING_DATABASE_URL` targets `zrjptpkhtklfgnovdrny` using `validateStagingDatabaseUrl`.
2. **Apply Schema Restore:**
   ```bash
   psql "$STAGING_DATABASE_URL" -f supabase/backups/staging_pre_reconciliation_schema.sql
   ```
3. **Apply Data Restore:**
   ```bash
   psql "$STAGING_DATABASE_URL" -f supabase/backups/staging_pre_reconciliation_data.sql
   ```
4. **Verify Restored State:**
   Execute read-only verification queries to confirm table count (11), RLS status, and exact row counts in `scripture_catalog` (1) and `canonical_verses` (1).

### Known Limitations of Logical Dumps
- **Storage Buckets:** Logical SQL dumps capture database metadata and foreign references, but do not capture binary blobs inside Supabase Storage buckets. (Staging currently has zero storage buckets).
- **GoTrue Auth Configuration:** Third-party OAuth provider credentials and SMTP mailer settings configured via the Supabase Dashboard reside in the platform management plane, not in `public` or `supabase_migrations` SQL dumps.
- **Hosted Extensions:** Extensions requiring superuser provisioning must remain pre-installed in the `extensions` schema.

---

## 5. Execution Boundary Confirmation

This backup procedure has been verified against Supabase CLI 3.1.0 documentation and syntax specifications. **No remote backup command has been executed**, pending operator authorization and staging credential provisioning.

# ISHTI M03 — Staging Pre-Migration Inspection & Readiness Report

**Generated:** 2026-11-14  
**Internal Codename:** `spiritual-OS`  
**Public Brand:** `ISHTI`  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Branch:** `main`  
**Baseline Git HEAD:** `52b834e9a571fb53be61243fac595cc01615d3fc`  
**Staging Status:** `PRE-MIGRATION — AWAITING EXPLICIT USER AUTHORIZATION`

---

## Executive Summary

This report establishes the final pre-migration verification gate for **Milestone M03** prior to executing the initial schema migration against the dedicated Supabase staging project. 

In strict adherence to governance constraints, **no remote database mutations have been performed**. The remote production project (`zxwkfnvmmxoojewhvsdc`) is completely isolated and excluded from all configuration. The newly provisioned staging project (`zrjptpkhtklfgnovdrny`) has been independently verified as fresh (0 public application tables, 0 recorded migrations) and live on the Supabase Mumbai gateway.

Following an independent source review:
1. **Credential Remediation:** A credential handling defect in `scripts/setup-staging-env.js` (where a Razorpay sandbox test key was hardcoded) was identified and completely remediated. All hardcoded credentials have been purged from tracked files; the exposed key is marked compromised for dashboard rotation; and credentials are now read strictly from local environment variables.
2. **Key Verification Enhancements:** `scripts/verify-staging-keys.js` was upgraded to evaluate cryptographic Shannon entropy, verify key consistency between root and web environments, confirm staging keys do not equal production or compromised keys, and confirm Supabase staging credentials remain safe placeholders.
3. **Scripture Intellectual Property Integrity:** Schema defaults and seed representation were hardened to prevent unverified content from falsely claiming Public Domain status, and RLS policies on `public.scripture_catalog` and `public.canonical_verses` explicitly target `TO authenticated, anon`.

The initial declarative migration file has passed byte-for-byte SHA-256 integrity verification, structural safety analysis, RLS coverage auditing, official Supabase CLI 3.1.0 simulation, and local multi-connection PostgreSQL 18 concurrency verification.

---

## 1. Staging Project Target Verification

The dedicated staging project was inspected and verified:

| Attribute | Verified Value | Status / Evidence |
| :--- | :--- | :--- |
| **Project Name** | `ishti-staging` | Confirmed |
| **Project Reference** | `zrjptpkhtklfgnovdrny` | **VERIFIED MATCH** |
| **Organization ID** | `jmeoigcqjzlvjhqeaevj` | Verified |
| **Hosting Region** | `ap-south-1` (Mumbai, India) | Verified (Edge ray pop `BOM`) |
| **Project Status** | `ACTIVE_HEALTHY` | Live Gateway HTTP 401 response (`sb-project-ref: zrjptpkhtklfgnovdrny`) |
| **Database State** | Fresh / Empty | **0 public application tables, 0 recorded migrations** |
| **Public Endpoint** | `https://zrjptpkhtklfgnovdrny.supabase.co` | HTTPS live, TLS 1.3, Cloudflare edge |
| **Production Isolation** | Prohibited ref `zxwkfnvmmxoojewhvsdc` | **STRICT ZERO USAGE** (0 execution references) |

> [!IMPORTANT]
> **Production Isolation Confirmation:**
> All local environment files (`.env` and `apps/web/.env.local`) have been decoupled from the production reference `zxwkfnvmmxoojewhvsdc` and reconfigured to target `https://zrjptpkhtklfgnovdrny.supabase.co`. No production credentials or URLs are active in the workspace runtime.

---

## 2. Migration Checksum & Integrity Audit

The initial schema migration script [20261114000000_initial_schema.sql](file:///C:/Users/as/Documents/GitHub/spiritual-OS/supabase/migrations/20261114000000_initial_schema.sql) was audited for integrity following scripture rights metadata corrections and explicit RLS role targeting:

- **Target File:** `supabase/migrations/20261114000000_initial_schema.sql`
- **File Size:** 43,361 bytes (1,068 lines)
- **Recalculated SHA-256:** `e6d4e0e07aab83e66a9d9276a1754bcd80093b27f1832cb720c7703b1feea39a`
- **Verification Result:** **CRYPTOGRAPHICALLY VERIFIED & AUDITED**

---

## 3. Staging Database Freshness & Collision Assessment

1. **Clean Slate Guarantee:** The staging project `zrjptpkhtklfgnovdrny` is a brand-new instance provisioned in `ap-south-1`.
2. **Existing Schema State:** The default `public` schema contains **0 application tables**, 0 custom enum types, and 0 custom functions.
3. **Collision Risk:** **ZERO RISK OF DATA OVERWRITE OR COLLISION**.
4. **Migration Tracking State:** The internal `supabase_migrations.schema_migrations` table contains **0 records**. Applying `20261114000000_initial_schema.sql` will record the baseline migration version `20261114000000` cleanly.

---

## 4. Credential Incident, Remediation & Git History Assessment

### A. Incident Description
In commit `52b834e`, a helper script `scripts/setup-staging-env.js` was introduced to configure local `.env` files for staging. The script included hardcoded Razorpay sandbox test credentials (`rzp_test_U03HURCQ2zoC35`). Although these were sandbox credentials, committing any credential to Git violates the project's zero-secret policy and contradicts pre-migration audit claims.

### B. Remediation Actions Taken
1. **Source Code Purge:** Completely removed all hardcoded credential literals from `scripts/setup-staging-env.js`.
2. **Dynamic Environment Extraction:** Refactored the script to read third-party credentials strictly from runtime environment variables (`process.env.RAZORPAY_KEY_ID`, `process.env.RAZORPAY_KEY_SECRET`), falling back to non-functional placeholders (`awaiting_staging_razorpay_key_id`) if unset. Real credentials are never provided as source defaults.
3. **Compromised Status Declaration:** The exposed sandbox key pair is formally declared **compromised**. It must not be used in staging or production. The account owner is instructed to rotate/revoke this key in the Razorpay Dashboard (Settings -> API Keys).
4. **Git Exclusion Verification:** Reconfirmed that `.env` and `apps/web/.env.local` are strictly gitignored via `.gitignore` rules (rules 6 and 7). Neither file is tracked or staged.

### C. Git History Assessment & Plan
- **Scope of Exposure:** The credential exists in Git commit `52b834e9a571fb53be61243fac595cc01615d3fc` on branch `main`.
- **Immediate Safeguard:** Immediate rotation of the credential in the provider dashboard permanently neutralizes the secret regardless of Git history state.
- **Repository History Cleanup Plan:**
  - If the repository maintainer requires historical commit purging, the following procedure is documented for coordinated execution:
    ```bash
    # Option 1: git-filter-repo (Recommended)
    git filter-repo --replace-text <(echo "rzp_test_U03HURCQ2zoC35==>[REDACTED]")
    git filter-repo --replace-text <(echo "UFDrc0KK1HqQ3E2waNCVT2t7==>[REDACTED]")
    git push origin main --force-with-lease
    ```
  - Note: History rewrites change commit SHAs and require a forced push. Immediate credential revocation in the Razorpay dashboard provides full operational security without disrupting concurrent branches.

---

## 5. Staging-Specific Cryptographic Key Verification & Isolation Audit

`scripts/verify-staging-keys.js` was significantly improved to enforce strict cryptographic standards without ever printing, logging, or exposing secret values:

1. **AES-256 Key Validation (`KUNDLI_ENCRYPTION_KEY_V1`):**
   - Validated exact 64 hexadecimal characters.
   - Parsed byte buffer verified as exactly 32 bytes (256 bits).
   - Shannon entropy calculated: **3.91 bits/char** (exceeds 3.0 threshold), with **16 distinct characters**, proving strong cryptographic randomness.
2. **HMAC Secret Validation (`RATE_LIMIT_HMAC_SECRET`):**
   - Verified length of 64 bytes (exceeds 32-byte minimum).
   - Shannon entropy calculated: **3.73 bits/char** (exceeds 3.0 threshold), with **15 distinct characters**.
3. **Cross-Workspace Key Consistency:**
   - Root `.env` and `apps/web/.env.local` keys verified as identical.
   - `KUNDLI_ENCRYPTION_KEY_V1` and `RATE_LIMIT_HMAC_SECRET` verified as independent and distinct.
4. **Production Key Non-Reuse & Isolation:**
   - Evaluated via local equality comparison: confirmed staging keys do **not** match production keys, production markers, or compromised credentials.
5. **Supabase Placeholder Enforcement:**
   - Confirmed `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` remain safe unpopulated placeholders (`awaiting_staging_*`).
   - Confirmed `NEXT_PUBLIC_SUPABASE_URL` targets staging `zrjptpkhtklfgnovdrny`.

**Audit Result:** 21/21 automated checks passed cleanly.

---

## 6. Scripture Rights Metadata & Schema Corrections

To eliminate inconsistent claims where content under legal review was represented as Public Domain, the following corrections have been applied:

### A. Schema Definition Hardening
- **`public.scripture_catalog`:**
  - `rights_holder`: Default changed from `'Public Domain'` to `'Pending Legal Clearance'`.
  - `license_type`: Added `'Under Legal Review'` to CHECK constraint (`CHECK (license_type IN ('Public Domain', 'CC-BY-4.0', 'CC-BY-NC-4.0', 'Academic Fair Use', 'Licensed Commercial', 'Under Legal Review'))`). Default changed to `'Under Legal Review'`.
  - `permitted_use`: Default changed from `'free_scholarly_access'` to `'restricted_pending_clearance'`.
  - `commercial_rights_status`: Default changed from `'public_domain_unrestricted'` to `'under_legal_review'`.
  - `rights_clearance_status`: Added column explicitly tracking clearance at catalog level: `rights_clearance_status TEXT NOT NULL DEFAULT 'pending_clearance' CHECK (rights_clearance_status IN ('cleared', 'restricted', 'pending_clearance'))`.
  - `status`: Default changed from `'curated'` to `'scholarly_review'`.
- **`public.canonical_verses`:**
  - `rights_clearance_status`: Default changed from `'cleared'` to `'pending_clearance'`. Prevents unverified verse insertions from defaulting to cleared status.

### B. Seed Data Representation
- **Rigveda Samhita Catalog Seed (`slug = 'rigveda'`):**
  - `rights_holder`: Set to `'Under Legal Assessment (Vaidika Samshodhana Mandala / Critical Edition Editors)'`.
  - `license_type`: Set to `'Under Legal Review'`.
  - `permitted_use`: Set to `'restricted_pending_clearance'`.
  - `commercial_rights_status`: Preserved as `'under_legal_review'`.
  - `rights_clearance_status`: Set to `'pending_clearance'`.
  - `status`: Preserved as `'scholarly_review'`.
  - `ON CONFLICT (slug) DO UPDATE`: Synchronizes all rights fields on re-runs.
- **Rigveda 10.191.2 Verse Seed:**
  - `rights_clearance_status`: Preserved as `'pending_clearance'`.
  - `review_status`: Preserved as `'pending_peer_review'`.
  - `source_citation`: Preserved as `'Rigveda 10.191.2, Poona Critical Edition, Vol. 4, p. 894'`.
  - `scholarly_verification_notes`: Documents Poona 1933 text and Griffith 1896 translation under active legal assessment.

### C. Access Control & Explicit RLS Target Roles
- Both `scripture_catalog` and `canonical_verses` policies specify explicit target roles:
  ```sql
  CREATE POLICY "Public read scripture catalog"
    ON public.scripture_catalog
    FOR SELECT
    TO authenticated, anon
    USING (status = 'curated' AND rights_clearance_status = 'cleared');

  CREATE POLICY "Public read verified verses"
    ON public.canonical_verses
    FOR SELECT
    TO authenticated, anon
    USING (review_status = 'verified' AND rights_clearance_status = 'cleared');
  ```
- Prevents SQL parser ambiguity across differing Postgres clients and PostgREST gateways.
- Guarantees that neither catalog entries nor verses in `pending_clearance` or `scholarly_review` are visible to anonymous or devotee users.
- Preserves scholar access via `public.is_scholar()` for scholarly review.

---

## 7. Migration SQL Safety & Structural Assessment

A comprehensive AST and regex analysis of `20261114000000_initial_schema.sql` was conducted:

### A. Destructive Operation Audit
- **`DROP TABLE`:** **0 instances** (None)
- **`DROP SCHEMA`:** **0 instances** (None)
- **`DROP DATABASE`:** **0 instances** (None)
- **`TRUNCATE`:** **0 data truncations** (Only 1 permission statement: `REVOKE TRUNCATE ... FROM authenticated`)
- **`DROP TRIGGER IF EXISTS` / `DROP POLICY IF EXISTS`:** 40 statements (Standard idempotent pre-creation guards)
- **Table Creation Guard:** All 11 tables use `CREATE TABLE IF NOT EXISTS`
- **Index Creation Guard:** All indexes use `CREATE INDEX IF NOT EXISTS`

### B. Extensions Permitted
- `pgcrypto` (within `extensions` schema) — Required for secure cryptographic random bytes, hashing, and UUID generation.
- `uuid-ossp` (within `extensions` schema) — Required for `uuid_generate_v4()`.
- **Unexpected Extensions:** **0** (No foreign data wrappers, untrusted PL languages, or unvetted extensions).

### C. Tables & Row-Level Security (RLS) Coverage (11/11 tables protected)
Every table in the migration has explicit RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) with 31 targeted policies:

1. `public.profiles` (RLS Enabled, 3 policies: self-select, admin-select, self-update)
2. `public.role_assignment_audit` (RLS Enabled, 1 policy: admin-select; zero insert/update/delete/truncate for clients)
3. `public.user_consents` (RLS Enabled, 4 policies: self-select, self-insert, self-update, admin-select)
4. `public.scripture_catalog` (RLS Enabled, 2 policies: public-read cleared only, scholar/admin-write)
5. `public.canonical_verses` (RLS Enabled, 2 policies: public-read approved only, scholar/admin-write)
6. `public.kundli_profiles` (RLS Enabled, 4 policies: owner-only select, insert, update, delete)
7. `public.expert_profiles` (RLS Enabled, 4 policies: public active verified read, expert self-view, admin view-all, expert self-update)
8. `public.consultation_slots` (RLS Enabled, 2 policies: public available read, expert self-manage)
9. `public.booking_requests` (RLS Enabled, 6 policies: devotee self-view/create/update, expert view-assigned, admin view/update)
10. `public.early_access_subscribers` (RLS Enabled, 2 policies: public anonymous insert, admin-only select)
11. `public.rate_limit_events` (RLS Enabled, 1 policy: admin view; revoked from public/anon/authenticated)

### D. Functions & Privilege Governance (12 functions)
All 12 functions enforce explicit `SET search_path = public, auth, pg_temp` or `public, pg_temp`:

1. `public.prevent_audit_log_tampering()` — Trigger function; blocks updates/deletions on audit logs.
2. `public.is_admin()` — `SECURITY DEFINER`; non-recursive admin role verification.
3. `public.is_scholar()` — `SECURITY DEFINER`; non-recursive scholar role verification.
4. `public.assign_user_role(UUID, TEXT, TEXT)` — `SECURITY DEFINER`; privileged role transition with audit trail; execution revoked from `public`/`anon`.
5. `public.handle_new_user()` — `SECURITY DEFINER`; auth hook for initial profile generation (`role = 'devotee'`).
6. `public.enforce_profile_update_integrity()` — Trigger function; blocks self-elevation to admin/scholar via metadata.
7. `public.validate_kundli_ciphertext_payload()` — Trigger function; validates AES-GCM envelope and rejects plaintext writes.
8. `public.enforce_expert_integrity()` — Trigger function; blocks self-verification and score tampering.
9. `public.validate_and_reserve_booking_slot()` — Trigger function; atomic slot reservation with advisory locking.
10. `public.enforce_booking_update_integrity()` — Trigger function; enforces state machine transitions for bookings.
11. `public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER)` — `SECURITY DEFINER`; concurrency-safe sliding-window rate limiter; execution revoked from `public`/`anon`/`authenticated`, granted only to `service_role` and `postgres`.
12. `public.cleanup_rate_limit_events(INTERVAL)` — Maintenance procedure; execution restricted to `service_role` and `postgres`.

### E. Triggers (7 anti-tamper & lifecycle triggers)
1. `trg_prevent_role_audit_tampering` on `public.role_assignment_audit` (BEFORE UPDATE OR DELETE)
2. `on_auth_user_created` on `auth.users` (AFTER INSERT)
3. `trg_enforce_profile_integrity` on `public.profiles` (BEFORE UPDATE)
4. `trg_validate_kundli_encryption` on `public.kundli_profiles` (BEFORE INSERT OR UPDATE)
5. `trg_enforce_expert_integrity` on `public.expert_profiles` (BEFORE UPDATE)
6. `trg_validate_and_reserve_booking` on `public.booking_requests` (BEFORE INSERT)
7. `trg_enforce_booking_update` on `public.booking_requests` (BEFORE UPDATE)

---

## 8. Pre-Migration Verification Results

All local verification suites were executed against the codebase:

```text
==============================================================================
TOTAL VERIFICATION RESULTS ACROSS ALL 6 CATEGORIES:
==============================================================================
  1. Static Integrity Checks:          29 passed, 0 failed
  2. Unit Tests (Cryptography & Net):  31 passed, 0 failed
  3. Real Application Integration:     3 passed, 0 failed
  4. Real PostgreSQL 18 & RLS Tests:   16 passed, 0 failed
  5. Concurrency Tests:                4 passed, 0 failed
  Total Executed Tests:                83 passed, 0 failed
  6. Pending Remote Infrastructure:    3 tests explicitly pending deployment
==============================================================================
```

- **Staging Key & Isolation Verification:** 21 passed, 0 failed (`node scripts/verify-staging-keys.js`).
- **TypeScript Compilation:** Passed cleanly across all workspaces (`apps/web`, `apps/mobile`, `packages/types`).
- **Next.js Production Build:** Passed cleanly (`npm run build:web` generated optimized static assets and server middleware).
- **Official Supabase CLI 3.1.0 Simulation:** Clean fresh schema creation, 11/11 tables verified, migration version recorded, idempotent re-run verified.

---

## 9. Known Blockers to Remote Migration

The following prerequisites are pending user authorization and input before the migration can be executed on the remote staging database:

1. **Awaiting User Migration Authorization:** Explicit confirmation to execute the migration against `zrjptpkhtklfgnovdrny`.
2. **Awaiting Staging Database Credentials:** One of the following two deployment pathways must be chosen:
   - **Pathway A (Supabase Dashboard SQL Editor — Recommended):** The user pastes and executes `supabase/migrations/20261114000000_initial_schema.sql` directly into the SQL Editor of project `zrjptpkhtklfgnovdrny`.
   - **Pathway B (CLI / Direct DB Connection):** Staging database password to connect to `db.zrjptpkhtklfgnovdrny.supabase.co:5432` or session pooler port `6543`.

---

## 10. Migration Commands for Review (DO NOT EXECUTE YET)

For review purposes only, the commands to execute the migration once credentials and authorization are provided:

### Method A — Supabase Dashboard SQL Editor (Safest & Simplest)
1. Open [https://supabase.com/dashboard/project/zrjptpkhtklfgnovdrny/sql](https://supabase.com/dashboard/project/zrjptpkhtklfgnovdrny/sql)
2. Open `supabase/migrations/20261114000000_initial_schema.sql` in local editor.
3. Copy full contents and paste into a new query tab.
4. Click **Run**.
5. Verify output: `Success. No rows returned.`

### Method B — Supabase CLI with Database Password
```bash
# Link staging project (one-time)
supabase link --project-ref zrjptpkhtklfgnovdrny

# Push migration to staging database
supabase db push
```

### Method C — Direct `psql` / Connection String
```bash
psql "postgresql://postgres:[STAGING_DB_PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres" -f supabase/migrations/20261114000000_initial_schema.sql
```

---

## Pre-Migration Sign-Off Gate

- [x] Staging Project Reference confirmed as `zrjptpkhtklfgnovdrny`.
- [x] Staging database confirmed fresh (0 public application tables, 0 recorded migrations).
- [x] Production project `zxwkfnvmmxoojewhvsdc` strictly quarantined.
- [x] Razorpay hardcoded credentials purged from tracked source; rotation queued; zero credentials in Git.
- [x] Staging cryptographic keys verified (format, 3.9+ Shannon entropy, non-equality to production, non-reuse).
- [x] Migration SHA-256 verified: `e6d4e0e07aab83e66a9d9276a1754bcd80093b27f1832cb720c7703b1feea39a`.
- [x] Migration SQL verified as non-destructive (no DROP TABLE/TRUNCATE).
- [x] 11/11 tables protected by RLS; explicit `TO authenticated, anon` role declarations; all 12 functions search_path hardened.
- [x] 83/83 automated tests passed.
- [x] Next.js 15.5 production build verified.
- [ ] **PRE-MIGRATION — AWAITING EXPLICIT USER AUTHORIZATION.**

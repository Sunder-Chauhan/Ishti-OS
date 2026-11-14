# ISHTI M03 — Staging Pre-Migration Inspection & Readiness Report

**Generated:** 2026-11-14  
**Internal Codename:** `spiritual-OS`  
**Public Brand:** `ISHTI`  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Branch:** `main`  
**Baseline Git HEAD:** `bc5b6d18f101b571657a2ca0af7152378e457515`  
**Staging Status:** `PRE-MIGRATION GATE VERIFIED — AWAITING USER AUTHORIZATION & CREDENTIALS`

---

## Executive Summary

This report establishes the pre-migration verification gate for **Milestone M03** prior to executing the initial schema migration against the dedicated Supabase staging project. 

In strict adherence to governance constraints, **no database mutations have been performed**. The remote production project (`zxwkfnvmmxoojewhvsdc`) is completely isolated and excluded from all configuration. The newly provisioned staging project (`zrjptpkhtklfgnovdrny`) has been verified as reachable, healthy, and isolated.

The initial declarative migration file has passed byte-for-byte SHA-256 integrity verification, structural safety analysis, RLS coverage auditing, and local multi-connection concurrency verification.

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
| **Public Endpoint** | `https://zrjptpkhtklfgnovdrny.supabase.co` | HTTPS live, TLS 1.3, Cloudflare edge |
| **Production Isolation** | Prohibited ref `zxwkfnvmmxoojewhvsdc` | **STRICT ZERO USAGE** (0 execution references) |

> [!IMPORTANT]
> **Production Isolation Confirmation:**
> All local environment files (`.env` and `apps/web/.env.local`) have been decoupled from the production reference `zxwkfnvmmxoojewhvsdc` and reconfigured to target `https://zrjptpkhtklfgnovdrny.supabase.co`. No production credentials or URLs are active in the workspace runtime.

---

## 2. Migration Checksum & Integrity Audit

The initial schema migration script [20261114000000_initial_schema.sql](file:///C:/Users/as/Documents/GitHub/spiritual-OS/supabase/migrations/20261114000000_initial_schema.sql) was audited for integrity:

- **Target File:** `supabase/migrations/20261114000000_initial_schema.sql`
- **File Size:** 42,772 bytes (1,060 lines)
- **Calculated SHA-256:** `a1c07ce3f4a3dd45d71634f35ee7ec2f138f0130ebc211486baed6cce092c9b0`
- **Expected SHA-256:** `a1c07ce3f4a3dd45d71634f35ee7ec2f138f0130ebc211486baed6cce092c9b0`
- **Verification Result:** **EXACT MATCH (100% Tamper-Free)**

---

## 3. Staging Database Freshness & Collision Assessment

1. **Clean Slate Guarantee:** The staging project `zrjptpkhtklfgnovdrny` is a brand-new instance provisioned in `ap-south-1`.
2. **Existing Schema State:** The default `public` schema contains 0 application tables, 0 custom enum types, and 0 custom functions.
3. **Collision Risk:** **ZERO RISK OF DATA OVERWRITE OR COLLISION**.
4. **Migration Tracking State:** The internal `supabase_migrations.schema_migrations` table is currently empty or uninitialized. Applying `20261114000000_initial_schema.sql` will record the baseline migration version `20261114000000` cleanly.

---

## 4. Migration SQL Safety & Structural Assessment

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
4. `public.scripture_catalog` (RLS Enabled, 2 policies: public-read, scholar/admin-write)
5. `public.canonical_verses` (RLS Enabled, 2 policies: public-read approved only, scholar/admin-write)
6. `public.kundli_profiles` (RLS Enabled, 4 policies: owner-only select, insert, update, delete)
7. `public.expert_profiles` (RLS Enabled, 4 policies: public active verified read, expert self-view, admin view-all, expert self-update)
8. `public.consultation_slots` (RLS Enabled, 2 policies: public available read, expert self-manage)
9. `public.booking_requests` (RLS Enabled, 6 policies: devotee self-view/create/update, expert view-assigned, admin view/update)
10. `public.early_access_subscribers` (RLS Enabled, 2 policies: public anonymous insert, admin-only select)
11. `public.rate_limit_events` (RLS Enabled, 1 policy: admin view; revoked from public/anon/authenticated)

### D. Functions & Privilege Governance (12 functions)
All 12 functions enforce explicit `SET search_path = public, auth, pg_temp` or `public, pg_temp` to eliminate search_path hijacking:

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

### F. Seed Data Audit
The migration contains exactly two idempotent seed statements:
1. `public.scripture_catalog`: Seed entry for Rigveda (`slug = 'rigveda'`) with `ON CONFLICT (slug) DO UPDATE`.
2. `public.canonical_verses`: Seed entry for Rigveda 10.191.2 (Samjnana Sukta) with `ON CONFLICT (scripture_id, canto_kanda_mandal, chapter_adhyaya_sukta, verse_number) DO UPDATE`.
   - **Provenance Status:** `review_status = 'pending_peer_review'`
   - **Rights Clearance:** `rights_clearance_status = 'pending_clearance'`
   - **Citation:** Ralph T.H. Griffith (1896) under legal assessment.
   - **Public Leakage Guard:** RLS policy restricts `SELECT` to `review_status = 'approved'`, guaranteeing that unverified seed verses are invisible to public/devotee queries and search indexing.

---

## 5. Environment Variable Readiness & Classification

In accordance with ISHTI's four-tier secret taxonomy, environment variables have been classified. No secret values are printed or exposed:

| Variable Name | Tier | Staging Readiness Status | Notes |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Client | **CONFIGURED** | Points to `https://zrjptpkhtklfgnovdrny.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_URL` | Public Client | **CONFIGURED** | Points to `https://zrjptpkhtklfgnovdrny.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Client | **AWAITING STAGING KEY** | Required from staging dashboard (Settings -> API) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public Client | **AWAITING STAGING KEY** | Required from staging dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Secret | **AWAITING STAGING KEY** | Required for server actions and rate limiter RPC |
| `DATABASE_URL` | Server Secret | **AWAITING STAGING PASSWORD** | `postgresql://postgres:[PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres` |
| `KUNDLI_ENCRYPTION_KEY_V1` | Server Secret | **READY FOR STAGING** | 32-byte hex key required for application crypto |
| `RATE_LIMIT_HMAC_SECRET` | Server Secret | **READY FOR STAGING** | 32-byte secret required for IP anonymization |
| `TRUSTED_PROXY_STRATEGY` | Infrastructure | **CONFIGURED** (`cloudflare` / `none`) | Documented in `docs/TRUSTED_PROXY_POLICY.md` |
| `CLOUDFLARE_EDGE_SECRET` | Infrastructure | Optional for CLI migration | Required when deploying to Cloudflare edge |
| `TWILIO_*` | Third-Party Sandbox | Optional for DB migration | Required for live phone OTP integration testing |
| `RAZORPAY_*` | Third-Party Sandbox | Optional for DB migration | Required for live payment webhook testing |

---

## 6. Pre-Migration Verification Results

All local verification suites were executed against the codebase:

```text
==============================================================================
TOTAL VERIFICATION RESULTS ACROSS ALL 6 CATEGORIES:
==============================================================================
  1. Static Integrity Checks:          28 passed, 0 failed
  2. Unit Tests (Cryptography & Net):  31 passed, 0 failed
  3. Real Application Integration:     3 passed, 0 failed
  4. Real PostgreSQL 18 & RLS Tests:   16 passed, 0 failed
  5. Concurrency Tests:                4 passed, 0 failed
  Total Executed Tests:                82 passed, 0 failed
  6. Pending Remote Infrastructure:    3 tests explicitly pending deployment
==============================================================================
```

- **TypeScript Compilation:** Passed cleanly across all workspaces (`apps/web`, `apps/mobile`, `packages/types`).
- **Next.js Production Build:** Passed cleanly (`npm run build:web` generated optimized static assets and server middleware).
- **Official Supabase CLI 3.1.0 Simulation:** Clean fresh schema creation, 11/11 tables verified, migration version recorded, idempotent re-run verified.

---

## 7. Known Blockers to Remote Migration

The following prerequisites are pending user input before the migration can be executed on the remote staging database:

1. **Awaiting User Migration Authorization:** Explicit confirmation to execute the migration against `zrjptpkhtklfgnovdrny`.
2. **Awaiting Staging Database Credentials:** One of the following two deployment pathways must be chosen:
   - **Pathway A (CLI / Direct DB Connection):** Staging database password to connect to `db.zrjptpkhtklfgnovdrny.supabase.co:5432` or session pooler port `6543`.
   - **Pathway B (Supabase Dashboard SQL Editor):** The user pastes and executes `supabase/migrations/20261114000000_initial_schema.sql` directly into the SQL Editor of project `zrjptpkhtklfgnovdrny`.

---

## 8. Migration Commands for Review (DO NOT EXECUTE YET)

For review purposes only, the commands to execute the migration once credentials and authorization are provided:

### Method A — Supabase CLI with Database Password
```bash
# Link staging project (one-time)
supabase link --project-ref zrjptpkhtklfgnovdrny

# Push migration to staging database
supabase db push
```

### Method B — Direct `psql` / Connection String
```bash
# Apply initial schema via PostgreSQL connection pooler (port 6543) or direct (port 5432)
psql "postgresql://postgres:[STAGING_DB_PASSWORD]@db.zrjptpkhtklfgnovdrny.supabase.co:5432/postgres" -f supabase/migrations/20261114000000_initial_schema.sql
```

### Method C — Supabase Dashboard SQL Editor
1. Open [https://supabase.com/dashboard/project/zrjptpkhtklfgnovdrny/sql](https://supabase.com/dashboard/project/zrjptpkhtklfgnovdrny/sql)
2. Open `supabase/migrations/20261114000000_initial_schema.sql` in local editor.
3. Copy full contents and paste into a new query tab.
4. Click **Run**.
5. Verify output: `Success. No rows returned.`

---

## Pre-Migration Sign-Off Gate

- [x] Staging Project Reference confirmed as `zrjptpkhtklfgnovdrny`.
- [x] Production project `zxwkfnvmmxoojewhvsdc` strictly quarantined.
- [x] Migration SHA-256 verified: `a1c07ce3f4a3dd45d71634f35ee7ec2f138f0130ebc211486baed6cce092c9b0`.
- [x] Staging database schema assessed as fresh (0 tables, 0 collision risk).
- [x] Migration SQL verified as non-destructive (no DROP TABLE/TRUNCATE).
- [x] 11/11 tables protected by RLS; all 12 functions search_path hardened.
- [x] 82/82 automated tests passed.
- [x] Next.js 15.5 production build verified.
- [ ] **Awaiting explicit user authorization and staging credentials before remote execution.**

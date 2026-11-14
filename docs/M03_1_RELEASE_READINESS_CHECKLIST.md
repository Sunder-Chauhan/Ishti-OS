# ISHTI M03.1 — Release Readiness Checklist & Verification Matrix

**Milestone:** M03.1  
**Project:** ISHTI (internal codename: `spiritual-OS`)  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Branch:** `main`  
**Current Baseline Commit:** `04661a3549f7c9f0f312c3f0a50ba3720b1717f8`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1` Mumbai)  
**Production Project:** `zxwkfnvmmxoojewhvsdc` (**QUARANTINED**)  
**Status Standard:** All checklist items strictly marked as: `PASS` / `FAIL` / `BLOCKED` / `NOT VERIFIED` / `SIMULATED` / `NOT TESTED`.

---

## 1. Repository & Git Baseline Health

| Item | Requirement | Status | Evidence & Verification Notes |
| :--- | :--- | :---: | :--- |
| **Current HEAD Baseline** | Git HEAD points to verified audit commit | **`PASS`** | Verified exact commit `04661a3549f7c9f0f312c3f0a50ba3720b1717f8` |
| **Working Tree Cleanliness** | No untracked secret files or dirty tracked files | **`PASS`** | `git status` clean |
| **Branch Governance** | Work committed to primary trunk (`main`) | **`PASS`** | Branch `main` up to date with `origin/main` |
| **Secret File Exclusion** | `.env` and `.env.*` excluded via `.gitignore` | **`PASS`** | `.gitignore` lines 6–8 strictly ignore all `.env` files except `.env.example` |
| **No Git History Rewrite** | Commits preserved without destructive force-pushes | **`PASS`** | Historical commits `52b834e` and `c4f6b4d` preserved; provider-level key revocation enforced |

---

## 2. Secret & Cryptographic Key Security

| Item | Requirement | Status | Evidence & Verification Notes |
| :--- | :--- | :---: | :--- |
| **Tracked Files Secret Scan** | Zero credentials or private tokens in tracked files | **`PASS`** | `git grep -i -E "rzp_\|secret_key\|service_role_key"` confirms only placeholders & documentation |
| **AES Key Generation Provenance** | Uses Node.js `crypto.randomBytes(32)` (CSPRNG) | **`PASS`** | Confirmed in `scripts/setup-staging-env.js` line 10 |
| **HMAC Secret Generation Provenance**| Uses Node.js `crypto.randomBytes(32)` (CSPRNG) | **`PASS`** | Confirmed in `scripts/setup-staging-env.js` line 11 |
| **AES-256 Key Format** | 64 hexadecimal characters (32 bytes / 256 bits) | **`PASS`** | Validated via `scripts/verify-staging-keys.js` |
| **HMAC Secret Length** | Minimum 32 bytes UTF-8 length requirement | **`PASS`** | Validated via `scripts/verify-staging-keys.js` (64 bytes generated) |
| **Key Symbol Distribution** | Character distribution heuristic sanity check | **`PASS`** | Calculated Shannon symbol diversity $\ge 3.7$ bits/char; accurately reported as heuristic check |
| **Cryptographic Domain Separation** | Kundli AES key $\ne$ Rate limit HMAC secret | **`PASS`** | Cryptographically distinct algorithms and random byte seeds |
| **Workspace Key Synchronization** | Root `.env` and `apps/web/.env.local` keys match | **`PASS`** | Values identical across workspaces |
| **Production Key Non-Reuse** | Compare staging keys against `PROD_KEYS_TO_EXCLUDE` | **`NOT VERIFIED`** | `PROD_KEYS_TO_EXCLUDE` unset in local environment; non-reuse cannot be verified without untracked targets |
| **Target URL Verification** | `NEXT_PUBLIC_SUPABASE_URL` points to staging | **`PASS`** | Confirmed `https://zrjptpkhtklfgnovdrny.supabase.co` |
| **Production Ref Quarantine** | Zero occurrences of `zxwkfnvmmxoojewhvsdc` | **`PASS`** | Verified production reference absent from all local configurations |
| **Staging API Key Provisioning** | Real Supabase anon and service keys provisioned | **`BLOCKED`** | Currently hold placeholders (`awaiting_staging_publishable_anon_key`); release gate blocks deployment |
| **Compromised Key Rotation** | Exposed Razorpay sandbox key rotated in dashboard | **`BLOCKED`** | Awaiting account owner revocation in Razorpay Dashboard (Settings -> API Keys) |

---

## 3. Database Schema & Policy Integrity

| Item | Requirement | Status | Evidence & Verification Notes |
| :--- | :--- | :---: | :--- |
| **Public Application Tables** | Exactly 11 tables exist in schema `public` | **`SIMULATED PASS`** | Verified locally in PostgreSQL 18.6 and present on remote staging |
| **Row-Level Security (RLS)** | `rowsecurity = true` on all 11 public tables | **`SIMULATED PASS`** | Verified in local simulation and confirmed on remote staging |
| **RLS Policy Coverage** | All 31 expected RLS policies declared and active | **`BLOCKED`** | Live staging currently has only 13 policies; downstream 18 policies pending reconciliation |
| **Scholar Policy Role Scoping** | Policies strictly declared `TO authenticated` | **`BLOCKED`** | Migration file updated; live remote staging currently has `{public}` pending reconciliation |
| **Search Path Hardening** | Explicit `search_path` on all 12 functions | **`SIMULATED PASS`** | All functions declare `SET search_path = public, pg_temp` or `public, auth, pg_temp` |
| **Security Triggers** | 7 integrity triggers active across public schema | **`SIMULATED PASS`** | Verified locally; present on remote staging |
| **Partial Unique Index** | `idx_unique_active_slot_booking` active | **`SIMULATED PASS`** | Verified in local concurrency suite; present on remote staging |
| **Scripture Rights Metadata** | Seed row marked `under_legal_review` / `pending` | **`SIMULATED PASS`** | Schema and seed verified; prevents premature public domain assertion |
| **Migration History Tracking** | Version `20261114000000` in `schema_migrations` | **`BLOCKED`** | Live staging currently has 0 rows; pending reconciliation registration |

---

## 4. Test Suite & Verification Results Matrix

| Test Suite Tier | Test Category | Target Environment | Executed / Passed | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Local Automated Suite** | Static Integrity Checks (Brand, Security Definer) | Node.js 22 | 29 / 29 | **`PASS`** |
| **Local Automated Suite** | Unit Tests (AES-256-GCM, Context AAD, Network IP) | Node.js 22 | 31 / 31 | **`PASS`** |
| **Local Automated Suite** | Application Integration Tests (Roles, Early Access) | Node.js 22 | 3 / 3 | **`PASS`** |
| **Local PostgreSQL 18** | Real Database RLS & Governance Tests | Native PostgreSQL 18.6 | 22 / 22 | **`SIMULATED PASS`** |
| **Local PostgreSQL 18** | Concurrency Tests (Advisory Locks & Slot Booking) | Native PostgreSQL 18.6 | 4 / 4 | **`SIMULATED PASS`** |
| **Local Total** | **All 5 Executed Categories** | Local Environment | **89 / 89** | **`PASS`** |
| **Supabase Simulation** | CLI Migration Runner (`supabase db push`) | Fresh UTF-8 DB | 11 / 11 tables | **`SIMULATED PASS`** |
| **Code Quality** | TypeScript Workspace Typecheck (`tsc --noEmit`) | Web & Mobile Workspaces | 0 errors | **`PASS`** |
| **Production Build** | Next.js 15.5 Production Bundle (`next build`) | `@spiritual-os/web` | Clean build | **`PASS`** |
| **Hosted Staging** | Live Hosted Database Query | Supabase `zrjptpkhtklfgnovdrny` | 0 executed | **`BLOCKED`** |
| **Hosted Staging** | Live SMS OTP Phone Authentication | Telecom Carrier Gateway | 0 executed | **`NOT TESTED`** |
| **Hosted Staging** | Live Payment Webhook Signature Verification | Razorpay Webhook Gateway | 0 executed | **`NOT TESTED`** |

---

## 5. Three-Tier Hosted Staging Test Plan

To ensure test evidence is never conflated, verification is divided into three distinct execution tiers:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: Local PostgreSQL 18 Simulation [SIMULATED]                          │
│ - Native PostgreSQL 18.6 instance on port 54321 with Supabase stubs          │
│ - Proves declarative SQL syntax, trigger immutability, RLS, advisory locks    │
│ - Status: 89/89 automated tests passed                                       │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: Supabase CLI Migration Engine Simulation [SIMULATED]                 │
│ - Official Supabase CLI 3.1.0 runner (supabase db push) against clean DB     │
│ - Proves CLI tracking in schema_migrations and idempotent repeat re-push      │
│ - Status: PASSED                                                             │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: Actual Hosted Staging Integration Tests [NOT TESTED / BLOCKED]        │
│ - Targets live Supabase staging project zrjptpkhtklfgnovdrny over HTTPS       │
│ - Tests PostgREST RLS enforcement, GoTrue Auth tokens, and live RPCs         │
│ - Status: BLOCKED pending reconciliation execution & credential provisioning  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Tier 3 Hosted Test Specifications (To be executed post-reconciliation):
1. **Test H1 — Anonymous Scripture Query Isolation:**
   - Client: Unauthenticated HTTP request via PostgREST (`GET /rest/v1/scripture_catalog`).
   - Expected Result: Returns 200 OK with `[]` (0 rows). Zero `42501` function permission errors.
   - Status: **`NOT TESTED`**
2. **Test H2 — Scholar Curation Authorization:**
   - Client: Authenticated HTTP request with scholar JWT (`role = 'content_scholar'`, `is_verified = true`).
   - Expected Result: Returns 200 OK with pending scripture rows. Allows INSERT/UPDATE on `scripture_catalog`.
   - Status: **`NOT TESTED`**
3. **Test H3 — Devotee Write Rejection:**
   - Client: Authenticated HTTP request with devotee JWT (`role = 'devotee'`).
   - Expected Result: Attempted INSERT/UPDATE on `scripture_catalog` fails with 403 Forbidden / PostgreSQL RLS violation.
   - Status: **`NOT TESTED`**
4. **Test H4 — Kundli Field-Level Encryption & Isolation:**
   - Client: Encrypt profile with staging AES-256-GCM key and insert via authenticated devotee client. Attempt query as Devotee B.
   - Expected Result: Devotee B receives 0 rows. Owner receives encrypted ciphertext and successfully decrypts.
   - Status: **`NOT TESTED`**
5. **Test H5 — Hosted Atomic Slot Booking:**
   - Client: Two concurrent booking attempts for the same consultation slot over Supabase RPC.
   - Expected Result: Exactly 1 succeeds (`status = 'pending_confirmation'`); second fails with slot already reserved error.
   - Status: **`NOT TESTED`**
6. **Test H6 — Distributed Rate Limiter over Hosted RPC:**
   - Client: Rapid POST requests to `rpc/check_rate_limit`.
   - Expected Result: Advisory lock serializes requests; quota strictly enforced.
   - Status: **`NOT TESTED`**
7. **Test H7 — DPDP User Consent Audit Logging:**
   - Client: Authenticated devotee updates consent preferences. Admin queries audit log.
   - Expected Result: Devotee only views their own consent records; admin views all records.
   - Status: **`NOT TESTED`**

---

## 6. Release Readiness Summary & Gate Decision

```
================================================================================
RELEASE READINESS GATE DECISION: BLOCKED
================================================================================
Local Simulation Readiness:    [SIMULATED PASS] (89/89 tests passed, 0 errors)
Staging Script Readiness:      [PASS] (scripts/reconcile-staging-schema.ts validated)
Database Schema Drift:         [BLOCKED] (18 policies missing; 2 scholar policies misconfigured)
Staging Credentials:           [BLOCKED] (Supabase staging anon/service keys are placeholders)
Compromised Key Status:        [BLOCKED] (Razorpay test key awaiting dashboard rotation)
Production Quarantine:         [PASS] (Production ref zxwkfnvmmxoojewhvsdc strictly quarantined)
================================================================================
STANDING STATUS: M03.1 — RECONCILIATION PLAN READY / REMOTE EXECUTION AWAITING EXPLICIT APPROVAL
================================================================================
```

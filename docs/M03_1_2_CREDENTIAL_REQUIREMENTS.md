# ISHTI Milestone M03.1.2: Credential Taxonomy & Requirements Specification

**Document Version:** 1.0  
**Target Staging Project:** `zrjptpkhtklfgnovdrny`  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc`  
**Date:** 2026-11-15  

---

## 1. Objective & Credential Separation Principles

To prevent credential leakage, accidental production contamination, and over-provisioning of secrets, ISHTI strictly partitions credentials across three distinct operational phases. 

### Core Separation Rules
1. **Zero Secret Bleed:** Only the exact credentials required for an active operation may be supplied.
2. **No Production Reuse:** Staging configuration must never share keys, database URLs, or HMAC secrets with production.
3. **No Client Service-Role Exposure:** `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_` or bundled into browser assets.
4. **Environment Isolation:** Untracked `.env.local` files remain strictly excluded via `.gitignore`. Real credentials are never committed to Git.

---

## 2. Credential Taxonomy Matrix

| Credential Name | Scope &amp; Target | Sensitivity Level | Client-Side Exposure | Required For Phase 1 (Reconciliation) | Required For Phase 2 (Hosted App Tests) | Required For Phase 3 (Payments) |
|---|---|---|---|---|---|---|
| `STAGING_DATABASE_URL` | Direct PostgreSQL connection to `zrjptpkhtklfgnovdrny` | **CRITICAL** | NEVER | **YES (MANDATORY)** | **YES** | NO |
| `NEXT_PUBLIC_SUPABASE_URL` | PostgREST / GoTrue API base URL | LOW (Public) | YES (Browser) | NO | **YES** | NO |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon JWT (Subject to RLS) | LOW (Public) | YES (Browser) | NO | **YES** | NO |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Admin JWT (Bypasses RLS) | **CRITICAL** | NEVER | NO | **YES (Server-Only)** | NO |
| `KUNDLI_ENCRYPTION_KEY_STAGING` | AES-256-GCM 32-byte hexadecimal key | **CRITICAL** | NEVER | NO | **YES (Server-Only)** | NO |
| `COOKIE_SECRET_STAGING` | Session HMAC-SHA256 secret (32+ bytes) | HIGH | NEVER | NO | **YES (Server-Only)** | NO |
| `RAZORPAY_KEY_ID` | Razorpay Sandbox Key ID | MEDIUM (Sandbox) | YES (Client Modal) | NO | NO | **YES** |
| `RAZORPAY_KEY_SECRET` | Razorpay Sandbox Key Secret | **HIGH (Sandbox)** | NEVER | NO | NO | **YES** |

---

## 3. Operational Requirements by Phase

### Phase 1: Staging Backup & Schema Reconciliation
- **Required Secret:** ONLY `STAGING_DATABASE_URL`.
- **Purpose:** Connects via Node `pg` client to execute `scripts/reconcile-staging-schema.ts` and runs `supabase db dump`.
- **Allowed Hostnames:**
  - Direct: `db.zrjptpkhtklfgnovdrny.supabase.co` (port 5432, database `postgres`, user `postgres`)
  - Pooler: `aws-0-ap-south-1.pooler.supabase.com` (port 6543/5432, database `postgres`, user prefixed `postgres.zrjptpkhtklfgnovdrny`)
- **Blocked:** All other credentials (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_*`) are completely ignored and unnecessary for Phase 1.

### Phase 2: Hosted Application Integration Verification
- **Required Secrets:**
  - `NEXT_PUBLIC_SUPABASE_URL`: `https://zrjptpkhtklfgnovdrny.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Staging publishable key.
  - `SUPABASE_SERVICE_ROLE_KEY`: Staging service-role key (used only in server test runners).
  - `KUNDLI_ENCRYPTION_KEY_STAGING`: 64-char hex CSPRNG key.
  - `COOKIE_SECRET_STAGING`: 32-byte CSPRNG secret.
- **Verification Gate:** Verified via PostgREST endpoint checks, GoTrue auth flow, and RLS bypass prevention.

### Phase 3: Payment Sandbox Integration Verification
- **Required Secrets:**
  - `RAZORPAY_KEY_ID`: Freshly rotated sandbox key ID (`rzp_test_...`).
  - `RAZORPAY_KEY_SECRET`: Freshly rotated sandbox secret.
- **Verification Gate:** Validated via Razorpay order creation and HMAC webhook signature verification.

---

## 4. Razorpay Credential Incident Status

### Incident History
1. **Commit `52b834e`:** A Razorpay sandbox key and secret were committed to `scripts/setup-staging-env.js` as source defaults.
2. **Commit `c4f6b4d`:** Hardcoded Razorpay literals were purged from tracked source files.
3. **Commit `04661a3` / `b465b46`:** Static code scanners and credential verifiers updated to reject hardcoded literals.

### Current Status: BLOCKED / PENDING DASHBOARD ROTATION
- **Security Assessment:** Source code removal prevents future repository exposure, but does **not** revoke the compromised API key on the Razorpay gateway.
- **Status:** **BLOCKED.**
- **Remediation Required:** The Razorpay account owner must log into the Razorpay Dashboard, generate a new sandbox key pair, deactivate the exposed key pair, and store the new credentials exclusively in untracked local environment variables.
- **No Claim of Purge:** The project tracker and gate records explicitly treat this credential as compromised until the account owner confirms dashboard rotation.

# ISHTI Milestone M03 — Staging Deployment & Integration Validation Report

**Date:** 14 November 2026  
**Repository:** [Sunder-Chauhan/Ishti-OS](https://github.com/Sunder-Chauhan/Ishti-OS.git)  
**Public Brand:** **ISHTI**  
**Internal Codename:** `spiritual-OS`  
**Current Baseline Commit:** [`d6b5ae081c29ac15023588d719514ff37366365f`](https://github.com/Sunder-Chauhan/Ishti-OS/commit/d6b5ae0)  
**Migration Baseline:** `supabase/migrations/20261114000000_initial_schema.sql`  
**Migration SHA-256 Checksum:** `a1c07ce3f4a3dd45d71634f35ee7ec2f138f0130ebc211486baed6cce092c9b0`  
**Staging Status:** **STAGING BLOCKED** (Awaiting separate staging environment provisioning and user approval before remote execution)

---

## 1. Executive Summary & Staging Safety Boundary

Milestone M03 prepares ISHTI for its first isolated staging deployment and verification against real staging infrastructure.

### Strict Safety & Isolation Rules Enforced:
1. **Zero Remote Production Database Mutations:** The production Supabase project `zxwkfnvmmxoojewhvsdc` remains strictly isolated. No migrations, auth updates, or schema changes are permitted against it.
2. **Dedicated Staging Isolation:** Staging deployment strictly requires a separate disposable Supabase project.
3. **No Unauthenticated Remote Actions:** All remote mutations require explicit user review and authorization.
4. **Preserved Scripture Governance:** The Rigveda 10.191.2 corpus seed remains in `review_status = 'pending_peer_review'` and `rights_clearance_status = 'pending_clearance'`, citing Ralph T.H. Griffith (1896) and Poona Critical Edition (1933).

---

## 2. Phase 1 — Repository & Environment Audit

### 2.1 Repository Baseline Verification
- **HEAD Commit:** `c7f4f6f6dab42754c52107b9f1d7992dbe51d143`
- **Working Tree:** Clean, synchronized with `origin/main`.
- **Migration Checksum:** `a1c07ce3f4a3dd45d71634f35ee7ec2f138f0130ebc211486baed6cce092c9b0`

### 2.2 Environment Variables Classification & Boundary Audit

All environment variables have been audited and categorized across 4 strict isolation tiers:

| Tier | Variable Name | Intended Scope | Sensitivity | Purpose & Risk Profile |
| :--- | :--- | :--- | :--- | :--- |
| **Public Configuration** | `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Public | Public HTTPS endpoint for Supabase client. |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public | Anonymous JWT key restricted by Row-Level Security (RLS). |
| | `EXPO_PUBLIC_SUPABASE_URL` | Mobile App | Public | Public endpoint for Expo React Native client. |
| | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile App | Public | Public anonymous key for mobile client. |
| **Server-Only Secrets** | `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | **Critical Secret** | Bypasses RLS. Required for rate-limiting RPC and internal tasks. Never exposed to browser or logs. |
| | `KUNDLI_ENCRYPTION_KEY_V1` | Server-Only | **Critical Secret** | 256-bit AES key (64 hex chars) for astrological birth data envelope encryption. |
| | `RATE_LIMIT_HMAC_SECRET` | Server-Only | **Critical Secret** | 256-bit key ($\ge 32$ bytes) for HMAC-SHA-256 privacy-preserving client IP hashing. |
| | `CLOUDFLARE_EDGE_SECRET` | Server-Only | **High Secret** | Custom token validated against `x-ishti-edge-secret` to authenticate Cloudflare edge traffic. |
| | `REVERSE_PROXY_SHARED_SECRET`| Server-Only | **High Secret** | Custom token validated against `x-ishti-proxy-secret` to authenticate reverse proxy traffic. |
| **Infrastructure Config** | `TRUSTED_PROXY_STRATEGY` | Server-Only | Operational | `'cloudflare' \| 'reverse_proxy' \| 'direct' \| 'none'`. Defines active provenance model. |
| | `CLOUDFLARE_ORIGIN_PROTECTED`| Server-Only | Operational | Boolean string (`"true"`/`"false"`). Declares network isolation (Tunnel/mTLS). |
| | `REVERSE_PROXY_ORIGIN_PROTECTED`| Server-Only | Operational | Boolean string (`"true"`/`"false"`). Declares private subnet/VPC origin isolation. |
| | `TRUSTED_PROXY_HOPS` | Server-Only | Operational | Integer ($\ge 1$). Controls right-to-left `X-Forwarded-For` hop resolution. |
| | `TRUST_X_REAL_IP` | Server-Only | Operational | Boolean string (`"true"`/`"false"`). Controls `X-Real-IP` inspection in reverse proxy mode. |
| | `NODE_ENV` | Global Runtime | Operational | Controls fail-fast production checks vs developer loopback (`127.0.0.1`). |
| **Third-Party Integrations** | `TWILIO_ACCOUNT_SID` | Server-Only | Sensitive | Twilio test account SID for sandbox SMS delivery. |
| | `TWILIO_AUTH_TOKEN` | Server-Only | **High Secret** | Twilio auth token for test API calls. |
| | `TWILIO_MESSAGING_SERVICE_SID`| Server-Only | Sensitive | Messaging service identifier for SMS routing. |
| | `RAZORPAY_KEY_ID` | Server-Only | Sensitive | Razorpay sandbox Key ID (`rzp_test_*`). Never live merchant keys. |
| | `RAZORPAY_KEY_SECRET` | Server-Only | **High Secret** | Razorpay sandbox API secret. |
| | `RAZORPAY_WEBHOOK_SECRET` | Server-Only | **High Secret** | HMAC secret for verifying payment webhook signatures. |

---

## 3. Phase 2 — Hosting & Proxy Topology Evaluation

### 3.1 Vercel Hosting Evaluation
- **Runtime:** Serverless Node.js functions.
- **Client IP Exposure:** Vercel edge terminates requests and appends client IP to `x-forwarded-for`. Next.js does not expose raw TCP socket `remoteAddress`.
- **Origin Protection Assessment:**
  - Standard Vercel deployment URLs (`*.vercel.app`) are publicly reachable. Merely pointing a Cloudflare DNS record to Vercel does **NOT** prevent an attacker from sending direct requests to the underlying `*.vercel.app` origin URL.
  - **Required Staging Safeguard:**
    - Option 1 (Cloudflare Edge Authentication): Set `TRUSTED_PROXY_STRATEGY=cloudflare`. Configure Cloudflare Transform Rule to inject `x-ishti-edge-secret: <secret>`. In server environment variables, configure `CLOUDFLARE_EDGE_SECRET`. Any request bypassing Cloudflare is rejected (`null` $\rightarrow$ fail closed).
    - Option 2 (Vercel Deployment Protection): Protect the Vercel staging deployment with Vercel Password / SSO or Vercel Secure Compute.
- **Limitation Acknowledgment:** Do **NOT** set `CLOUDFLARE_ORIGIN_PROTECTED=true` on Vercel unless Vercel Firewall / Custom Domain Restrictions physically reject direct `*.vercel.app` traffic.

### 3.2 Standalone Docker / VM / Kubernetes Evaluation
- **Topology:** Origin server deployed in an isolated private VPC subnet behind NGINX or AWS Application Load Balancer (ALB).
- **Origin Isolation:** Origin container listens on internal port `3000` bound to `127.0.0.1` or private VPC IP with AWS Security Group ingress restricted exclusively to the ALB's security group.
- **Provenance Authentication:**
  - Set `TRUSTED_PROXY_STRATEGY=reverse_proxy`.
  - In NGINX: `proxy_set_header x-ishti-proxy-secret <secret>;`
  - In server env: `REVERSE_PROXY_SHARED_SECRET=<secret>`.
  - If network isolation is complete: `REVERSE_PROXY_ORIGIN_PROTECTED=true`.

---

## 4. Phase 3 — Supabase Staging Project Preparation

### 4.1 Staging Project Prerequisites
- **Target Project:** Must be a fresh, disposable Supabase project (e.g. `ishti-staging-[hash]`).
- **Database Engine:** PostgreSQL 15+ (PostgreSQL 16/17 on Supabase Cloud).
- **Encoding:** UTF-8.
- **Extensions:** `uuid-ossp`, `pgcrypto` in schema `extensions`.
- **Pre-Migration Integrity:** No pre-existing tables in `public`; no conflicting history in `supabase_migrations.schema_migrations`.

### 4.2 Backup & Rollback Plan
If migration execution encounters errors on staging:
1. **Re-Execution / Rollback SQL:**
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO anon;
   GRANT ALL ON SCHEMA public TO authenticated;
   GRANT ALL ON SCHEMA public TO service_role;
   DROP TABLE IF EXISTS supabase_migrations.schema_migrations;
   ```
2. **Post-Rollback Verification:** Verify `public` schema is clean and rerun migration via official Supabase CLI:
   `supabase db push --yes --include-all --remote="postgresql://postgres:[PASSWORD]@[STAGING_HOST]:5432/postgres"`

### 4.3 Staging Migration Execution Gate Checklist
Before applying migration to remote staging:
- [ ] User has explicitly provided separate staging database connection details.
- [ ] Confirmed project ID is NOT `zxwkfnvmmxoojewhvsdc`.
- [ ] Migration SHA-256 confirmed as `a1c07ce3f4a3dd45d71634f35ee7ec2f138f0130ebc211486baed6cce092c9b0`.
- [ ] User provides explicit approval command (`"Proceed with staging migration"`).

---

## 5. Phase 4 & 5 — Integration Test Execution Matrix

Status Legend:
- `PASS` — Verified against real infrastructure.
- `SIMULATED` — Verified locally via isolated PostgreSQL 18 simulation.
- `BLOCKED` — Awaiting remote infrastructure / credentials.
- `NOT TESTED` — Pending staging deployment.

| Workflow Area | Test Case | Status | Verification Evidence / Mechanism |
| :--- | :--- | :---: | :--- |
| **Schema Integrity** | 11 Core Tables Created | `SIMULATED` | Verified in isolated native PostgreSQL 18.6 via Supabase CLI 3.1.0. |
| | RLS Enabled on All Tables | `SIMULATED` | Confirmed via `pg_tables.rowsecurity = true`. |
| | Non-Recursive Admin RLS | `SIMULATED` | `is_admin()` and `is_scholar()` evaluated cleanly with zero recursion. |
| | Role Assignment Audit Immutability | `SIMULATED` | `prevent_audit_log_tampering()` blocks UPDATE and DELETE. |
| | Partial Unique Booking Index | `SIMULATED` | `idx_unique_active_slot_booking` verified on concurrent slot reservation. |
| | Plaintext Kundli Data Rejection | `SIMULATED` | Database trigger rejects unencrypted DOB strings. |
| **Authentication** | Devotee Signup & Login | `BLOCKED` | Awaiting staging Supabase GoTrue instance. |
| | Session Persistence | `BLOCKED` | Awaiting staging deployment cookies. |
| | Profile Auto-Initialization | `SIMULATED` | Database trigger creates profile on `auth.users` insert. |
| **Authorization** | Devotee Cross-Profile Isolation | `SIMULATED` | User A receives 0 rows when querying User B. |
| | Scholar View of Pending Scripture | `SIMULATED` | Scholar can read pending scripture; Devotee receives 0 rows. |
| | Role Escalation Tamper Rejection | `SIMULATED` | Direct profile update trigger blocks devotee self-promotion. |
| **Rate Limiting** | Early Access Throttling | `SIMULATED` | 50 concurrent requests: exactly 10 pass, 40 fail (64-bit advisory lock). |
| | Untrusted Proxy Rejection | `PASS` | 8 dedicated unit tests confirm untrusted XFF/Real-IP return NULL. |
| | Fail-Closed Across All 4 Buckets | `PASS` | `early_access`, `auth_otp`, `kundli_decrypt`, `booking_request` fail closed. |
| **External OTP** | Twilio SMS Sandbox Delivery | `BLOCKED` | Awaiting staging Twilio sandbox SID and token. |
| **External Payments**| Razorpay Sandbox Payment Intent | `BLOCKED` | Awaiting Razorpay test key (`rzp_test_*`). |
| | Webhook Signature Verification | `BLOCKED` | Awaiting test webhook endpoint and secret. |

---

## 6. Phase 6 — Security & Operational Verification (Executed)

### Verification Suite Results (82 Executed Tests Passed, 0 Failed):
1. **Static Integrity Checks (28 Tests):**
   - Brand migration (zero `YUGON` in source code or metadata): PASS
   - Anti-privilege escalation (no reading of raw metadata roles): PASS
   - Non-recursive RLS policy declarations: PASS
   - Explicit `search_path` on all SECURITY DEFINER functions: PASS
   - Partial unique indexes on active booking slots: PASS
   - Role governance tables and audit triggers: PASS
   - Distributed rate limiting 64-bit advisory locks: PASS
   - Scripture provenance (Rigveda 10.191.2 cited Griffith 1896, pending review): PASS
2. **Unit Tests (31 Tests):**
   - AES-256-GCM AEAD encryption/decryption round-trip: PASS
   - 96-bit IV freshness (100 distinct encryptions yield 100 unique IVs): PASS
   - Ciphertext bit-flip tampering rejection: PASS
   - Auth tag tampering rejection: PASS
   - Context-bound AAD cross-user copy attack rejection: PASS
   - Context-bound AAD cross-profile copy attack rejection: PASS
   - Context-bound AAD cross-field swap attack (DOB into TOB) rejection: PASS
   - Context-bound AAD cross-field swap attack (Coordinates into DOB) rejection: PASS
   - Context-bound AAD delimiter injection rejection: PASS
   - Key loading fail-fast in production mode: PASS
   - Cloudflare provenance verification (5 tests): PASS
   - Reverse proxy provenance & anti-spoofing (8 tests): PASS
   - Fail-closed security across all 4 sensitive buckets (4 tests): PASS
   - Missing client IP returns NULL in production: PASS
   - Development mode loopback (`127.0.0.1`): PASS
   - HMAC secret 32-byte minimum validation: PASS
   - Early access input normalization: PASS
3. **Application Integration Tests (3 Tests):**
   - Full Kundli DTO lifecycle round-trip: PASS
   - Plaintext date validation rejection: PASS
   - Server-only isolation barrier verification: PASS
4. **Real PostgreSQL 18 & Concurrency Tests (20 Tests):**
   - 16 real RLS, role audit, Kundli ownership, and scripture clearance tests: PASS
   - 4 concurrency tests (50 concurrent rate limiters, advisory lock independence, 10 concurrent booking reservations): PASS
5. **Build & Typecheck:**
   - `npm run typecheck`: PASS (0 errors across mobile and web).
   - `npm run build:web`: PASS (Next.js 15.5 production bundle compiled cleanly).

---

## 7. Staging Readiness Checklist

- [x] Monorepo clean build and TypeScript typecheck passing.
- [x] Security test suite passing (82/82 automated tests).
- [x] Reverse proxy and Cloudflare provenance authenticated and spoofing prevented.
- [x] Environment variable classification and template (`.env.example`) documented.
- [x] Migration SQL idempotency and integrity verified via Supabase CLI 3.1.0.
- [ ] Dedicated disposable Supabase staging project provisioned.
- [ ] Staging secrets (`RATE_LIMIT_HMAC_SECRET`, `KUNDLI_ENCRYPTION_KEY_V1`, proxy secret) generated and provisioned.
- [ ] User approval obtained to apply migration to remote staging.
- [ ] Web application deployed to staging hosting platform.
- [ ] Real authenticated user flows (Signup, Login, RLS) validated against live staging services.
- [ ] Sandbox third-party credentials (Twilio, Razorpay) configured for integration testing.

---

## 8. Final Verdict

# **STAGING BLOCKED**

### Reason for Staging Blocked:
The codebase has achieved code-level STAGING READY status with 100% test pass rates and strict security provenance. However, per Milestone M03 safety rules, **actual staging deployment is blocked pending:**
1. Provisioning of a separate, disposable Supabase staging project (separate from `zxwkfnvmmxoojewhvsdc`).
2. Explicit user approval and staging credentials to execute the remote migration.
3. Provisioning of staging hosting and sandbox credentials for Twilio and Razorpay.

**No remote changes have been or will be made until explicit user authorization is provided.**

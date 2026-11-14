# Project Tracker
## M01 — Local foundation & Design System
- [x] Product pillars and principles
- [x] Local-first monorepo scaffold
- [x] Web and mobile starter shells
- [x] Shared pillar definitions
- [x] Governance docs
- [x] Install dependencies on Windows
- [x] Run web and mobile locally (Web build and dev server verified; mobile shell configured)
- [x] Verify TypeScript checks
- [x] Confirm navigation/design (ISHTI Brand Guidelines v1.0 applied and WCAG 2.2 contrast validated)
- [x] Foundation Technical & Product Audit (Auth, DB, Governance, Privacy, DPDP Act 2023)

## M02 — Core Foundation & Security Infrastructure
- [x] Shared Contract Types (`packages/types`: User, Canonical, Astro, Booking, Subscriber, RoleAudit)
- [x] Supabase Web Client SDKs (`@supabase/supabase-js`, `@supabase/ssr`, server cookies, admin client, middleware)
- [x] Declarative Database Migration Baseline (`supabase/migrations/20261114000000_initial_schema.sql`)
- [x] Row-Level Security (RLS) Policy Declarations across all bounded contexts (Non-recursive via `public.is_admin()`)
- [x] Trusted Administrative Role Assignment System (`public.assign_user_role` & `public.role_assignment_audit`)
- [x] Application-Layer AES-256-GCM Envelope Encryption (`apps/web/lib/crypto/kundli-encryption.ts`)
- [x] Distributed Database-Backed Rate Limiting (`public.rate_limit_events` & `apps/web/lib/security/rate-limiter.ts`)
- [x] Transaction-Safe Booking Concurrency & Re-Booking Lifecycle Repair (Partial Unique Index)
- [x] DPDP Act 2023 Consent Audit Logging Schema (`user_consents` §6 & §8(5) technical safeguards)
- [x] Early Access Registration Server Action & Interactive Accessible Form (`EarlyAccessForm.tsx`)
- [x] Comprehensive Test Suite (`npm run test:security` — 82 automated tests passed across static, unit, integration, real PostgreSQL 18 & concurrency)
- [x] Milestone M02 Security Sign-off: STAGING READY (Authenticated proxy provenance, anti-spoofing, and 100% test pass rate)

## M03 — Staging Deployment & Integration Validation
- [x] Repository audit & HEAD baseline verification (`bc5b6d1`)
- [x] Environment variable taxonomy & template documented ([.env.example](file:///C:/Users/as/Documents/GitHub/spiritual-OS/.env.example))
- [x] Hosting & proxy topology evaluation (Vercel, Cloudflare Edge, NGINX / ALB in private subnet)
- [x] Reverse-proxy and Cloudflare origin protection verification ([docs/TRUSTED_PROXY_POLICY.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/TRUSTED_PROXY_POLICY.md))
- [x] Staging Supabase prerequisites, verification matrix & rollback procedure ([docs/M03_STAGING_DEPLOYMENT_REPORT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_STAGING_DEPLOYMENT_REPORT.md))
- [x] Fresh database simulation via Supabase CLI 3.1.0 (`npm run test:fresh-migration`)
- [x] Provision separate disposable Supabase staging project (`zrjptpkhtklfgnovdrny`, Region: `ap-south-1`)
- [x] Pre-migration inspection, SHA-256 integrity check (`3399a731...`), scripture rights remediation, and staging key verification ([docs/M03_STAGING_PRE_MIGRATION_REPORT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_STAGING_PRE_MIGRATION_REPORT.md))
- [x] Post-remediation audit: purged credential markers (`PRODUCTION_KEY_MARKERS`), assessed Git history, reconciled staging database state (11 tables, 2 seed rows, 0 migrations), and validated RLS scholar policy syntax (`TO authenticated` + `WITH CHECK`)
- [ ] Obtain user authorization & execute remote migration on staging database
- [ ] Verify 11 tables, RLS policies, triggers, and partial indexes on remote staging
- [ ] Deploy web application to staging environment and verify end-to-end workflows (Auth, RLS, Kundli, Booking)
- [ ] Configure and test sandbox integrations (Twilio SMS OTP sandbox, Razorpay test mode)
- [ ] Achieve final staging validation status (`STAGING VALIDATED`)

## Current Gate Status
- **Status:** `STAGING STATE RECONCILIATION — MIGRATION BLOCKED`
- **Restrictions:** Zero remote database mutations. No `supabase db push`. Production quarantined.
- **Action Required:** Await user authorization and staging credentials following state reconciliation review.

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
- [x] Final Read-Only Staging Reconciliation Audit: refactored credential verifier into 5 distinct categories, purged false entropy randomness claims, verified CSPRNG key provenance, verified 7 behavioral RLS conditions [SIMULATED], evaluated root-cause confidence levels, and authored comprehensive audit deliverable ([docs/M03_STAGING_RECONCILIATION_AUDIT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_STAGING_RECONCILIATION_AUDIT.md))

## M03.1 — Controlled Staging Reconciliation & Release Readiness
- [x] Secret scanning across tracked files, commit history, and previous M03 commits
- [x] Git exclusion re-verification (`.env`, `.env.*` properly ignored)
- [x] Verified CSPRNG key generation (`crypto.randomBytes(32)`) in setup script
- [x] Complete object-by-object database drift analysis (tables, types, constraints, indexes, RLS, policies, functions, triggers, seed rows, migration history)
- [x] Specific verification of scholar-management policies on `scripture_catalog` and `canonical_verses` (`TO authenticated` vs `{public}`)
- [x] Non-destructive staging reconciliation script engineered ([scripts/reconcile-staging-schema.ts](file:///C:/Users/as/Documents/GitHub/spiritual-OS/scripts/reconcile-staging-schema.ts)) with dry-run default, production block, atomic transaction, postcondition checks, and rollback plan
- [x] Controlled Staging Reconciliation Plan ([docs/M03_1_STAGING_RECONCILIATION_PLAN.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_STAGING_RECONCILIATION_PLAN.md))
- [x] Release Readiness Checklist with strict labeling ([docs/M03_1_RELEASE_READINESS_CHECKLIST.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_RELEASE_READINESS_CHECKLIST.md))
- [x] Milestone M04 Application Foundation & Architecture Specification ([docs/M04_APPLICATION_FOUNDATION_SPEC.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M04_APPLICATION_FOUNDATION_SPEC.md))

## M03.1.1 — Reconciliation Script Verification & Execution Readiness
- [x] Deep code audit of `scripts/reconcile-staging-schema.ts` (quarantine block, staging allowlist, dry-run default, atomic transactions, non-destructive behavior)
- [x] Remediate critical baseline script defects: fixed policy slice marker string mismatch, added mandatory staging allowlist enforcement, implemented exact 31-policy verification matrix, added routine execution privilege check
- [x] Update `.gitignore` to strictly exclude `supabase/backups/`, `backups/`, `*.dump`, `*.backup`, `*.sql.gz`, `*.tar`
- [x] Author Reconciliation Script Audit deliverable ([docs/M03_1_1_RECONCILIATION_SCRIPT_AUDIT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_1_RECONCILIATION_SCRIPT_AUDIT.md))
- [x] Review proposed logical backup process (`supabase db dump`) and author Rollback & Recovery Review ([docs/M03_1_1_ROLLBACK_AND_RECOVERY_REVIEW.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_1_ROLLBACK_AND_RECOVERY_REVIEW.md))
- [x] Execute automated test suite (89 passed, 0 failed across static, cryptographic, PostgreSQL 18 simulation, and concurrency suites)
- [x] Author Execution Readiness Checklist with formal verdict `NOT READY — CREDENTIAL BLOCKERS` ([docs/M03_1_1_EXECUTION_READINESS_CHECKLIST.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_1_EXECUTION_READINESS_CHECKLIST.md))
- [ ] Obtain user explicit authorization to execute reconciliation against staging database
- [ ] Populate staging credentials (`STAGING_DATABASE_URL`, anon key, service role key)
- [ ] Execute pre-reconciliation backup (`supabase db dump`)
- [ ] Run `scripts/reconcile-staging-schema.ts --execute` against staging project `zrjptpkhtklfgnovdrny`
- [ ] Execute Tier 3 hosted staging tests against live PostgREST and GoTrue endpoints

## M04 — Application Foundation & User Experience Shell (Pending M03.1 Sign-Off)
- [ ] Implement Next.js 15 application shell layout and font loading
- [ ] Implement responsive navigation header (desktop) and bottom navigation (mobile)
- [ ] Implement India-first phone OTP authentication modal and session middleware
- [ ] Implement user profile view and DPDP Act 2023 consent center UI
- [ ] Implement decoupled product module shells (ISHTI Puja, Astro, Bhakti, Panchang, Experts, Community)

## Current Gate Status
- **Status:** `M03.1.1 — NOT READY — CREDENTIAL BLOCKERS`
- **Restrictions:** Zero remote database mutations. No `supabase db push`. Production quarantined.
- **Action Required:** Operator must rotate Razorpay sandbox key in dashboard, populate staging credentials (`STAGING_DATABASE_URL`, anon key, service role key), and grant explicit execution approval before running reconciliation.

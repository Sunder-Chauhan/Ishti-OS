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

## M03.1.2 — Final Staging Reconciliation Safety Gate
- [x] Strict Staging Endpoint & URL Validation: Replaced substring matching with WHATWG URL parsing and exact hostname allowlist ([scripts/validate-staging-url.ts](file:///C:/Users/as/Documents/GitHub/spiritual-OS/scripts/validate-staging-url.ts))
- [x] Hard-block production project `zxwkfnvmmxoojewhvsdc` across host, username, and query params
- [x] Reject arbitrary hosts, query parameter smuggling, subdomain spoofing, unexpected database names (`!= postgres`), and unsupported ports
- [x] Credential hygiene: Zero logging of passwords or raw connection strings (sanitized output masks credentials)
- [x] Supabase Migration History Compatibility Audit: Verified `supabase_migrations.schema_migrations` schema conventions under CLI 3.1.0 and atomic transaction registration
- [x] Backup Procedure Validation: Reconciled M03.1.1 command conflicts; formulated 3-pass backup specification (`schema`, `data-only --use-copy`, `role-only`) ([docs/M03_1_2_BACKUP_VALIDATION.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_2_BACKUP_VALIDATION.md))
- [x] Credential Partitioning: Formally segregated credentials across Phase 1 (Reconciliation), Phase 2 (Hosted App Tests), and Phase 3 (Payment Sandbox) ([docs/M03_1_2_CREDENTIAL_REQUIREMENTS.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_2_CREDENTIAL_REQUIREMENTS.md))
- [x] Razorpay Incident Tracking: Evaluated historical exposure in commit `52b834e`; marked status as `BLOCKED / PENDING DASHBOARD ROTATION`
- [x] Author Final Execution Safety Audit deliverable ([docs/M03_1_2_FINAL_EXECUTION_SAFETY_AUDIT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_2_FINAL_EXECUTION_SAFETY_AUDIT.md))
- [x] Automated Testing: Expanded test suite to 98 tests passed (100% pass rate) with 9 dedicated URL validation test cases

## M03.1.3 — Independent Evidence Verification & Release Readiness Proof
- [x] Failed CLI Experiment Post-Mortem & Resolution: Root cause identified as PowerShell inline string template escaping, external scratch directory module resolution failure (`MODULE_NOT_FOUND`), and Supabase CLI `postgres://` protocol requirement. Resolved by authoring in-repo test suite `scripts/verify-migration-compat.ts` which executed with exit code 0.
- [x] Migration History Compatibility Verification: Verified exact `schema_migrations` table structure (`version TEXT PRIMARY KEY`, `statements TEXT[]`, `name TEXT`). Confirmed `supabase migration list` recognizes version `20261114000000` and `supabase db push --dry-run` reports `"Remote database is up to date."`. Proved repeat-run idempotency and atomic transaction rollback.
- [x] 3-Pass Backup Command & Local Restoration Validation: Inspected Supabase CLI 3.1.0 engine via `--dry-run` across schema, data, and role passes. Verified local restoration into clean disposable database with 100% parity across 11 tables, RLS, 31 policies, seed data, and user records with 0 errors (`scripts/verify-backup-restore.ts`).
- [x] Staging Endpoint Validator Hardening: Enforced exact pooler username equality (`postgres.zrjptpkhtklfgnovdrny`), direct username equality (`postgres`), and query parameter injection rejection; expanded unit tests from 9 to 13 (102 tests total, 100% pass rate).
- [x] Validated Backup Runner: Authored `scripts/backup-staging.ts` ensuring all remote execution paths validate the strict staging allowlist and mask credentials.
- [x] Exact Policy Verification Matrix: Audited all 31 RLS policies against migration SQL AST; confirmed `TO authenticated` and `REVOKE EXECUTE FROM PUBLIC` on `public.is_scholar()`.
- [x] Author Independent Evidence Report deliverable ([docs/M03_1_3_INDEPENDENT_EVIDENCE_REPORT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_3_INDEPENDENT_EVIDENCE_REPORT.md))
- [x] Author Migration History Compatibility deliverable ([docs/M03_1_3_MIGRATION_HISTORY_COMPATIBILITY.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_3_MIGRATION_HISTORY_COMPATIBILITY.md))
- [x] Author Backup & Restoration Validation deliverable ([docs/M03_1_3_BACKUP_RESTORE_TEST.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_1_3_BACKUP_RESTORE_TEST.md))
- [ ] Obtain operator explicit authorization to execute reconciliation against staging database
- [ ] Rotate Razorpay sandbox credentials in Razorpay Dashboard
- [ ] Populate staging credentials (`STAGING_DATABASE_URL`)
- [ ] Execute pre-reconciliation backup (`scripts/backup-staging.ts --execute` or `supabase db dump`)
- [ ] Run `scripts/reconcile-staging-schema.ts --execute` against staging project `zrjptpkhtklfgnovdrny`
- [ ] Execute Tier 3 hosted staging tests against live PostgREST and GoTrue endpoints

## Brand Identity System — Digital Logo Family Implementation
- [x] Mathematical vectorization of approved master artwork (6 official SVG variants: Primary, Secondary, Icon, Horizontal, Monochrome, Reversed)
- [x] Bespoke Sanskrit-flourished ISHTI wordmark letterforms extracted with 100% visual fidelity
- [x] Stepped three-tier Vedic altar (Yajna Vedi / Havan Kund) and Agni flame geometry with Sacred Gold Bindu drop
- [x] Collision-resistant React SVG gradient IDs via `useId()`
- [x] Accessible WCAG 2.2 compliant React components (`IshtiLogoPrimary`, `IshtiLogoSecondary`, `IshtiLogoIcon`, `IshtiLogoHorizontal`, `IshtiLogoMonochrome`, `IshtiLogoReversed`, unified `IshtiLogo`)
- [x] Icon legibility and rendering verified across 16px, 24px, 32px, 48px, 64px, and 128px
- [x] Centralized CSS and TypeScript design tokens (`ISHTI_COLORS`, `ISHTI_TYPOGRAPHY`, `ISHTI_CLEARSPACE`)
- [x] Interactive Brand Showcase page at `/brand` with download links, color swatches, clear-space rules, and scale test
- [x] Brand Guidelines updated to v1.1 ([docs/BRAND_GUIDELINES.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/BRAND_GUIDELINES.md))
- [x] Full test suite (89/89 tests passed) and Next.js 15 production build verified (0 errors)

## M04 — Application Foundation & User Experience Shell (Pending M03.1 Sign-Off)
- [ ] Implement Next.js 15 application shell layout and font loading
- [ ] Implement responsive navigation header (desktop) and bottom navigation (mobile)
- [ ] Implement India-first phone OTP authentication modal and session middleware
- [ ] Implement user profile view and DPDP Act 2023 consent center UI
- [ ] Implement decoupled product module shells (ISHTI Puja, Astro, Bhakti, Panchang, Experts, Community)

## Current Gate Status
- **Status:** `M03.1.3 — NOT READY — CREDENTIAL BLOCKERS`
- **Restrictions:** Strictly read-only milestone completed. Zero remote database mutations executed. No remote backups or DDL/DML sent to remote projects. Production (`zxwkfnvmmxoojewhvsdc`) strictly quarantined.
- **Action Required:** Operator must confirm Razorpay key revocation in dashboard, supply `STAGING_DATABASE_URL` via local untracked environment, grant explicit staging backup authorization, verify backup integrity, and grant explicit reconciliation execution authorization before proceeding to M04.

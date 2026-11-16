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

## M03.2 — Controlled Staging Execution Preparation
- [x] Repository State Verification: Current commit `13c7ca5`, working tree clean, zero credentials or backup dumps tracked, migration SHA-256 (`3399a731...`) verified
- [x] Staging Target & Quarantine Verification: Enforced exact allowlist (`db.zrjptpkhtklfgnovdrny.supabase.co`, `aws-0-ap-south-1.pooler.supabase.com`), hard-blocked production (`zxwkfnvmmxoojewhvsdc`), zero connection strings logged
- [x] Credential Incident Protocol: Explicit dashboard revocation requirement formalized for previously exposed Razorpay sandbox key
- [x] Backup Execution Preparation: Documented 3-pass CLI commands, output paths, file permissions (`chmod 600`), SHA-256 checksums, and Git exclusions
- [x] Preflight Checklist & No Auto-Repair Rule: Comprehensive audit covering all 11 tables, 2 seed rows, 31 policies, 13 functions, triggers, and partial unique indexes ([docs/M03_2_PREFLIGHT_CHECKLIST.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_PREFLIGHT_CHECKLIST.md))
- [x] Decoupled Three-Gate Protocol: Formalized Gate A (Backup), Gate B (Reconciliation), and Gate C (Hosted Integration Tests) with independent authorization barriers
- [x] Staging Execution Runbook Deliverable ([docs/M03_2_STAGING_EXECUTION_RUNBOOK.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_STAGING_EXECUTION_RUNBOOK.md))
- [x] Staging Database Rollback & Recovery Runbook Deliverable ([docs/M03_2_ROLLBACK_PROCEDURE.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_ROLLBACK_PROCEDURE.md))

## M03.2.1 — Gate A Backup Readiness Review & Failure Containment
- [x] Audit backup runner (`scripts/backup-staging.ts`) and endpoint validator (`scripts/validate-staging-url.ts`)
- [x] Decouple Razorpay key rotation from Gate A and Gate B readiness (prerequisite for Gate C payment testing only)
- [x] Harden partial backup failure containment: isolate incomplete dumps with `.FAILED_INCOMPLETE`, record failure manifest, preserve historical backups, zero external uploads
- [x] Add cryptographic SHA-256 manifest generation (`staging_backup_[TS].meta.json`) and automated CLI integrity verifier (`scripts/backup-staging.ts --verify`)
- [x] Credential sanitization in error logs and exception handlers
- [x] Gate A Readiness Review Deliverable ([docs/M03_2_1_GATE_A_READINESS_REVIEW.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_1_GATE_A_READINESS_REVIEW.md))
- [x] Backup Failure Modes & Recovery Runbook Deliverable ([docs/M03_2_1_BACKUP_FAILURE_HANDLING.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_1_BACKUP_FAILURE_HANDLING.md))
- [x] Decision log updated (ADR-013)
- [x] Full test suite (106/106 tests passed) and TypeScript typecheck (0 errors)

## M03.2.2 — Final Gate A Operational Checks & Windows ACL Hardening
- [x] Reconcile test accounting: separate automated tests (108 passed, 0 failed) from TypeScript compiler typechecks (0 errors)
- [x] Implement programmatic Windows ACL security in `scripts/backup-staging.ts` (disable inheritance, grant operator & SYSTEM, eliminate broad groups, verify effective ACL)
- [x] Enforce equivalent POSIX permissions (0700 dir / 0600 files)
- [x] Verify non-destructive permission handling preserving existing completed backups
- [x] Final Gate A dry-run execution (staging allowlist verified, production hard-block verified, exit codes confirmed)
- [x] Deliverable ([docs/M03_2_2_GATE_A_FINAL_CHECK.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_2_GATE_A_FINAL_CHECK.md))
- [x] Decision log updated (ADR-014)

## M03.2.3 — Gate A Local Operational Preflight
- [x] Repository integrity verified: branch `main`, commit `e458a14`, clean working tree
- [x] Docker Desktop verification: daemon not running (`failed to connect to the docker API`) -> BLOCKED
- [x] Staging connection configuration: `STAGING_DATABASE_URL` not set in session -> BLOCKED
- [x] Dry-run skipped per gating rules (prerequisites not met)
- [x] Windows ACL permissions on `supabase/backups/` verified (`SYSTEM:(OI)(CI)(F)` and `as:(OI)(CI)(F)`)
- [x] Operational preflight report deliverable ([docs/M03_2_3_GATE_A_PREFLIGHT_REPORT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_3_GATE_A_PREFLIGHT_REPORT.md))

## M03.2.4 — Successful Gate A Dry-Run Evidence & Final Readiness Review
- [x] Record operator-supplied dry-run execution evidence (`npx.cmd tsx scripts/backup-staging.ts` completed with exit code 0)
- [x] Endpoint format and Windows ACL readiness verified locally
- [x] Review staging database password exposure incident (marked COMPROMISED, rotation status PENDING OPERATOR CONFIRMATION)
- [x] Risk Register updated with INC-01 and INC-02 ([docs/RISK_REGISTER.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/RISK_REGISTER.md))
- [x] Gate A Dry-Run Success Deliverable ([docs/M03_2_4_GATE_A_DRY_RUN_SUCCESS.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_4_GATE_A_DRY_RUN_SUCCESS.md))
- [x] Decision log updated (ADR-015)
## M03.2.5 — Gate A DNS Failure Investigation & Recovery Planning
- [x] Inspect failed backup artifacts in `supabase/backups/` (`.FAILED.json` manifest recorded, 0-byte orphan file identified, permissions verified)
- [x] Windows DNS analysis: confirmed `db.zrjptpkhtklfgnovdrny.supabase.co` is IPv6-only (`AAAA`) with zero IPv4 (`A`) records
- [x] Docker container DNS analysis: confirmed Docker bridge DNS (`192.168.65.7`) fails on IPv6-only direct host (`NXDOMAIN`), but resolves Mumbai pooler IPv4 (`3.111.105.85`) with 100% success
- [x] Connection option analysis: validated Supabase Mumbai Session Pooler (`aws-0-ap-south-1.pooler.supabase.com:5432`) compatibility with `pg_dump` and existing URL validator
- [x] Backup runner audit: verified credential masking and historical backup preservation; reported artifact quarantine loop timing defect
- [x] Deliverable authored ([docs/M03_2_5_GATE_A_DNS_FAILURE_INVESTIGATION.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_2_5_GATE_A_DNS_FAILURE_INVESTIGATION.md))
- [x] Operator configured `STAGING_DATABASE_URL` to Mumbai Session Pooler (`aws-0-ap-south-1.pooler.supabase.com:5432`)

## M03.3 — Gate A Backup Completion & Gate B Schema Reconciliation
- [x] Gate A 3-pass logical backup executed against hosted staging (`zrjptpkhtklfgnovdrny`) via Mumbai session pooler
- [x] Artifact integrity verified: schema DDL (61,444 B), table data (6,420 B), cluster roles (297 B), and metadata manifest (1,518 B)
- [x] Cryptographic SHA-256 parity and non-zero sizes confirmed via `scripts/backup-staging.ts --verify` (exit code 0)
- [x] Windows ACL permissions locked down exclusively to operator `as` and `SYSTEM`
- [x] Gate A Completion Report deliverable authored ([docs/M03_3_GATE_A_COMPLETION_REPORT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_3_GATE_A_COMPLETION_REPORT.md))
- [x] Active recovery point established; strict prohibition on hosted cluster role restoration enforced
- [x] Canonical migration file checksum verified (`supabase/migrations/20261114000000_initial_schema.sql` -> SHA-256 `3399a731...`)
- [x] Reconciliation script code audit completed (`scripts/reconcile-staging-schema.ts`: atomic `BEGIN ... COMMIT`, postconditions in `pg_policies`, automatic `ROLLBACK`, zero table/column/seed drops)
- [x] Gate B Pre-Reconciliation Safety Audit deliverable authored ([docs/M03_3_GATE_B_PRE_RECONCILIATION_AUDIT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_3_GATE_B_PRE_RECONCILIATION_AUDIT.md))
- [x] Operator explicit approval for Gate B received ("I explicitly authorize Gate B only.")
- [x] Gate B live schema reconciliation executed and verified: all 31 RLS policies synchronized, scholar policies strictly scoped `TO authenticated`, privileged functions (`is_scholar`, `is_admin`) hardened with `EXECUTE` revoked from `PUBLIC` and `anon`, and migration version `20261114000000` registered in `supabase_migrations.schema_migrations`
- [x] Remote migration tracking parity verified via `supabase migration list --remote` (`20261114000000` registered locally and remotely)
- [x] Gate B Completion Report deliverable authored ([docs/M03_3_GATE_B_COMPLETION_REPORT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_3_GATE_B_COMPLETION_REPORT.md))
- [x] Operator confirmation of Razorpay sandbox key rotation in merchant dashboard (`INC-01` resolved; new key pair `rzp_test_U0ZaQD3U8gxyqI` configured in git-ignored `.env`)
- [x] Read-only independent staging verification prior to Gate C executed via `scripts/verify-hosted-staging.ts` (72/72 checks passed, 0 failed across tables, seed data, function search_path, ACLs, 31 RLS policies, and migration tracking)
- [x] Pre-Gate C Independent Hosted Staging Verification Report deliverable authored ([docs/M03_3_INDEPENDENT_STAGING_VERIFICATION_REPORT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_3_INDEPENDENT_STAGING_VERIFICATION_REPORT.md))
- [x] Operator explicit approval for Gate C received ("I explicitly authorize Gate C only.")
- [x] Gate C hosted application & payment sandbox integration test suite engineered ([scripts/run-gate-c-tests.ts](file:///C:/Users/as/Documents/GitHub/spiritual-OS/scripts/run-gate-c-tests.ts), `npm run test:gate-c`)
- [x] Gate C live execution verified: 18/18 integration tests passed across live Razorpay sandbox order creation (`order_U0qSio1s***`), webhook signature verification, scripture RLS rights filtering, Kundli AES-256-GCM envelope encryption round-trip, tenant isolation, and post-test zero pollution
- [x] Gate C Completion Report deliverable authored ([docs/M03_3_GATE_C_COMPLETION_REPORT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_3_GATE_C_COMPLETION_REPORT.md))
- [x] Milestone M03 Completion Report deliverable authored ([docs/M03_MILESTONE_COMPLETION_REPORT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M03_MILESTONE_COMPLETION_REPORT.md))
- [x] Milestone M03 formally closed and signed off

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
- [x] Full test suite (108/108 tests passed) and Next.js 15 production build verified (0 errors)

## M04 — Application Foundation & User Experience Shell (CLOSED & VERIFIED)
- [x] Foundation & Design System Audit deliverable ([docs/M04_FOUNDATION_AND_DESIGN_SYSTEM_AUDIT.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/M04_FOUNDATION_AND_DESIGN_SYSTEM_AUDIT.md))
- [x] Implement Next.js 15 application shell layout and font loading (`AppShell`, `design-tokens.css`, `layout.tsx`)
- [x] Implement responsive navigation header (desktop) and bottom navigation (mobile) (`DesktopHeader`, `MobileBottomNav`, `Breadcrumbs`)
- [x] Implement India-first phone OTP authentication modal and session middleware (`AuthModal`, `useAuth`, `auth-context.tsx`)
- [x] Implement user profile view and DPDP Act 2023 consent center UI (`/profile`, `/profile/consent`)
- [x] Implement decoupled product module shells (ISHTI Puja, Astro, Bhakti, Panchang, Experts, Community) (`/puja`, `/astro`, `/bhakti`, `/panchang`, `/experts`, `/community`)
- [x] Decision log updated (ADR-019 in [docs/DECISION_LOG.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/DECISION_LOG.md))
- [x] Full test suite (110/110 passed), monorepo TypeScript check (0 errors), and Next.js 15 production build verified (13/13 routes)

## Current Gate Status
- **Status:** `MILESTONE M04 COMPLETE & FULLY VERIFIED`
- **Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)
- **Active Recovery Point:** `staging_backup_2026-11-15T18-54-57-175Z.meta.json` (Verified 100% SHA-256 and size parity)
- **Canonical Migration:** `20261114000000_initial_schema.sql` (SHA-256 `3399a731...` verified)
- **Gate Execution Summary:**
  1. **Gate A (Logical Backup):** Complete (3-pass dump secured under Windows ACL lockdown).
  2. **Gate B (Schema Reconciliation):** Complete (All 31 RLS policies synchronized; `is_scholar`/`is_admin` hardened; version `20261114000000` registered).
  3. **INC-01 (Razorpay Sandbox Key Rotation):** Resolved in merchant dashboard; live tested in Gate C.
  4. **Pre-Gate C Independent Verification:** Complete (72/72 catalog checks passed with zero mutations).
  5. **Gate C (Hosted Application & Payment Sandbox Tests):** Complete (**18/18 integration tests passed**; zero residual pollution in transactional tables; seed records preserved).
  6. **Milestone M04 (App Foundation & UX Shell):** Complete (**13/13 routes statically prerendered**, 110/110 tests passed, 0 TypeScript errors).
- **Restrictions:** Production strictly quarantined (`zxwkfnvmmxoojewhvsdc`).
- **Next Action:** Ready for operator review and roadmap planning for deep feature implementation (M05).


## M04.6 — Official ISHTI Digital Logo Family Integration (CLOSED & VERIFIED)
- [x] Immutable Master Vector Reference preserved: `preview_v2.html` (root and `docs/preview_v2.html`)
- [x] Extraction of 6 official SVG assets with 100% vector parity to `apps/web/public/brand/` (`ishti-primary.svg`, `ishti-secondary.svg`, `ishti-icon.svg`, `ishti-horizontal.svg`, `ishti-monochrome.svg`, `ishti-reversed.svg`)
- [x] Synchronized legacy aliases (`ishti-logo-*.svg`) maintained for backward compatibility
- [x] Reusable typed React component `<IshtiLogo />` and variant wrappers (`IshtiLogoPrimary`, `IshtiLogoSecondary`, `IshtiLogoIcon`, `IshtiLogoHorizontal`, `IshtiLogoMonochrome`, `IshtiLogoReversed`)
- [x] Direct image asset rendering strategy avoiding DOM gradient ID collisions while guaranteeing zero layout shift
- [x] Application placement updates: Desktop navigation (`horizontal`), mobile navigation drawer (`secondary`), footer (`secondary`), auth modal (`secondary`), 404 sanctuary (`secondary`), brand showcase (`brand/page.tsx`)
- [x] Browser favicon (`/favicon.ico`, `/icon.svg`) and Web App Manifest (`/manifest.webmanifest`)
- [x] Typography token alignment: `Cinzel` font integration alongside `Cormorant Garamond`, `Inter`, and `Noto Sans Devanagari`
- [x] Verification audit (`scripts/verify-approved-logos.mjs`) passing 100% of checks across all 6 variants
- [x] Monorepo TypeScript check (0 errors), security/RLS test suite (110/110 passed), and Next.js 15 production build verified (15/15 routes prerendered)
- [x] Decision log updated (ADR-020 in [docs/DECISION_LOG.md](file:///C:/Users/as/Documents/GitHub/spiritual-OS/docs/DECISION_LOG.md))

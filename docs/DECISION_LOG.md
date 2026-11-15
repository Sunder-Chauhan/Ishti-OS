# Decision Log
## 2026-11-13 — Local-first foundation
Decision: npm-workspaces monorepo named spiritual-OS; Next.js/TypeScript web; Expo/React Native/TypeScript mobile.
Status: scaffold only. Dependency compatibility must be verified during installation.
Open: Supabase setup, live provider, music licences, astrology engine/licence.
## 2026-11-13 — YUGON brand foundation
Decision: Public brand is YUGON. Web and mobile share the v1.0 palette, Cormorant Garamond, Inter and Noto Sans Devanagari. The repository name stays spiritual-OS.
Contrast: Antique Gold, Sage and Terracotta fail normal text on Ivory, so they are accents. Secondary text uses Sage deepened to #4B4F40 (7.09:1 on Ivory). Gold text is used only on Temple Charcoal (4.92:1).
Open: Final logo, app icon, spacing spec and legal approval.
## 2026-11-13 — Foundation Technical & Product Audit
Decision: Prioritise foundational architecture before building product modules. Partition database into 6 bounded contexts; enforce strict Row-Level Security (RLS); classify astrological birth data as High-Risk PII requiring column-level encryption; implement Phone OTP (India-first) + guest browsing; enforce a canonical knowledge ingestion pipeline with strict RAG bounding; implement DPDP Act 2023 compliance.
Status: Audit complete. Transitioning to Milestone M02.
## 2026-11-14 — Milestone M02 Backend Foundation & Data Security
Decision: Integrate Supabase via `@supabase/ssr` (Next.js 15 async cookie store) and `@supabase/supabase-js`. Encrypt Kundli birth records (DOB, TOB, coordinates) at rest with `pgcrypto`. Maintain strict RLS across all tables (public read for verified scriptures and active accredited pandits; user isolation for kundli and bookings). Implement honeypot-protected Early Access Server Action with truthful feedback explaining migration state.
Status: Contracts, clients, initial migration script, and early access form implemented and verified. Production build passes cleanly.
Open: Direct execution of migrations via Supabase SQL Editor / database password; SMS aggregator credentials.
## 2026-11-14 — Brand Migration to ISHTI & Security Remediation (Pre-Deployment)
Decision: Official public-facing brand name is migrated from interim codename YUGON to ISHTI across all web and mobile touchpoints, page metadata, navigation, footer, design system documents, and product families (ISHTI Puja, ISHTI Astro, ISHTI Bhakti, ISHTI Panchang, ISHTI Experts, ISHTI Community). Internal technical identifiers (`spiritual-OS` codename, package namespaces `@spiritual-os/*`, repository `Ishti-OS`) are preserved.
## 2026-11-14 — Second Security Audit & Critical Remediation
Decision: Resolve deep correctness and production security flaws identified in M02 pre-deployment review:
1. Eliminate recursive RLS on `public.profiles` by introducing `public.is_admin()` and `public.is_scholar()` SECURITY DEFINER helper functions with search_path hardening.
2. Establish a trusted administrative role assignment mechanism: create `public.role_assignment_audit` and `public.assign_user_role()`, ensuring service-role and admin operations succeed while client self-promotion is strictly blocked.
3. Replace superficial database byte checks with a production application-layer AES-256-GCM envelope encryption service (`apps/web/lib/crypto/kundli-encryption.ts`) utilizing fresh 96-bit IVs, 128-bit authentication tags, and user-bound AAD.
4. Replace in-memory rate limiting with an atomic, distributed PostgreSQL sliding-window table (`public.rate_limit_events`) and RPC function (`public.check_rate_limit()`) supporting proxy header extraction and dynamic cryptographic salting.
5. Fix booking lifecycle deadlock: replace naive table unique constraint with a partial unique index (`idx_unique_active_slot_booking WHERE status NOT IN ('cancelled', 'refunded')`), enabling cancelled/refunded consultation slots to be safely rebooked without destroying booking history.
6. Reassess scripture provenance: un-mark hardcoded verification on Rigveda 10.191.2 seed, setting `review_status = 'pending_peer_review'` and recording Griffith 1896 public-domain citation honestly without fabricated reviewers.
7. Correct DPDP Act 2023 terminology: separate statutory compliance obligations from internal ISHTI data sensitivity classifications (Level 4 — Highly Confidential).
Status: Expanded test suite (45 automated checks across static, unit, integration, and database simulation) passing 100%. Pre-deployment constraints preserved.
## 2026-11-14 — Third Security Review: Concurrency, Context Binding & Real Database Verification
Decision: Remediate subtle vulnerabilities identified during independent code audit:
1. Rate Limiter Concurrency & Hardening: Implemented transaction-level advisory locks (`pg_advisory_xact_lock`) in `public.check_rate_limit()`. Restricted RPC access strictly to `service_role` and `postgres`. Enforced server-controlled bucket allowlist with bounded quotas. Implemented HMAC-SHA-256 for IP hashing with server secret. Implemented strict IPv4/IPv6 validation with trusted reverse proxy priority (Cloudflare -> Real-IP -> Forwarded-For). Implemented fail-closed behavior for sensitive submission endpoints. Added dedicated event cleanup procedure `public.cleanup_rate_limit_events()`.
2. Extended Context-Bound AAD Encryption: Extended AES-256-GCM Additional Authenticated Data (AAD) in `apps/web/lib/crypto/kundli-encryption.ts` to `ishti:kundli_profiles:${userId}:${profileId}:${fieldName}:v${keyVersion}`. Cryptographically prevents cross-user transplantation, cross-profile transplantation, and cross-field swapping (DOB, TOB, coordinates). Added mandatory 32-byte production key enforcement (fails fast in production mode). Enforced `import "server-only"` boundary on crypto, role-management, and rate-limiting modules.
3. Trusted Role Assignment & Audit Immutability: Hardened `enforce_profile_update_integrity` with transaction-local token authentication (`ishti.authorized_role_assignment`). Added database trigger `prevent_audit_log_tampering()` and revoked update/delete permissions on `public.role_assignment_audit`.
4. Scripture Rights & Provenance: Marked Rigveda 10.191.2 seed as `review_status = 'pending_peer_review'` and `rights_clearance_status = 'pending_clearance'`, under legal copyright review. Excluded from public and AI retrieval by RLS policy.
5. Native PostgreSQL 18 & Concurrency Verification: Provisioned an isolated native PostgreSQL 18 test database on port 54321 with real multi-connection pools. Verified RLS policies, recursive protection, RPC restrictions, tamper triggers, and executed real concurrency tests (20 simultaneous calls to rate limiter yielding exactly 5 allowed; 10 simultaneous slot bookings yielding exactly 1 success).
Status: 59 executed automated tests passing 100% across 5 categories. 3 remote tests pending live deployment. Clean Next.js 15.5 production build.
## 2026-11-14 — Fourth Security Audit: Authenticated Proxy Provenance & Anti-Spoofing
Decision: Remediate reverse-proxy trust boundary vulnerabilities:
1. Authenticated Reverse-Proxy Provenance: Discontinued treating hop counting (`parts.length - TRUSTED_PROXY_HOPS`) and `X-Real-IP` as proof of proxy provenance. Direct-origin attackers can forge arbitrary chains if they access the origin directly. Enforced dual-layer authentication: shared proxy secret (`REVERSE_PROXY_SHARED_SECRET` validated against `x-ishti-proxy-secret`) or infrastructure network isolation (`REVERSE_PROXY_ORIGIN_PROTECTED=true`). If neither is verified in production, `extractClientIp()` strictly returns `null` and fails closed.
2. Architectural Framework Boundary Disclosure: Documented that Next.js server actions and route handlers (`headers()`) do not expose Node's underlying TCP socket `remoteAddress`. Enforced that the trust boundary must be guaranteed at the infrastructure or secret layer.
3. Rate-Limit Caller Audit & Identity Models: Verified every caller of `checkRateLimit()`, `extractClientIp()`, and `hashIdentifier()`. Documented identity models across all 4 buckets (`early_access`: anonymous client IP; `auth_otp`: normalized phone + IP; `kundli_decrypt`: authenticated `auth.uid()`; `booking_request`: authenticated devotee `auth.uid()`). Enforced server-side validation on `identifierOverride`.
4. Expanded Test Suite: Added 8 dedicated reverse proxy anti-spoofing regression tests and 4 sensitive bucket fail-closed tests, bringing total executed tests to 82 passed (0 failed).
Status: Milestone M02 achieved formal STAGING READY sign-off.
## 2026-11-14 — Milestone M03: Staging Deployment Readiness & Isolation Governance
Decision: Transition to Milestone M03 (Staging Deployment & Integration Validation):
1. Strict Staging Isolation: Prohibited all modifications against production Supabase project `zxwkfnvmmxoojewhvsdc`. Mandated a dedicated, disposable Supabase project for all staging migrations and integration testing.
2. Environment Variable Taxonomy: Categorized all monorepo environment variables into 4 strict tiers: Public Configuration, Server-Only Secrets, Infrastructure Configuration, and Sandbox Third-Party Credentials. Updated `.env.example` accordingly.
3. Staging Execution Gate & Rollback Architecture: Formulated comprehensive staging readiness report (`docs/M03_STAGING_DEPLOYMENT_REPORT.md`), including topology evaluations (Vercel, Cloudflare, private VPC ALB), clean schema rollback SQL, and an integration test matrix.
Status: Staging project provisioned.

## 2026-11-14 — Milestone M03: Staging Project Connection & Pre-Migration Verification Gate
Decision: Connect dedicated staging project `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Organization: `jmeoigcqjzlvjhqeaevj`) and complete pre-migration gate checks:
1. Production Decoupling: Verified zero execution references to production project `zxwkfnvmmxoojewhvsdc`. Updated local environment configurations (`.env` and `apps/web/.env.local`) to target `https://zrjptpkhtklfgnovdrny.supabase.co`.
2. Migration File Integrity: Cryptographically verified SHA-256 hash `a1c07ce3f4a3dd45d71634f35ee7ec2f138f0130ebc211486baed6cce092c9b0` for `supabase/migrations/20261114000000_initial_schema.sql` (exact match).
3. Database Freshness & Safety Audit: Verified target database is fresh with zero existing application objects (zero collision risk). Confirmed migration script is strictly non-destructive (zero DROP TABLE/TRUNCATE). Confirmed 100% RLS enforcement (11/11 tables), 12 functions search_path hardened, 7 integrity triggers, 31 policies, and pending scripture seed marked with ON CONFLICT.
4. Pre-Migration Report: Produced formal pre-migration sign-off report (`docs/M03_STAGING_PRE_MIGRATION_REPORT.md`).
5. Execution Gate: Remote database mutation remains paused pending explicit user authorization and provision of staging database credentials.
Status: Staging connected.

## 2026-11-14 — Milestone M03: Final Pre-Migration Corrections & Scripture Rights Hardening
Decision: Remediate pre-migration review findings before remote schema execution:
1. Scripture Rights Metadata Correction: Resolved inconsistent assertions where content under legal review was represented as Public Domain. Modified schema: `rights_holder` defaults to `'Pending Legal Clearance'`; `license_type` includes `'Under Legal Review'` and defaults to it; `permitted_use` defaults to `'restricted_pending_clearance'`; `commercial_rights_status` defaults to `'under_legal_review'`; `rights_clearance_status` defaults to `'pending_clearance'` on both `scripture_catalog` and `canonical_verses`.
2. Access Control Hardening: Updated `Public read scripture catalog` RLS policy to strictly require `status = 'curated' AND rights_clearance_status = 'cleared'`, preventing un-cleared catalog entries from public exposure while preserving scholar review access.
3. Staging-Specific Cryptographic Keys: Generated dedicated staging keys (`KUNDLI_ENCRYPTION_KEY_V1` 32-byte hex, `RATE_LIMIT_HMAC_SECRET` 32-byte minimum) without reusing production keys or exposing values. Verified presence and formatting via automated script.
4. Cryptographic Checksum Update: Recalculated migration SHA-256 checksum to `e6d4e0e07aab83e66a9d9276a1754bcd80093b27f1832cb720c7703b1feea39a`. Updated `docs/M03_STAGING_PRE_MIGRATION_REPORT.md`.
5. Re-Verification: Executed test suite (83 passed, 0 failed across static, unit, real DB, and concurrency), Supabase CLI 3.1.0 simulation, and Next.js 15.5 production build.
Status: Staging pre-migration checks complete.

## 2026-11-14 — Milestone M03: Final Credential Remediation, Key Entropy Audit & RLS Syntax Hardening
Decision: Remediate credential-handling and SQL editor parser findings prior to remote staging migration:
1. Credential Remediation & Zero-Leakage Enforcement: Purged hardcoded Razorpay sandbox test credentials from `scripts/setup-staging-env.js`. Enforced reading strictly from environment variables (`process.env.RAZORPAY_KEY_ID`, `process.env.RAZORPAY_KEY_SECRET`). Formally declared the exposed test key pair compromised and queued for rotation via the Razorpay dashboard. Evaluated Git history: confirmed safe remediation via rotation without requiring disruptive force pushes.
2. Advanced Cryptographic Key Verification: Upgraded `scripts/verify-staging-keys.js` with automated Shannon entropy validation ($\ge 3.0$ bits/character), cross-environment consistency verification (root `.env` vs `apps/web/.env.local`), strict non-reuse verification ensuring staging keys do not equal production or compromised keys (via local comparison, zero secrets printed), and verification that staging Supabase credentials remain unpopulated placeholders.
3. RLS Parser & SQL Syntax Hardening: Resolved Supabase SQL Editor parser syntax error (`42601: syntax error at or near "USING"`) by providing explicit target roles (`TO authenticated, anon` on public select policies, `TO authenticated` on scholar management policies) on `public.scripture_catalog` and `public.canonical_verses`.
4. Migration Hash & Verification Re-Certification: Recomputed migration SHA-256 (`e6d4e0e07aab83e66a9d9276a1754bcd80093b27f1832cb720c7703b1feea39a`). All 83 automated security and real Postgres tests passed, 21/21 key audit checks passed, Next.js 15.5 production build passed cleanly.
## 2026-11-14 — Milestone M03: Post-Remediation Security Audit, Credential Purge & Staging State Reconciliation
Decision: Resolve findings from independent source audit and reconcile remote staging state:
1. Complete Credential Marker Purge: Purged all credential literals, markers, and prefixes from `scripts/verify-staging-keys.js` (`PRODUCTION_KEY_MARKERS` removed) and all documentation. Comparison targets now read strictly from local, untracked environment inputs (`process.env.PROD_KEYS_TO_EXCLUDE`).
2. Git History Audit & Mandatory Rotation: Verified Git history across all commits. Confirmed commits `52b834e` and `c4f6b4d` retain historical exposure. Confirmed Git history has NOT been rewritten. Documented that operational security requires key rotation via the Razorpay Dashboard.
3. Staging State Reconciliation: Reconciled independent inspection of staging project `zrjptpkhtklfgnovdrny` (11 tables with RLS, 1 catalog seed row, 1 verse seed row, 0 recorded migrations). Established provenance: objects originated from an earlier autocommit execution in the Supabase Dashboard SQL Editor that halted at the policy syntax error. Produced comprehensive reconciliation matrix without mutating remote database objects.
4. RLS Scholar Policy Hardening & Single-Line Syntax: Formatted all 31 `CREATE POLICY "name" ON table FOR action` declarations on single lines. Added explicit `TO authenticated` and `WITH CHECK (public.is_scholar())` to scholar policies, preventing anonymous function permission errors (`42501`) and blocking devotee write escalation.
5. Migration Hash & Verification Re-Certification: Recalculated migration SHA-256 (`3399a7317e1933f989d4a9688cac84d6d407006e930614ad90508efa52ea87ed`). Verified via local PostgreSQL simulation, Supabase CLI 3.1.0, typecheck, and Next.js production build.
6. Standing Gate: Final status maintained as `STAGING STATE RECONCILIATION — MIGRATION BLOCKED`. Zero remote mutations authorized.

## 2026-11-14 — Milestone M03: Final Read-Only Staging Reconciliation Audit & Credential Verifier Refactoring
Decision: Execute comprehensive, read-only staging reconciliation and audit verifier refactoring:
1. Credential Verifier Refactoring: Refactored `scripts/verify-staging-keys.js` into 5 distinct categories (Format validation, Key-generation provenance, Key separation, Production-key non-reuse, Placeholder validation). Purged misleading claims that Shannon entropy proves cryptographic randomness, accurately characterizing it as a heuristic distribution check. Verified CSPRNG key generation via Node.js `crypto.randomBytes(32)`. When untracked `PROD_KEYS_TO_EXCLUDE` is unset, reported production-key non-reuse as `[NOT VERIFIED]` (never a false `[PASS]`). Ensured unpopulated placeholders fail the release-readiness gate with `[FAIL]` and status `[BLOCKED]`.
2. Staging Database Reconciliation: Formally audited live staging project `zrjptpkhtklfgnovdrny` (11 tables with RLS enabled, 1 catalog seed row, 1 verse seed row, 0 migrations recorded in `supabase_migrations.schema_migrations`). Established root-cause confidence levels: autocommit web dashboard SQL editor execution (`Strongly supported`), syntax error token splitting (`Confirmed`), lack of CLI migration history tracking (`Confirmed`), and scholar policy `{public}` vs `TO authenticated` mismatch (`Confirmed`).
3. Local RLS Behavioral Verification [SIMULATED]: Verified all 7 behavioral conditions in native PostgreSQL 18.6 with Supabase stubs: anon read blocks on unapproved scripture, anon read blocks on private kundli profiles, scholar curation allow, devotee write rejection, devotee booking creation allow, admin consent audit access, and clean anonymous queries without `42501` function crashes.
4. Non-Destructive Recovery Plan: Designed step-by-step non-destructive reconciliation plan (logical backup, policy synchronization DDL, and Supabase CLI migration repair/replay) with zero remote table drops or truncations.
5. Final Audit Artifact: Produced formal comprehensive audit artifact `docs/M03_STAGING_RECONCILIATION_AUDIT.md` (12 required sections). Total executed automated tests reached 89 passed (0 failed). Standing status maintained: `STAGING RECONCILIATION — MIGRATION BLOCKED`.

## 2026-11-14 — Milestone M03.1: Controlled Staging Reconciliation & Release Readiness
Decision: Establish a controlled staging baseline and release readiness architecture without modifying remote databases:
1. Git & Credential Security Audit: Confirmed current baseline HEAD `04661a3549f7c9f0f312c3f0a50ba3720b1717f8` with a clean working tree. Verified complete absence of real secrets or markers in tracked files via secret scanning. Confirmed `.env` and `.env.*` remain strictly excluded. Verified staging key generation uses `crypto.randomBytes(32)`. Verified credential verifier reports production-key non-reuse as `[NOT VERIFIED]` when `PROD_KEYS_TO_EXCLUDE` is missing. Noted that compromised Razorpay test keys remain in historical commits `52b834e` and `c4f6b4d`; marked operational key rotation as `[BLOCKED]` pending dashboard rotation.
2. Complete Object-by-Object Database Drift Analysis: Evaluated live staging project `zrjptpkhtklfgnovdrny` vs `supabase/migrations/20261114000000_initial_schema.sql`. Documented exact drift: 11 tables present with RLS; 2 seed rows present; 18 downstream policies missing; 2 scholar policies misconfigured with `{public}` instead of `TO authenticated`; 0 records in `schema_migrations`.
3. Safe Reconciliation Design: Engineered `scripts/reconcile-staging-schema.ts`. Script includes hard-coded production project quarantine rejection, defaults to dry-run inspection, applies policies inside a single atomic transaction with rollback, verifies postconditions in `pg_policies`, and registers migration version `20261114000000` only after full validation. Zero destructive drops or truncations.
4. Release Readiness & Hosted Staging Test Plan: Authored `docs/M03_1_RELEASE_READINESS_CHECKLIST.md` with explicit labeling across all items (`PASS`, `FAIL`, `BLOCKED`, `NOT VERIFIED`, `SIMULATED`, `NOT TESTED`). Formulated 3-tier test plan clearly separating local PostgreSQL simulation from hosted staging tests.
5. Milestone M04 Application Foundation Specification: Authored `docs/M04_APPLICATION_FOUNDATION_SPEC.md` detailing Next.js 15 application shell, design system and color tokens, India-first phone OTP, DPDP Act 2023 consent center, responsive navigation, and bounded context isolation for product modules.
6. Standing Gate: Final status maintained as `M03.1 — RECONCILIATION PLAN READY / REMOTE EXECUTION AWAITING EXPLICIT APPROVAL`. Zero remote database mutations executed.

## 2026-11-15 — Milestone M03.1.1: Reconciliation Script Verification & Execution Readiness
Decision: Independently audit the M03.1 staging reconciliation script, remediate discovered defects, verify rollback readiness, and determine execution safety:
1. Baseline Script Defect Discovery & Remediation: Discovered and resolved 4 defects in `scripts/reconcile-staging-schema.ts`: (a) corrected fatal string marker mismatch where `indexOf('-- 1. Users can view and manage their own profiles')` returned `-1`, preventing script execution; (b) added mandatory staging project allowlist (`zrjptpkhtklfgnovdrny`) enforcement in addition to production blocklist; (c) upgraded superficial policy check to an exact 31-policy catalog comparing `cmd`, `roles`, `USING`, and `WITH CHECK` against `pg_policies`; (d) added `information_schema.routine_privileges` check verifying `is_scholar()` execute grants are revoked from `PUBLIC` and `anon`.
2. Backup & Recovery Security: Updated `.gitignore` to strictly exclude `supabase/backups/`, `backups/`, `*.dump`, `*.backup`, `*.sql.gz`, and `*.tar`, preventing accidental Git staging of database exports. Produced comprehensive review (`docs/M03_1_1_ROLLBACK_AND_RECOVERY_REVIEW.md`) validating `supabase db dump` targeting, restoration feasibility, transactional rollback guarantees, and emergency rollback SQL.
3. Reconciliation Script Audit Deliverable: Authored `docs/M03_1_1_RECONCILIATION_SCRIPT_AUDIT.md` documenting architecture, safeguards, defect remediation matrix, and the fundamental distinction between applying database objects, recording migration history, and verifying live catalog parity.
4. Automated Testing & Verification: Verified all safety guards via CLI (missing DB URL exits 1, production ref exits 1, non-staging ref exits 1, dry-run default). Executed comprehensive test suite (89 passed, 0 failed across static, cryptographic, PostgreSQL 18 simulation, and concurrency suites) and passed TypeScript typecheck cleanly (0 errors).
5. Final Execution Readiness Verdict: Authored `docs/M03_1_1_EXECUTION_READINESS_CHECKLIST.md` and assigned the explicit verdict: `NOT READY — CREDENTIAL BLOCKERS`. While the script is hardened and verified, execution is strictly blocked by unset `STAGING_DATABASE_URL`, unpopulated staging Supabase API key placeholders, unrotated Razorpay sandbox keys, and pending operator approval.
6. Standing Gate: Absolute zero remote mutation maintained. Zero DDL/DML executed against staging or production.

---

## 2026-11-15: ADR-009 — Approved ISHTI Brand Identity System & Pure Vector SVG Architecture
- **Context:** The approved master artwork (`media_1794686197230_b2cc9f44.jpg`) defines the visual signature for ISHTI across 6 canonical variants: Primary, Secondary, Icon, Horizontal, Monochrome, and Reversed.
- **Decision:**
  1. Extract and mathematically reconstruct the bespoke typography letterforms (`ISHTI` with Sanskrit-inspired initial and terminal flourishes) and sacred altar geometry (three-tiered Vedic vedi with Agni flame and golden bindu seed) into pure mathematical vector SVGs.
  2. Implement reusable React SVG components (`IshtiLogoIcon`, `IshtiLogoSecondary`, `IshtiLogoPrimary`, `IshtiLogoHorizontal`, `IshtiLogoMonochrome`, `IshtiLogoReversed`, `IshtiLogo`) using `React.ComponentPropsWithoutRef<'svg'>` for multi-workspace type safety and `useId()` for collision-resistant gradient IDs.
  3. Formalize design tokens in both CSS (`design-tokens.css`) and TypeScript (`ISHTI_COLORS`, `ISHTI_TYPOGRAPHY`, `ISHTI_CLEARSPACE`), ensuring full backwards compatibility with v1.0 token consumers.
  4. Build interactive brand showcase at `/brand` featuring visual rendering, SVG download endpoints, clickable hex swatches, clear-space rules, and icon scale verification down to 16px.
  5. Upgrade Brand Guidelines to v1.1.
- **Verification:** All 89 security and integrity tests passed; full Next.js 15 production build compiled cleanly with 0 errors.

---

## 2026-11-15: ADR-010 — Milestone M03.1.2: Final Staging Reconciliation Safety Gate
- **Context:** Following the M03.1.1 audit, four technical conditions required remediation and formalization prior to any staging database execution: (1) strict endpoint URL parsing to replace naive substring checks, (2) verification of Supabase migration history registration conventions under CLI 3.1.0, (3) reconciliation of inconsistent backup commands, and (4) clear separation of database connection credentials from application and payment API keys.
- **Decision:**
  1. **Strict Staging Endpoint Validation:** Created dedicated security module `scripts/validate-staging-url.ts` using WHATWG URL parsing. Enforces exact hostname equality against `db.zrjptpkhtklfgnovdrny.supabase.co` (port 5432) or `aws-0-ap-south-1.pooler.supabase.com` (port 6543/5432 with `postgres.zrjptpkhtklfgnovdrny` user prefix). Enforces strict production quarantine rejection, database name restriction (`/postgres`), unsupported port rejection, and credential masking in sanitized output.
  2. **Supabase Migration Registration Compatibility:** Audited `supabase_migrations.schema_migrations` schema and confirmed CLI 3.1.0 conventions. Verified that recording version `20261114000000` atomically within the reconciliation transaction satisfies subsequent `supabase db push` and `migration list` checks. Documented `supabase migration repair --status applied` as the official CLI alternative.
  3. **Standardized Backup Specification:** Resolved M03.1.1 command conflicts by identifying that `--data` is invalid in Supabase CLI 3.1.0 and that full recoverability requires three distinct passes: DDL schema (`--schema public,supabase_migrations`), live table data (`--data-only --use-copy`), and cluster roles (`--role-only`). Authored `docs/M03_1_2_BACKUP_VALIDATION.md`.
  4. **Credential Partitioning:** Formally segregated credentials across Phase 1 (Reconciliation: `STAGING_DATABASE_URL` only), Phase 2 (Hosted App Tests: Supabase anon/service-role, encryption keys), and Phase 3 (Payment Sandbox: Razorpay). Verified that `SUPABASE_SERVICE_ROLE_KEY` is never exposed client-side. Authored `docs/M03_1_2_CREDENTIAL_REQUIREMENTS.md`.
  5. **Razorpay Exposure Status:** Maintained strict security gate marking Razorpay sandbox credentials as **BLOCKED / PENDING OPERATOR CONFIRMATION** of dashboard key rotation.
  6. **Automated Testing:** Expanded test suite from 89 to 98 tests by adding 9 dedicated unit tests covering all valid/invalid URL allowlist cases. All 98 tests pass (100%). TypeScript typecheck passes with 0 errors.
- **Final Gate Verdict:** `NOT READY — CREDENTIAL BLOCKERS` (Awaiting operator credential provisioning, dashboard key rotation, and explicit execution approval).
- **Standing Gate:** Zero remote database mutations executed. Production project `zxwkfnvmmxoojewhvsdc` remains untouched.

---

## 2026-11-15: ADR-011 — Milestone M03.1.3: Independent Evidence Verification, Migration Bookkeeping & Backup Restoration Proof
- **Context:** Following the M03.1.2 audit, independent verification was required to resolve four remaining technical uncertainties prior to any hosted staging execution: (1) investigation of the failed CLI experiment in the M03.1.2 execution log, (2) empirical proof of migration history compatibility with Supabase CLI 3.1.0, (3) empirical validation and local restoration testing of the 3-pass backup strategy, and (4) tightening of the endpoint validator to exact pooler username matching across all remote execution paths.
- **Decision:**
  1. **Failed CLI Experiment Post-Mortem:** Root cause identified as PowerShell inline string template escaping and external scratch directory module resolution failure (`MODULE_NOT_FOUND: embedded-postgres`), rather than any database or Supabase CLI defect. Additionally discovered that Supabase CLI strictly expects the `postgres://` protocol scheme rather than `postgresql://`. Resolved by creating in-repo test suite `scripts/verify-migration-compat.ts` in the repository `scripts/` directory, normalizing the protocol prefix, and demonstrating clean exit code 0 execution.
  2. **Migration History Compatibility Proof:** Verified that `supabase_migrations.schema_migrations` contains columns `version text primary key`, `statements text[] nullable`, and `name text nullable`. Tested atomic insertion of `('20261114000000', 'initial_schema')` in an isolated PostgreSQL 18 instance. Verified that `supabase migration list --remote="postgres://..."` reports version `20261114000000` as synchronized (`local: 20261114000000, remote: 20261114000000`) and `supabase db push --dry-run` reports `"upToDate": true` (`"Remote database is up to date."`). Proved repeat-run idempotency (`ON CONFLICT (version) DO UPDATE`) and atomic transaction rollback.
  3. **Backup Architecture & Local Restoration Proof:** Authored `scripts/verify-backup-restore.ts`. Inspected official Supabase CLI 3.1.0 engine via `--dry-run` across schema (`--schema public,supabase_migrations --keep-comments`), data (`--schema public,supabase_migrations --data-only --use-copy`), and role (`--role-only`) passes. Dissected CLI sed scripts (converting to `IF NOT EXISTS`, disabling triggers during data restore via `SET session_replication_role = replica;`, and stripping reserved platform roles). Successfully executed full schema, migration history, seed data, and user profile/consent restoration into a secondary disposable database with 100% parity, 31/31 policies active, and 0 errors. Documented Docker prerequisite for non-dry-run CLI dumps and established strict rule prohibiting role dump restores into hosted Supabase projects.
  4. **Endpoint Security Tightening:** Updated `scripts/validate-staging-url.ts` to require exact pooler username (`postgres.zrjptpkhtklfgnovdrny`) and exact direct username (`postgres`). Created dedicated `scripts/backup-staging.ts` runner ensuring all remote operations validate the strict staging allowlist. Expanded unit test suite with 4 new tests (13 total URL validator tests; 102 automated tests in full suite, all passing).
  5. **Policy Verification (31 Policies):** Independently verified the exact SQL definition of all 31 policies in Section 11 of `20261114000000_initial_schema.sql`, confirming `TO authenticated` and `REVOKE ALL ON FUNCTION public.is_scholar() FROM PUBLIC; GRANT EXECUTE ... TO authenticated;` on both scholar policies.
  6. **Razorpay Key Rotation:** Retained status `BLOCKED / PENDING DASHBOARD REVOCATION`.
  7. **Final Gate Verdict:** Maintained strict gate: `NOT READY — CREDENTIAL BLOCKERS`. Zero remote mutations executed against staging (`zrjptpkhtklfgnovdrny`) or production (`zxwkfnvmmxoojewhvsdc`).
- **Deliverables:**
  - `docs/M03_1_3_INDEPENDENT_EVIDENCE_REPORT.md`
  - `docs/M03_1_3_MIGRATION_HISTORY_COMPATIBILITY.md`
  - `docs/M03_1_3_BACKUP_RESTORE_TEST.md`
  - `scripts/verify-migration-compat.ts`
  - `scripts/verify-backup-restore.ts`
  - `scripts/backup-staging.ts`

---

## 2026-11-15: ADR-012 — Milestone M03.2: Controlled Staging Execution Preparation & Three-Gate Protocol
- **Context:** Following the completion of the M03.1.3 independent evidence verification, an operational execution runbook, preflight checklist, and tiered rollback procedures were required to prepare for a controlled, approval-gated execution against hosted staging database `zrjptpkhtklfgnovdrny`.
- **Decision:**
  1. **Strictly Decoupled Three-Gate Governance Protocol:**
     - **Gate A:** Hosted Pre-Reconciliation Staging Backup (requires Docker Desktop running, local untracked `STAGING_DATABASE_URL`, checksum validation, and local file permission lockdown).
     - **Gate B:** Hosted Staging Schema Reconciliation (executes `scripts/reconcile-staging-schema.ts --execute` inside an atomic transaction, validating postconditions in `pg_policies` and `information_schema.routine_privileges`).
     - **Gate C:** Hosted Application Integration Tests (Phase 2 credential loading, client-side RLS validation, and non-regression verification).
     - **Explicit Governance Rule:** Each gate requires standalone, explicit operator authorization. Approval for Gate A does NOT authorize Gate B. Approval for Gate B does NOT authorize production changes.
  2. **Zero Remote Operations in M03.2:** No remote commands, migrations, backups, or DDL/DML executed during preparation.
  3. **Production Hard-Quarantine:** Re-verified that `zxwkfnvmmxoojewhvsdc` is strictly rejected by all scripts.
  4. **Preflight Checklist & "No Auto-Repair" Rule:** Generated comprehensive preflight inspection covering all 11 tables, row counts, 31 policies, functions, triggers, partial unique indexes, and seed data. Enforced strict rule: unexpected objects will never be automatically dropped or repaired; any unrecorded drift immediately aborts execution.
  5. **Three-Tier Rollback Architecture:** Documented automatic in-transaction rollback (Level 1), selective emergency rollback SQL (Level 2), and full disaster-recovery restoration via 3-pass backup (Level 3), with strict warnings prohibiting role dump restores into hosted Supabase.
  6. **Deliverables:**
     - `docs/M03_2_STAGING_EXECUTION_RUNBOOK.md`
     - `docs/M03_2_PREFLIGHT_CHECKLIST.md`
     - `docs/M03_2_ROLLBACK_PROCEDURE.md`
- **Final Gate Status:** `M03.2 — EXECUTION PLAN READY / AWAITING EXPLICIT APPROVAL`. Zero remote database mutations executed. Production project `zxwkfnvmmxoojewhvsdc` remains untouched.



## 2026-11-15: ADR-013 — Milestone M03.2.1: Gate A Backup Readiness Review & Failure Containment
- **Context:** Following Milestone M03.2, a dedicated inspection-only review was conducted to audit the staging backup implementation, credential dependencies, and failure modes before requesting operator approval for Gate A.
- **Decision:**
  1. **Decoupled Credential Dependencies:** Separated Razorpay test credential revocation from database backup (Gate A) and schema reconciliation (Gate B). Gate A and Gate B require exclusively staging database connection authorization (`STAGING_DATABASE_URL`). Razorpay key rotation remains mandatory for payment sandbox integration (Gate C). The credential exposure incident remains marked UNRESOLVED until operator dashboard revocation is confirmed.
  2. **Safe Handling of Partial Backup Failures:** Hardened `scripts/backup-staging.ts` so that any failure in Pass 1 (Schema), Pass 2 (Data), or Pass 3 (Roles) immediately marks the overall run as `FAILED` (never `PARTIAL SUCCESS`). Incomplete dump artifacts from the current run are quarantined with `.FAILED_INCOMPLETE` (or cleanly removed). A failure manifest `staging_backup_[TS].FAILED.json` is generated. Pre-existing historical backups are never deleted.
  3. **Zero External Cloud Uploads & Local Hygiene:** Verified that backup artifacts remain strictly on local disk (`supabase/backups/`) and are never uploaded to external cloud services. Excluded from version control via `.gitignore`.
  4. **Cryptographic Integrity & Companion Manifests:** Implemented automatic SHA-256 calculation for all 3 dump files upon successful generation, emitting `staging_backup_[TS].meta.json` recording timestamp, project ref (`zrjptpkhtklfgnovdrny`), file sizes, and SHA-256 hashes.
  5. **Automated Verification Mode:** Added `npx tsx scripts/backup-staging.ts --verify [timestamp]` to independently validate backup integrity (asserting file existence, non-zero sizes, and SHA-256 match against manifest).
  6. **Credential Sanitization in Error Logs:** Added `sanitizeErrorMessage()` wrapping all CLI outputs and exception handlers to scrub plaintext passwords and raw connection strings.
  7. **Governance Safeguards for Gate B & Rollback:** Reaffirmed that ordinary `db push` is forbidden (only `db push --dry-run` permitted), `migration repair` cannot substitute for SQL execution, and all rollbacks modifying hosted data require explicit operator authorization (no automated host-modifying rollbacks).
  8. **Deliverables:**
     - `docs/M03_2_1_GATE_A_READINESS_REVIEW.md`
     - `docs/M03_2_1_BACKUP_FAILURE_HANDLING.md`
     - Hardened `scripts/backup-staging.ts` with `--verify` and partial failure quarantine
     - Updated `docs/M03_2_STAGING_EXECUTION_RUNBOOK.md`, `docs/M03_2_PREFLIGHT_CHECKLIST.md`, and `docs/M03_2_ROLLBACK_PROCEDURE.md`
     - Unit test suite expanded (106 automated tests passing 100%)
- **Final Gate Status:** `M03.2.1 — READY FOR EXPLICIT GATE A APPROVAL`. Zero remote database mutations executed. Production project `zxwkfnvmmxoojewhvsdc` remains untouched.


## 2026-11-15: ADR-014 — Milestone M03.2.2: Final Gate A Operational Checks & Windows ACL Hardening
- **Context:** Following Milestone M03.2.1, final operational checks were performed to reconcile test accounting, enforce restrictive Windows ACLs on backup directories and files, and conduct dry-run verification before requesting explicit operator approval for Gate A.
- **Decision:**
  1. **Strictly Decoupled Test & Typecheck Accounting:** Separated automated behavioral test accounting from TypeScript compiler typecheck verification. Recorded exact commands, process exit codes, and suite breakdowns:
     - Automated Tests (`npm.cmd run test:security`): 108 passed, 0 failed across 5 categories (29 static, 50 unit, 3 integration, 22 real DB RLS, 4 concurrency). Exit code 0.
     - TypeScript Typecheck (`npm.cmd run typecheck`): 0 errors across `@spiritual-os/mobile` and `@spiritual-os/web`. Exit code 0. Explicitly categorized as compiler type analysis, not automated tests.
  2. **Programmatic Windows ACL Security:** Hardened `scripts/backup-staging.ts` with programmatic Windows Access Control List management:
     - Disables inherited permissions (`icacls /inheritance:r`).
     - Grants Full Control exclusively to current operator (`%USERNAME%`) and `SYSTEM`.
     - Explicitly checks for and rejects broad access groups (`Everyone`, `BUILTIN\Users`, `Authenticated Users`, `Users:`, sandbox users).
     - Directly queries effective ACL using `icacls` immediately following application to verify compliance.
     - Fails backup readiness check if permissions cannot be secured.
     - Preserves existing completed backups without modification or deletion.
     - Retains equivalent POSIX `0700` (directory) and `0600` (files) permissions.
  3. **Permission Verification in `--verify` Mode:** Updated `verifyBackupIntegrity()` to assert that the backup directory and all generated dump files satisfy the restrictive ACL/POSIX policy.
  4. **Final Gate A Dry-Run Confirmed:** Executed dry-run against staging (`zrjptpkhtklfgnovdrny`) confirming endpoint validation and ACL security (Exit code 0). Executed dry-run against quarantined production (`zxwkfnvmmxoojewhvsdc`) confirming immediate hard-block (Exit code 1).
  5. **Deliverables:**
     - `docs/M03_2_2_GATE_A_FINAL_CHECK.md`
     - Hardened `scripts/backup-staging.ts` and `scripts/run-comprehensive-tests.js` (108 automated tests passing 100%)
     - Updated project tracker and decision log
- **Final Gate Status:** `M03.2.2 — READY FOR EXPLICIT GATE A APPROVAL`. Zero remote database mutations executed. Production project `zxwkfnvmmxoojewhvsdc` remains untouched.

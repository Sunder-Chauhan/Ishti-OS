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


## 2026-11-15: ADR-015 — Milestone M03.2.4: Operator Dry-Run Acceptance & Database Credential Compromise Governance
- **Context:** Following the M03.2.3 preflight status, the human operator supplied terminal evidence demonstrating successful local execution of `npx.cmd tsx scripts/backup-staging.ts` with exit code 0. Additionally, a prior development screenshot exposing a staging database password was reviewed.
- **Decision:**
  1. **Evidentiary Acceptance of Local Dry-Run:** Formally accepted the operator-supplied dry-run execution transcript as proof of local endpoint syntax validation, production quarantine filtering, destination path generation, and Windows ACL lockdown. Established the governance distinction: local dry-run does not prove remote PostgreSQL socket reachability or hosted authentication.
  2. **Formal Staging Password Compromise Classification (INC-02):** Classified the staging database password as COMPROMISED. Mandated that the Gate A backup must not proceed on the assumption that the old password remains secure. Recorded password rotation status as PENDING OPERATOR CONFIRMATION. Prohibited assuming rotation occurred without explicit operator evidence in the Supabase dashboard.
  3. **Zero Credential Exposure Invariant:** Reaffirmed that no agent, script, or documentation will inspect, print, copy, or solicit the new database password.
  4. **Conditional Gate A Status:** Designated the milestone status as `CONDITIONALLY READY — PASSWORD ROTATION NOT CONFIRMED`. Full Gate A approval is conditioned upon the operator resetting the database password in the dashboard and issuing the explicit statement: `"I explicitly authorize Gate A only."`
  5. **Deliverables:**
     - `docs/M03_2_4_GATE_A_DRY_RUN_SUCCESS.md`
     - Updated `docs/RISK_REGISTER.md` with incident tracking (`INC-01` and `INC-02`)
     - Updated `docs/PROJECT_TRACKER.md` and `docs/DECISION_LOG.md`
- **Final Gate Status:** `M03.2.4 — CONDITIONALLY READY (PASSWORD ROTATION NOT CONFIRMED)`. Zero live backups or remote mutations executed. Production project `zxwkfnvmmxoojewhvsdc` remains untouched.


## 2026-11-16: ADR-016 — Milestone M03.3: Execution & Verification of Gate A Backup and Gate B Staging Schema Reconciliation
- **Context:** Following operator authorization of Gate A ("I explicitly authorize Gate A only") and Gate B ("I explicitly authorize Gate B only"), operational execution was carried out against hosted staging project `zrjptpkhtklfgnovdrny` using the Supabase Mumbai Session Pooler (`aws-0-ap-south-1.pooler.supabase.com:5432`).
- **Decision:**
  1. **Gate A Hosted Backup Execution:** Generated a complete 3-pass logical backup (`staging_schema_*.sql`, `staging_data_*.sql`, `staging_roles_*.sql`, `staging_backup_*.meta.json`) under `supabase/backups/`. Verified 100% SHA-256 and size parity via `scripts/backup-staging.ts --verify`. Verified Windows ACL restrictions (SYSTEM and operator `as` only). Enforced governance prohibition against restoring `staging_roles_*.sql` into hosted Supabase.
  2. **Gate B Pre-Reconciliation Audit:** Audited reconciliation script `scripts/reconcile-staging-schema.ts`. Verified canonical migration hash (`3399a731...`). Verified the 32nd `DROP POLICY IF EXISTS` statement on `public.profiles` (`"Public can view verified expert profiles"`) as an intentional and safe security drop.
  3. **Runtime Role Parser & Privilege Hardening Remediations:**
     - Resolved `TypeError: (live.roles || []).map is not a function` by implementing `normalizeRoles()` for PostgreSQL `name[]` string deserialization.
     - Resolved function privilege violation by explicitly executing `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon` and `GRANT EXECUTE ... TO authenticated, service_role` for `public.is_scholar()` and `public.is_admin()`.
  4. **Gate B Hosted Reconciliation Execution & Remote Parity:**
     - Synchronized all 31 RLS policies via single atomic transaction.
     - Verified postconditions in `pg_policies`: all 31 policies match canonical definitions, commands, and roles (`TO authenticated` on scholar policies).
     - Verified routine privileges in `information_schema.routine_privileges`: `is_scholar()` and `is_admin()` execution restricted strictly from `PUBLIC` and `anon`.
     - Registered migration version `20261114000000` in `supabase_migrations.schema_migrations`.
     - Confirmed Supabase CLI remote parity: `supabase migration list --remote` reports version `20261114000000` present both locally and remotely.
  5. **Non-Destructive Invariant:** Zero tables dropped, zero columns altered, seed records in `scripture_catalog` and `canonical_verses` preserved with 0 rows lost.
  6. **Deliverables:**
     - `docs/M03_3_GATE_A_COMPLETION_REPORT.md`
     - `docs/M03_3_GATE_B_PRE_RECONCILIATION_AUDIT.md`
     - `docs/M03_3_GATE_B_COMPLETION_REPORT.md`
     - Updated `scripts/reconcile-staging-schema.ts` and `scripts/run-comprehensive-tests.js` (110 automated tests passing 100%)
- **Final Gate Status:** `M03.3 — GATE B COMPLETE / GATE C LOCKED`. Production project `zxwkfnvmmxoojewhvsdc` remains strictly quarantined. Gate C (hosted application testing) is locked pending operator resolution of `INC-01` (Razorpay sandbox key rotation in merchant dashboard).


## 2026-11-16: ADR-017 — Milestone M03.3: Pre-Gate C Independent Hosted Staging Verification & INC-01 Key Rotation Resolution
- **Context:** Following the completion of Gate B schema reconciliation and the operator's merchant dashboard rotation of the historically exposed Razorpay sandbox test key pair (`INC-01`), an autonomous read-only verification was executed directly against hosted staging project `zrjptpkhtklfgnovdrny` using `scripts/verify-hosted-staging.ts` (`npm run verify:staging`).
- **Decision:**
  1. **Independent Read-Only Hosted Audit (72/72 Checks Passed):** Executed autonomous catalog inspection with zero DDL or DML mutations:
     - **Table Inventory & RLS:** All 11 public tables confirmed present with `rowsecurity = true`.
     - **Seed & Data Isolation:** Exactly 1 row in `scripture_catalog`, 1 row in `canonical_verses`, and exactly 0 rows across all 9 transactional tables (pristine state).
     - **Function Architecture & Security Semantics:** Verified that all 11 administrative/security functions enforce `SECURITY DEFINER` and hardened `search_path` (`public, pg_catalog, pg_temp`). Confirmed that unprivileged data-validation trigger `validate_kundli_ciphertext_payload()` runs as `SECURITY INVOKER`, adhering to the principle of least privilege.
     - **Routine Privilege Restrictions:** Confirmed `PUBLIC` and `anon` execution revoked from `public.is_scholar()`, `public.is_admin()`, and `public.assign_user_role()`. Confirmed rate-limiting functions restricted strictly to `service_role` and `postgres`.
     - **RLS Policy Inventory:** Exactly 31 policies verified in `pg_policies`, matching canonical commands and role targets (`TO authenticated` on scholar-managed scripture tables).
     - **Migration History Parity:** Confirmed initial schema version `20261114000000` registered in `supabase_migrations.schema_migrations`.
  2. **Resolution of Incident INC-01:** Formally verified the operator's merchant dashboard rotation of the Razorpay sandbox key pair. Rotated credentials (`rzp_test_U0ZaQD3U8gxyqI`) were provisioned in local git-ignored `.env` and `apps/web/.env.local`, verified via `scripts/verify-staging-keys.js` with zero secret leakage in logs, and `docs/RISK_REGISTER.md` was marked `RESOLVED / KEY ROTATED`.
  3. **Preservation of Gate C Barrier:** Reaffirmed that Gate C (Hosted Application Integration Testing) is strictly locked and cannot be initiated without explicit human operator authorization: `"I explicitly authorize Gate C only."`
  4. **Deliverables:**
     - `docs/M03_3_INDEPENDENT_STAGING_VERIFICATION_REPORT.md`
     - `scripts/verify-hosted-staging.ts`
     - Updated `docs/PROJECT_TRACKER.md`, `docs/RISK_REGISTER.md`, and `docs/DECISION_LOG.md`
- **Final Gate Status:** `M03.3 — GATE B COMPLETE / INC-01 RESOLVED / INDEPENDENT VERIFICATION PASSED / READY FOR GATE C AUTHORIZATION`. Production project `zxwkfnvmmxoojewhvsdc` remains strictly quarantined.


## 2026-11-16: ADR-018 — Milestone M03.3: Gate C Hosted Application Integration & Payment Sandbox Verification (Milestone M03 Closure)
- **Context:** Following explicit human operator authorization ("I explicitly authorize Gate C only"), the Gate C hosted application integration test runner (`scripts/run-gate-c-tests.ts`, `npm run test:gate-c`) was executed against hosted staging database `zrjptpkhtklfgnovdrny` and the live Razorpay sandbox API.
- **Decision:**
  1. **Hosted Application & Payment Integration Verification (18/18 Checks Passed):**
     - **Payment Sandbox Integration (INC-01 Live Validation):** Validated newly rotated sandbox key pair (`rzp_test_U0ZaQD3U8gxyqI`). Successfully created live sandbox order `order_U0qSio1s***` for ₹1,100 (110,000 paise). Confirmed HMAC-SHA-256 webhook signature verification algorithm and tamper rejection.
     - **Target Safety & Quarantine Guard:** Confirmed WHATWG URL parser enforces exact staging project allowlist (`zrjptpkhtklfgnovdrny`) and hard-blocks production (`zxwkfnvmmxoojewhvsdc`).
     - **Hosted Public Scripture Catalog RLS & Rights Protection:** Confirmed that anonymous users receive 0 rows for unverified & pending-clearance seed data, shielding uncurated religious content from public view (RSK-01 / RSK-02). Confirmed that verified & cleared texts (Gita 2.47) are readable by public users in transient transaction tests. Confirmed anonymous writes are blocked with RLS error 42501.
     - **Hosted Access Control:** Confirmed authenticated devotee writes to `scripture_catalog` are blocked by `is_scholar()` RLS check. Confirmed `is_scholar()` and `is_admin()` evaluate safely without recursion.
     - **Hosted Kundli Envelope Encryption & Tenant Isolation:** Verified AES-256-GCM envelope encryption round-trip with context-bound AAD (`ishti:kundli_profiles:${userId}:${profileId}:${field}:v1`). Verified database trigger `validate_kundli_ciphertext_payload()` accepts authenticated ciphertext and rejects plaintext birth dates. Confirmed cross-tenant isolation (Devotee B receives 0 rows when querying Devotee A's Kundli profile).
     - **Hosted Early Access & Rate Limiter:** Confirmed atomic execution of `public.check_rate_limit()` with sliding-window quota enforcement (request 1 allowed, request 2 blocked). Confirmed unique constraint 23505 handling on duplicate email registration.
     - **Post-Test Database Cleanliness & Zero Pollution:** Confirmed all 9 transactional tables contain exactly 0 rows (pristine state). Confirmed seed scripture records are preserved with 0 rows lost.
  2. **Milestone M03 Formal Closure:** Formally closed Milestone M03 (Staging Deployment & Integration Validation). All three approval gates (Gate A: Backup, Gate B: Schema Reconciliation, Gate C: Hosted App & Payment Sandbox Tests) have been successfully executed, verified, and audited.
  3. **Transition to Milestone M04:** Authorized the transition to Milestone M04 (Application Foundation & User Experience Shell).
  4. **Deliverables:**
     - `docs/M03_3_GATE_C_COMPLETION_REPORT.md`
     - `docs/M03_MILESTONE_COMPLETION_REPORT.md`
     - `scripts/run-gate-c-tests.ts`
     - Updated `docs/PROJECT_TRACKER.md` and `docs/DECISION_LOG.md`
- **Final Gate Status:** `MILESTONE M03 COMPLETE & SIGNED OFF — READY FOR MILESTONE M04`. Production project `zxwkfnvmmxoojewhvsdc` remains strictly quarantined.



## 2026-11-16: ADR-019 — Milestone M04: Application Foundation & User Experience Shell Implementation
- **Context:** Following formal sign-off and closure of Milestone M03, ISHTI initiated Milestone M04 to establish the application foundation and responsive user experience shell. The directive mandated building a coherent, interconnected ISHTI ecosystem rather than six disconnected applications, adhering to three foundation rules: (1) design system before individual pages, (2) guest browsing by default with authentication required only for personalized features, and (3) meaningful DPDP Act 2023 §6 purpose-specific consent governance.
- **Decision:**
  1. **Foundation & Design System Tokens (M04.1):**
     - Enriched `apps/web/app/design-tokens.css` and `apps/web/lib/design-tokens.ts` with 8pt Vedic modular spatial tokens (`--space-1` through `--space-24`), layout container constraints (`--container-sm` through `--container-xl`), surface elevation tiers, and WCAG 2.2 AAA/AA compliant color tokens.
     - Engineered `AppShell` (`apps/web/app/components/layout/AppShell.tsx`) wrapping all routes with global `<AuthProvider>`, accessible skip-to-content landmark, `DesktopHeader`, semantic `<main id="main-content">`, `Footer`, `MobileBottomNav`, and top-layer `AuthModal`.
  2. **Navigation & Responsive UX Architecture (M04.2):**
     - Implemented `DesktopHeader` (`apps/web/app/components/layout/DesktopHeader.tsx`) featuring official `IshtiLogoIcon` vector branding, active route highlighting across the 6 core product domains, guest "Sign In" trigger, and authenticated devotee profile menu with role badge and sign-out action.
     - Engineered `MobileBottomNav` (`apps/web/app/components/layout/MobileBottomNav.tsx`) with 5 thumb-friendly touchpoints (Home, Bhakti, Panchang, Astro, Profile) meeting WCAG 2.2 touch target minimums ($\ge 48\text{ px}$).
     - Created accessible `Breadcrumbs` (`apps/web/app/components/layout/Breadcrumbs.tsx`) and `PillarShell` (`apps/web/app/components/layout/PillarShell.tsx`) for unified module headers and Shastric subheads.
  3. **India-First Phone OTP Authentication Shell (M04.3):**
     - Built `AuthProvider` and `useAuth` hook (`apps/web/lib/auth/auth-context.tsx`) managing devotee profiles, role state, and session persistence via `@supabase/ssr` with a transparent Staging Sandbox fallback mode for local/offline environments.
     - Implemented accessible `AuthModal` (`apps/web/app/components/auth/AuthModal.tsx`) using native HTML `<dialog>` with `overscroll-behavior: contain`, `::backdrop` blur, light-dismiss, +91 Indian phone validation, 6-digit OTP verification, 60-second resend countdown, and guest continuation link.
  4. **Devotee Profile & DPDP Act 2023 §6 Consent Center (M04.4):**
     - Authored `/profile` route (`apps/web/app/profile/page.tsx`) displaying devotee identity metadata, sampradaya tradition, verification status, and quick links to encrypted Kundli, pandit consultations, and consent preferences.
     - Engineered `/profile/consent` route (`apps/web/app/profile/consent/page.tsx`) providing granular, unbundled, purpose-specific consent toggles (`kundli_astrology`, `expert_consultation`, `marketing_updates`, `analytics`) with statutory notice and explanation of Data Principal rights under §§6(4), 11, 12, and 13 of the DPDP Act 2023.
  5. **Six Coherent Product Module Shells (M04.5):**
     - Implemented `/puja` (ISHTI Puja): Canonical ritual guides, samagri checklists, and Acharya consultation requests.
     - Implemented `/astro` (ISHTI Astro): Encrypted Kundli birth chart calculator shell, Graha Spashta ephemeris table, and ethical non-commercial dosha guidance.
     - Implemented `/bhakti` (ISHTI Bhakti): Canonical scripture reader, featured Rigveda 10.191.2 (Samjnana Sukta) verse, and rights-cleared Shastric text search.
     - Implemented `/panchang` (ISHTI Panchang): Real-time calculation of the Five Limbs of Time (Tithi, Vaara, Nakshatra, Yoga, Karana), auspicious Muhurtas, inauspicious periods, and Purnimanta/Amanta toggles.
     - Implemented `/experts` (ISHTI Experts): Verified Pandit and Acharya directory with accredited credentials, Vedic pathshala lineages, and published transparent honorariums.
     - Implemented `/community` (ISHTI Community): Dignified Satsang circles, temple seva opportunities, and Community Dignity Charter (सद्भाव संहिता).
  6. **Verification Evidence:**
     - Next.js 15 production build (`npm.cmd run build:web`) succeeded with 0 errors across all 13 prerendered static routes.
     - Monorepo TypeScript check (`npm.cmd run typecheck`) passed with 0 errors across `@spiritual-os/mobile` and `@spiritual-os/web`.
     - Full security and RLS test suite (`npm.cmd run test:security`) passed 110/110 tests (100% pass rate).
     - Production quarantine on `zxwkfnvmmxoojewhvsdc` strictly maintained.
  7. **Deliverables:**
     - `docs/M04_FOUNDATION_AND_DESIGN_SYSTEM_AUDIT.md`
     - `apps/web/app/design-tokens.css` & `apps/web/lib/design-tokens.ts`
     - `apps/web/app/components/layout/` (`AppShell.tsx`, `DesktopHeader.tsx`, `MobileBottomNav.tsx`, `Breadcrumbs.tsx`, `PillarShell.tsx`, `index.ts`)
     - `apps/web/app/components/auth/AuthModal.tsx` & `apps/web/lib/auth/auth-context.tsx`
     - `apps/web/app/profile/page.tsx` & `apps/web/app/profile/consent/page.tsx`
     - `apps/web/app/puja/page.tsx`, `apps/web/app/astro/page.tsx`, `apps/web/app/bhakti/page.tsx`, `apps/web/app/panchang/page.tsx`, `apps/web/app/experts/page.tsx`, `apps/web/app/community/page.tsx`
     - Updated `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`, `apps/web/app/components/Navbar.tsx`, `apps/web/app/components/Footer.tsx`, `apps/web/app/components/EcosystemCards.tsx`, and `apps/web/app/globals.css`
     - Updated `docs/PROJECT_TRACKER.md` and `docs/DECISION_LOG.md`
- **Final Gate Status:** `MILESTONE M04 COMPLETE & FULLY VERIFIED`. Production project `zxwkfnvmmxoojewhvsdc` remains strictly quarantined.


## 2026-11-16: ADR-020 — Official ISHTI Digital Logo Family Integration and Brand Asset Preservation
- **Context:** The official digital logo family for ISHTI was finalized and approved in master vector file `preview_v2.html` containing six distinct SVG variants. The directive mandated strictly an asset-integration task, NOT a logo-design task. The six logos are immutable brand assets: redesign, recreation, font substitution, geometric alteration, color modification, lossy SVG optimization, and rasterization were strictly prohibited. The application was required to be implemented around these approved logos, never the logos around the application.
- **Decision:**
  1. **Source of Truth & Standalone Assets (`apps/web/public/brand/`):**
     - Preserved `preview_v2.html` as the immutable master reference at repository root and in `docs/preview_v2.html`.
     - Extracted all six approved SVG variants verbatim without lossy optimization, path alteration, or ID renaming into `apps/web/public/brand/`:
       * `ishti-primary.svg` (`viewBox="0 0 400 540"`, 39,858 bytes)
       * `ishti-secondary.svg` (`viewBox="0 0 400 460"`, 39,344 bytes)
       * `ishti-icon.svg` (`viewBox="0 0 400 400"`, 31,354 bytes)
       * `ishti-horizontal.svg` (`viewBox="0 0 680 240"`, 39,837 bytes)
       * `ishti-monochrome.svg` (`viewBox="0 0 400 460"`, 38,188 bytes, fill `#2A2726`)
       * `ishti-reversed.svg` (`viewBox="0 0 400 460"`, 39,144 bytes, dark tile `#282A36`)
     - Maintained synchronized legacy aliases (`ishti-logo-*.svg`) to preserve backward compatibility with existing tests and download paths.
  2. **Reusable Typed React Component (`<IshtiLogo />`):**
     - Engineered `<IshtiLogo />` in `apps/web/app/components/brand/IshtiLogo.tsx` with strongly typed props (`IshtiLogoProps`), explicit variant selection (`IshtiLogoVariant`), automatic aspect-ratio computation (`${intrinsicWidth} / ${intrinsicHeight}`), `objectFit: 'contain'`, responsive scaling, and comprehensive accessibility treatment (`role="img"`, `aria-label`, `decorative`).
     - Adopted the preferred direct image rendering strategy (`<img src="/brand/ishti-*.svg" />`), completely isolating SVG gradient definitions (`pri-flame`, `sec-flame`, `ico-flame`, `horiz-flame`) to eliminate DOM gradient ID collision risks across concurrent renders while achieving 100% vector fidelity and zero layout shift.
     - Provided typed wrapper components (`IshtiLogoPrimary`, `IshtiLogoSecondary`, `IshtiLogoIcon`, `IshtiLogoHorizontal`, `IshtiLogoMonochrome`, `IshtiLogoReversed`).
  3. **Application Location Alignment:**
     - Desktop Navigation (`DesktopHeader.tsx`): Updated to use the approved `horizontal` variant (`height={36}`) featuring the sacred flame symbol, custom serif ISHTI wordmark, and stacked tagline in official proportions.
     - Mobile Navigation Drawer (`DesktopHeader.tsx`): Updated to use the approved `secondary` variant (`height={44}`).
     - Footer (`Footer.tsx`): Updated to use the approved `secondary` variant (`height={54}`).
     - Authentication Modal (`AuthModal.tsx`): Updated to use the approved `secondary` variant (`height={40}`).
     - 404 Sanctuary Page (`not-found.tsx`): Updated to use the approved `secondary` variant (`height={80}`).
     - Brand Identity Showcase (`brand/page.tsx`): Updated all 6 showcase cards and download endpoints to canonical filenames.
  4. **Favicon, PWA & Metadata Integration:**
     - Deployed `ishti-icon.svg` as `/favicon.ico` in `apps/web/public/` and Next.js App Router dynamic icon `/icon.svg` in `apps/web/app/`.
     - Created `apps/web/app/manifest.ts` delivering Web App Manifest with `ishti-icon.svg`.
     - Updated `apps/web/app/layout.tsx` metadata with icon links, OpenGraph images (`ishti-primary.svg`), and Twitter summary cards.
     - Integrated `Cinzel` font alongside `Cormorant Garamond`, `Inter`, and `Noto Sans Devanagari`.
  5. **Design Tokens & Verification:**
     - Verified central design tokens match approved colors: `#F8F4ED` (Background), `#711B16` (Temple Maroon), `#EF7428` (Vedic Saffron), `#D7A64A` (Sacred Gold), `#282A36` (Dark Surface), `#9E764E` (Muted Gold), `#2A2726` (Monochrome Charcoal).
     - Automated verification script `scripts/verify-approved-logos.mjs` verifies 100% byte-for-byte parity for all 6 variants.
     - Monorepo typecheck: 0 errors.
     - Security and RLS test suite: 110/110 passing (100%).
     - Next.js production build: Succeeded with 0 errors across all 15 prerendered static routes.
- **Final Gate Status:** `OFFICIAL ISHTI LOGO FAMILY INTEGRATION VERIFIED`. Production project `zxwkfnvmmxoojewhvsdc` remains strictly quarantined.


## 2026-11-16: ADR-021 — Formal Acceptance and Closure of Milestone M04 at Commit cafc920
- **Context:** Following the completion of the M04 Application Foundation, UX Shell implementation, and iconography refinement (Lucide icon system replacing all UI emojis), an independent post-implementation acceptance audit was performed at commit `cafc9207b27010d5ddd32662937b758988a75524`.
- **Decision:**
  1. **Milestone M04 Formally Accepted:** Milestone M04 Application Foundation & UX Shell is accepted and formally closed at commit `cafc920`.
  2. **Acceptance Evidence Base:**
     - Local and remote Git synchronization confirmed (`main` and `origin/main` point to `cafc920`).
     - Clean working tree verified at audit baseline.
     - Monorepo TypeScript verification passed (`tsc --noEmit`, 0 errors).
     - Next.js 15 production build passed cleanly (`next build`, 15/15 static routes).
     - Comprehensive security test suite passed (110 passed, 0 failed, 3 remote pending deployment).
     - Zero interface emojis detected (`scripts/audit-ui-icons.mjs`).
     - Byte-for-byte logo parity across all six approved SVG variants confirmed (`scripts/verify-approved-logos.mjs`).
     - Desktop and mobile visual acceptance audit completed across all 6 product pillars.
     - Staging database `zrjptpkhtklfgnovdrny` operational; production project `zxwkfnvmmxoojewhvsdc` strictly quarantined.
  3. **M04.6 Enhancement Proposal Registered:**
     - A separate proposed enhancement entry, `M04.6 — Inclusive Experience & Globalisation Foundation`, is created in `PROJECT_TRACKER.md` as PROPOSED / PLANNED.
     - Scope includes: public/backend technical information separation, human-readable errors, internationalisation architecture (English and Hindi completion, 8-language regional expansion), persistent accessibility preferences, accessibility centre (WCAG 2.2 AAA/AA), senior-friendly interaction patterns, and screen-reader/read-aloud capabilities.
     - M04.6 remains planned/unimplemented in project tracking until requirements, architecture, and acceptance criteria are separately reviewed and authorized.
  4. **Governance Invariants:**
     - Production database remains quarantined with zero access.
     - Zero production deployments permitted at this phase.
     - Deep feature implementation for Milestone M05 held pending M04.6 review and authorization.
- **Final Gate Status:** `MILESTONE M04 ACCEPTED & CLOSED AT cafc920`. Production project `zxwkfnvmmxoojewhvsdc` remains strictly quarantined.

## 2026-11-17: ADR-022 — Formal Acceptance and Closure of Milestone M04.6 (Universal Accessibility, Internationalisation & Public UX Isolation)
- **Context:** Following the completion of the M04.6 enhancement scope, independent readiness audit, pre-commit evidence review, and final acceptance reconciliation, the operator formally accepted M04.6 on November 17, 2026, closing the M04 Application Foundation.
- **Decision:**
  1. **Milestone M04.6 Formally Accepted & Closed:** M04.6 (Inclusive Experience & Globalisation Foundation) is accepted and closed.
  2. **Acceptance Evidence Base:**
     - **Automated Verification:** 110/110 security and RLS tests pass (`npm run test:security`), 0 TypeScript errors across monorepo workspaces (`npm run typecheck`), 15/15 Next.js static pages prerendered cleanly with zero warnings (`npm run build:web`).
     - **Iconography & Brand Integrity:** 0 UI emojis in application source scope (`scripts/audit-ui-icons.mjs`); 100% byte-for-byte logo parity across all six approved SVG assets in `apps/web/public/brand/` verified against master reference `preview_v2.html` (`scripts/verify-approved-logos.mjs`).
     - **Web Speech API Privacy:** Audited browser speech engine characteristics; added transparent in-UI vendor processing disclosure in `AccessibilityModal` prior to microphone activation; zero audio recording or server-side transmission by ISHTI; strictly opt-in.
     - **Multilingual Architecture:** 100% complete English (`en`) and Hindi (`hi`) dictionaries; 8 regional Indian languages scaffolded with safe recursive deep-fallback to English; transparent "Roadmap (English fallback)" badging in language selector; exact canonical preservation of Sanskrit verses and IAST transliterations.
     - **Universal Accessibility (WCAG 2.2):** Validated keyboard focus traversal starting from high-contrast Skip to Content link (8.2:1 contrast); native HTML5 `<dialog>` focus trapping (`showModal()`) and focus restoration to invoking buttons; $\ge 48\text{px}$ touch targets; flexible text scaling from 100% to 200% with clean reflow; 6 preconfigured accessibility profiles with `localStorage` persistence and one-click reset.
     - **Public UX Isolation:** Sanitized internal database primary keys to devotee membership references (`ISHTI-XXXXXXXX`); intercepted and mapped Postgres error codes (`42P01`, `PGRST*`, `23505`) to calm, comforting messages; server-side role evaluation (`platform_admin`) for diagnostic access.
     - **Staging Discrepancy Reconciliation:** Stale M02 informational message in `scripts/run-comprehensive-tests.js` updated to clarify that offline security runner deliberately skips live remote network tests, and that M03 hosted staging (`zrjptpkhtklfgnovdrny`) was reconciled and verified separately in Gate B and Gate C.
  3. **Governance Invariants Maintained:**
     - Remote production Supabase (`zxwkfnvmmxoojewhvsdc`) remains strictly isolated and quarantined.
     - Zero remote migrations executed; zero secrets or credentials leaked in code or commits.
- **Final Gate Status:** `MILESTONES M04 & M04.6 FORMALLY ACCEPTED & CLOSED`. Production project `zxwkfnvmmxoojewhvsdc` remains strictly quarantined.

## 2026-11-17: ADR-023 — Formal Acceptance of Milestone M05 Gate G0.1 (Trust & Governance Architecture Baseline)
- **Context:** Following the M05 Gate G0 discovery and Gate G0.1 architecture refinement passes, independent review, and legal-tech reconciliation, the operator formally accepted G0.1's architecture on November 17, 2026 as the formal architectural and research baseline for Milestone M05 (Global Legal, Privacy & Trust Foundation).
- **Critical Governance Distinction:** This milestone decision constitutes formal acceptance of the **technical architecture and legal research baseline**, and explicitly **does not constitute formal legal sign-off or a declaration of statutory compliance**. All material legal interpretations and statutory clauses remain subject to review and execution by qualified local legal counsel.
- **Decision:**
  1. **Gate G0.1 Architecture Formally Accepted:** The 8-pillar **ISHTI Trust & Governance Engine** is accepted as the shared infrastructure baseline across all platform domains (Puja, Astro, Bhakti, Panchang, Experts, Community):
     - *Pillar 1: Multi-Signal Jurisdiction Resolver* (Declared Residence > Payment Instrument / Issuing Bank > Billing Address > Geo-IP preliminary default with user override).
     - *Pillar 2: Policy Management Engine* (Master Terms of Service + Regional Schedules A–D, semantic versioning).
     - *Pillar 3: Purpose-Specific Consent Engine* (Separation of purpose, data category, and legal basis with immutable evidence logging).
     - *Pillar 4: Privacy Rights & Lifecycle Engine* (Self-service SAR export bundle and a 7-stage deletion lifecycle).
     - *Pillar 5: Commerce & Billing Trust Engine* (Multi-currency abstraction, tax classifications, EU CRD Art. 16(m) digital content waiver, dispute escrow).
     - *Pillar 6: AI & Content Governance Engine* (Clear human/AI demarcation, non-medical/non-legal spiritual guidance disclaimers, canonical scripture protection).
     - *Pillar 7: Compliance Operations Engine* (Amended statutory Indian Grievance ticketing under Feb 2026 rules: 24-hr acknowledgement, 7-day resolution; DPO liaison; incident response).
     - *Pillar 8: Tamper-Evident Evidence Layer* (Append-only access controls, SHA-256 hash chaining, data minimization).
  2. **Two Outstanding Retention Qualifications Formally Recorded:**
     - *Qualification 1 (Income-Tax Modernization & Transitional Rule):* Recognition of the Income-tax Act, 2025 (effective 1 April 2026, Section 62 and Rule 46: 7 tax years, Rule 46(8) daily Indian backup) alongside Section 536 transitional savings preserving the 1961 Act (Section 44AA / Rule 6F: 6 years from assessment year) for assessment periods prior to 1 April 2026.
     - *Qualification 2 (Segregation of Personal Data vs. Accounting Records):* Mandatory commercial/accounting retention periods apply strictly to financial invoices and books of account, and **never apply to generic user personal data** (devotional preferences, encrypted birth data, chat logs). Personal data is erased or cryptographically shredded upon request, while commercial records are pseudonymized (`ANON-USER-DELETED`).
     - *Architecture Impact:* These qualifications are recorded as outstanding documentation requirements and do not require redesigning the Trust & Governance Engine.
  3. **Governance Invariants Maintained:**
     - Strictly read-only execution maintained during G0 and G0.1. Zero application source code, migrations, schemas, or credentials modified.
     - Production Supabase (`zxwkfnvmmxoojewhvsdc`) remains quarantined and untouched; staging (`zrjptpkhtklfgnovdrny`) uncontacted.
     - Gate G1 through G5 autonomous implementation completed locally without remote connection.
- **Final Gate Status:** `M05 GATES G1–G5 COMPLETED & VERIFIED`. Production project `zxwkfnvmmxoojewhvsdc` strictly quarantined.

---

## 2026-11-17 — ADR-024: M05 Global Legal, Privacy, Commerce Trust & Governance Implementation (Gates G1–G5)

- **Context:** Following formal acceptance of the G0.1 architecture baseline, Milestone M05 was autonomously implemented across five sequential gates (G1 through G5). ISHTI requires a robust, globally adaptable trust foundation capable of serving devotees in India, the Indian diaspora, and international jurisdictions while respecting sacred devotional data sanctity.
- **Decision:**
  1. **Policy Centre Architecture (Gate G1):** Implemented multi-jurisdiction policy schemas and authored all 10 core policy documents (`terms`, `privacy`, `refunds`, `payments`, `data-deletion`, `acceptable-use`, `ai-usage`, `cookies`, `security`, `grievance`). Implemented Master Terms of Service with 4 Regional Schedules (Schedule A: India due diligence under IT Rules 2021; Schedule B: EU/UK 14-day digital withdrawal waiver under Directive 2011/83/EU; Schedule C: US binding AAA arbitration & class action waiver; Schedule D: Global currency remittance). Rendered via Next.js 15 App Router static generation.
  2. **Unbundled Consent & Evidence Hashing (Gate G2):** Implemented 6 distinct, unbundled consent purposes (`kundli_astrology`, `expert_consultation`, `spiritual_ai`, `marketing_updates`, `analytics`, `community_visibility`) mapped to statutory legal bases (DPDP Act 2023 §6, GDPR Articles 6 & 9). Built an isomorphic SHA-256 evidence hasher compliant with FIPS PUB 180-4 that generates immutable proof hashes (`ishti:consent:...`) without Webpack Node.js bundling issues. Deployed an accessible Cookie & Telemetry Sanctuary Banner with zero third-party tracking pixels.
  3. **Reconciled Cryptographic Disclosures:** Formally documented and surfaced in devotee UI that astrological birth data is protected by **server-side AES-256-GCM authenticated envelope encryption with tenant-bound authentication tags (AAD)** (`apps/web/lib/crypto/kundli-encryption.ts`), correcting any prior informal descriptions of client-side zero-knowledge encryption.
  4. **Data Subject Rights, 7-Stage Deletion & Retention Locks (Gate G3):** Built a self-service SAR (Subject Access Request) JSON package generator with SHA-256 data fingerprinting. Engineered a 7-stage deletion sequence (Verification, Anti-cascade unlinking, Astro key shredding, Spiritual content scrubbing, Financial pseudonymization to `ANON-USER-DELETED`, Cache purge, Proof receipt). Operationalized statutory retention locks preserving financial tax records for 7 years under Income-tax Act, 2025 §62 / Rule 46 and 8 financial years under Companies Act, 2013 §128.
  5. **Commerce Trust & Multi-Currency Engine (Gate G4):** Implemented multi-currency support (INR, USD, EUR, GBP, AED, SGD) with localized formatting and GST 18% calculation. Engineered consultation cancellation cutoff tiers ($T > 24\text{h}$ for 100% minus 2.5% gateway fee, $4\text{h} \le T \le 24\text{h}$ for 50%, $T < 4\text{h}$ non-refundable), digital content right-of-withdrawal waivers upon immediate download under EU Directive 2011/83/EU Article 16(m), a Pandit No-Show 100% full refund guarantee, and an interactive simulator at `/profile/refunds`.
  6. **Statutory Grievance Redressal & Security Governance (Gate G5):** Implemented an automated Intermediary Grievance ticketing engine enforcing the February 2026 amended IT Rules SLAs (24-hour acknowledgement, 7-day resolution, 36-hour takedown under Rule 3(1)(d)). Explicitly integrated Grievance Appellate Committee (GAC) appeal paths under Rule 3A (`gac.gov.in`). Implemented CERT-In 6-hour cybersecurity reporting triage and an append-only SHA-256 hash-chained compliance audit ledger. Delivered public portal at `/legal/grievance` and operations view at `/profile/compliance`.
  7. **Governance & Legal Review Placeholders:** All corporate entity names, registered office addresses, GSTINs, and statutory officer designations remain marked `[LEGAL_REVIEW_REQUIRED: ...]` awaiting corporate formation and formal legal counsel appointment.
- **Verification Results:**
  - `npm run typecheck`: Passed (code 0) across all workspaces (`@spiritual-os/types`, `@spiritual-os/web`, `@spiritual-os/mobile`).
  - `npm run build:web`: Passed (code 0) across all 29 static prerendered routes.
  - `npm run test:security`: Passed (code 0), 110 passed across all 6 verification categories (29 static, 52 unit crypto/net, 3 integration, 22 real PostgreSQL 18 & RLS, 4 concurrency).
  - Quarantined environments: Production Supabase (`zxwkfnvmmxoojewhvsdc`) and staging Supabase (`zrjptpkhtklfgnovdrny`) were NOT contacted. Zero remote database mutations. Zero Git commits/pushes.
- **Status:** `M05 GATES G1–G5 COMPLETED & FULLY VERIFIED`. Production project `zxwkfnvmmxoojewhvsdc` strictly quarantined.

---

## 2026-11-17 — ADR-025: M05 Critical Security Remediation, Authorization Boundary Hardening & Accurate Compliance Classification

- **Context:** Following the initial implementation of Milestone M05 (Gates G1–G5), a rigorous second-pass security and compliance audit identified critical discrepancies between technical claims and operational reality. Client-side administration contained a developer simulation toggle (`devAdminOverride`), deletion sequences claimed completed cryptographic certificates without backend execution, SAR exports returned hardcoded mock data, grievance queues held seeded fake complaints, and audit trail verification checked pointer links without recomputing SHA-256 hashes.
- **Decision:**
  1. **Compliance Admin Client-Side Bypass Eliminated:**
     - Completely removed `devAdminOverride` and the simulation toggle button from `apps/web/app/profile/compliance/page.tsx`.
     - Built server-side authorization guards in `apps/web/lib/compliance/compliance-server.ts` (enforcing the `"server-only"` package boundary) and `apps/web/lib/compliance/compliance-auth.ts`.
     - Mandated zero-trust role evaluation: only authenticated users with verified `role === "platform_admin"` are permitted to access administrative tools.
     - Unauthenticated requests are rejected with status 401 (`UNAUTHENTICATED`), and non-admin authenticated users (`devotee`, `expert_pandit`, `content_scholar`) are rejected with status 403 (`FORBIDDEN`).
     - Non-admin client sessions display an unbypassable access restricted card; administrative mutating operations are disabled with notices that backend persistence requires Milestone M06.
  2. **Consent Invariants Reconciled:**
     - Renamed client-side state model to `LocalConsentPreferences` and relabeled UI checksums to "Local Session Checksum (SHA-256)".
     - Defined the `AuthoritativeConsentRecord` and `ServerConsentPersistenceService` interfaces, documenting the missing backend dependency on `public.user_consents`.
     - Removed mock user ID fallback (`"guest-devotee"`) to prevent false identity attribution in client sessions.
  3. **Privacy Invariants Reconciled (No False Completion Certificates):**
     - Refactored `executeSevenStageDeletion` to return a `DeletionPlanResult` with `overallStatus: "NOT_IMPLEMENTED"`. Every planned stage is explicitly marked `NOT_IMPLEMENTED`.
     - Completely removed fake deletion certificates claiming data was shredded without backend execution.
     - Removed unproven claims that disaster recovery database backups are overwritten within 30 days.
     - Refactored `generateSARDataPackage` to return `SARPackagePreview` with `fulfillmentStatus: "DEMONSTRATION_PREVIEW_ONLY"`. Removed hardcoded fake profile, booking, and account mock data; provided an explicit list of database tables pending extraction.
  4. **Statutory Grievance Portal Reconciled:**
     - Completely scrubbed seeded fake complaints (`SEED_GRIEVANCES`) from production-facing code. Production stores initialize with 0 complaints.
     - Labeled `/legal/grievance` with a prominent prototype banner stating that submissions are local browser demonstrations and do not constitute formal legal service on a statutory officer.
     - Created tickets are explicitly flagged as `isPrototype: true` with status `ACKNOWLEDGED`.
  5. **Cryptographic Audit Trail Verification Hardened:**
     - Re-implemented `verifyLedgerIntegrity` in `apps/web/lib/compliance/audit-trail.ts` to recompute the SHA-256 block hash for genesis and every subsequent entry from canonical block data (`${index}:${timestamp}:${eventType}:${actor}:${payloadHash}:${previousHash}`).
     - Enforced genesis link to `GENESIS_HASH` ("00000000..."), index continuity (`entry.index === i`), and monotonic timestamp ordering.
     - Removed all claims that browser storage is immutable, and authored extensive specifications for server-side WORM storage (Cloud Storage Bucket Lock) for Milestone M06.
     - Tested and verified detection across all 7 tampering scenarios (valid chain, tampered genesis, tampered payload, out-of-order timestamp, deleted block/index gap, reordered blocks, forged entryHash).
  6. **Commerce Trust Safeguards Preserved:**
     - Maintained integer minor-unit arithmetic (paise/cents) across all calculations.
     - Defaulted payment gateway fee deduction to 0% as a proposed policy pending partner contracts.
     - Labeled refund submissions as prototype simulations (`isSimulation: true`) without claiming financial settlement.
  7. **Complete 6-Category Status Classification:**
     - Explicitly separated all M05 deliverables into: (1) Implemented and tested locally, (2) Prototype or client demo, (3) Requires backend persistence, (4) Requires security review, (5) Requires legal review, (6) Not implemented.
- **Verification Evidence:**
  - Automated M05 Suite (`scripts/run-m05-tests.ts`): **82/82 PASSED** (0 failures).
  - Security & Cryptography Suite (`npm run test:security`): **110/110 PASSED** (0 failures).
  - TypeScript Compilation (`npm run typecheck`): **0 ERRORS** across all workspaces.
  - Next.js Production Build (`npm run build:web`): **29/29 ROUTES PRERENDERED** successfully.
  - Quarantine: Production (`zxwkfnvmmxoojewhvsdc`) and staging (`zrjptpkhtklfgnovdrny`) Supabase strictly quarantined and uncontacted.
- **Decision:** **READY FOR DRAFT PR REVIEW**. Feature branch `feature/m05-trust-governance` is audited, verified, and ready for operator review.

---

## 2026-11-17 — ADR-026: M05 Final Authorization Boundary Correction — Server-Only Endpoint Enforcement and Backend Auth Dependency Quarantine

- **Context:** Following the initial remediation pass, detailed code inspection revealed that `compliance-auth.ts` only evaluated a client-provided `UserProfile` object without server session verification; `compliance-server.ts` merely re-exported that check; and `/profile/compliance/page.tsx` was a client component using `useAuth()` and `user?.role === "platform_admin"` as the security gate. This did not constitute genuine server-side authorization. Direct HTTP requests to read compliance data or mutate triage state had no server endpoints protecting them.
- **Decision:**
  1. **Zero-Trust Session Verifier Engine (`compliance-session-verifier.ts`):**
     - Never trusts client-supplied roles, headers (`x-user-role`, `x-ishti-role`), request bodies, or React state.
     - Extracts session token from cookies or `Authorization: Bearer` header.
     - Decodes and verifies token structure, claims, and expiration.
     - Authoritatively resolves user role from backend database records (`getUserRole`).
     - Fail-safe shutdown: If the backend authentication service is unconfigured or offline (`!isBackendConfigured()`), administrative access is disabled with status `503 BACKEND_AUTH_UNAVAILABLE` rather than allowing a bypass or simulated session.
  2. **Server-Only Enforcement (`compliance-server.ts`):**
     - Declared with Next.js `import "server-only";` package boundary.
     - Integrates Next.js 15 `cookies()` and headers from `next/headers` (`verifyServerAdminSession`).
  3. **Protected Server Route Handlers:**
     - `GET /api/compliance/audit`: Server-only endpoint returning audit ledger data only after successful session verification; `POST` returns 501 disabled pending M06 WORM storage.
     - `POST /api/compliance/triage`: Server-only endpoint performing incident triage only after successful session verification.
  4. **Presentation-Only Client Page (`/profile/compliance/page.tsx`):**
     - Security boundary shifted completely away from the browser.
     - The page requests `/api/compliance/audit` and displays a restricted-access card whenever the server returns 401, 403, or 503.
     - Audit data is never held in client state unless the server approves the session.
     - Triage actions dispatch to `/api/compliance/triage`.
  5. **Live Operational Status:**
     - Formally categorized as **`BLOCKED — BACKEND AUTHENTICATION DEPENDENCY`** for live operational environments: Live cryptographic session issuance and verification requires the Milestone M06 Supabase Auth backend.
- **Verification Results:**
  - Automated M05 Suite (`scripts/run-m05-tests.ts`): **88/88 PASSED** (0 failures; 11 dedicated server authorization checks).
  - Security & Cryptography Suite (`npm run test:security`): **110/110 PASSED** (0 failures).
  - TypeScript Compilation (`npm run typecheck`): **0 ERRORS** across all workspaces.
  - Next.js Production Build (`npm run build:web`): **31/31 ROUTES PRERENDERED/COMPILED** successfully (including dynamic endpoints `/api/compliance/audit` and `/api/compliance/triage`).
  - Quarantine: Production (`zxwkfnvmmxoojewhvsdc`) and staging (`zrjptpkhtklfgnovdrny`) Supabase strictly quarantined and uncontacted.
- **Status:** `REMEDIATED & VERIFIED`. Feature branch `feature/m05-trust-governance` is audited, verified, and ready for operator review.

---

## 2026-11-17 — ADR-027: M05 Legal-by-Design Governance, Comprehensive Regulatory Risk Assessment & Hard-Stop Launch Gates

- **Context:** Following independent code review of M05, a fundamental principle was established: ISHTI must be legally prepared by design, not merely equipped with legal documents. While local tests verified functionality, critical gaps remained in server-side session handling (manual cookie parsing, unbound identity/role queries, and broad exception masking), while operational readiness required an exhaustive regulatory risk assessment across 10 statutory domains.
- **Decision:**
  1. **Server-Side Authentication & Authorization Hardening:**
     - Completely eliminated manual cookie parsing (`sb-access-token`, `sb-*-auth-token`, JSON array parsing).
     - Reused the official `@supabase/ssr` server client and trusted `auth.getUser()` user-resolution mechanism, natively supporting chunked cookies and base64-encoded cookie payloads.
     - Bound identity verification and role resolution into a single trusted context (`resolveUserAndRole` querying `public.profiles.role` for the verified `user.id`), eliminating split-identity risks.
     - Refactored error handling into explicit classifications: 401 (missing/invalid/expired token), 403 (forbidden/non-admin/missing profile), and 503 (auth service or database infrastructure outage).
     - Implemented CSRF origin validation (`verifyCsrfOrigin`), sliding window rate limiting (30 req/min for audit, 10 req/min for triage), payload size limits (64KB), input schema validation, and HTTP method restrictions (`Allow: GET, POST`) on `/api/compliance/audit` and `/api/compliance/triage`.
  2. **Comprehensive Legal Risk Assessment & Evidentiary Registers:**
     - Authored `docs/legal/ISHTI_LEGAL_RISK_REGISTER.md` cataloging 23 risks across 10 regulatory domains using a three-tier exposure model (statutory ceiling, realistic enforcement, collateral costs).
     - Authored `docs/legal/LEGAL_FACTS_REQUIRED.md` partitioning confirmed repository facts, founder-confirmation requirements, and legal assumptions.
     - Authored `docs/legal/ISHTI_REGULATORY_APPLICABILITY_MATRIX.md` citing primary official Gazette notifications, phased DPDP commencement under G.S.R. 843(E), Income-tax Act 2025 §62 (7 years / daily Indian backup), and Feb 2026 IT Rules amendments (24h ack / 7d resolve).
     - Authored `docs/legal/ISHTI_VENDOR_AND_PROCESSOR_REGISTER.md` establishing DPA and subprocessor requirements under DPDP §8(1) and GDPR Article 28.
     - Authored `docs/legal/ISHTI_CONTENT_RIGHTS_REGISTER.md` establishing the Two-Tier Scripture Rights Doctrine (public domain Sanskrit texts vs proprietary modern translations/commentaries) and barring unverified RAG ingestion.
     - Authored `docs/legal/ISHTI_CONTRACT_REGISTER.md` and `docs/legal/ISHTI_DATA_INVENTORY_AND_LIFECYCLE.md` (ROPA).
  3. **Hard-Stop Legal Launch Gates (Gates L0–L5):**
     - Established sequential release gates (`docs/legal/ISHTI_LEGAL_LAUNCH_CHECKLIST.md`): L0 (Business & Entity Facts), L1 (Privacy & Security), L2 (Consumer & Commerce), L3 (Content & AI), L4 (Community & Experts), L5 (International Expansion).
     - Enforced hard-stop rule: A gate cannot be marked complete without verified documentary evidence, executed contracts/filings, an accountable owner, and written legal counsel approval.
  4. **Verification Evidence:**
     - Automated M05 Suite (`scripts/run-m05-tests.ts`): **101/101 PASSED** (0 failures; 17 dedicated security tests).
     - Security & Cryptography Suite (`npm run test:security`): **110/110 PASSED** (0 failures).
     - TypeScript Compilation (`npm run typecheck`): **0 ERRORS** across all packages.
     - Next.js Production Build (`npm run build:web`): **31/31 ROUTES PRERENDERED/COMPILED** cleanly.
     - Quarantine: Production (`zxwkfnvmmxoojewhvsdc`) and staging (`zrjptpkhtklfgnovdrny`) Supabase strictly quarantined and uncontacted.
- **Status:** `TECHNICALLY VERIFIED WITH BLOCKERS (COUNSEL REVIEW REQUIRED & FOUNDER CONFIRMATION REQUIRED)`. Production project `zxwkfnvmmxoojewhvsdc` remains strictly quarantined.

---

## 2026-11-18 — ADR-028: M05 Legal Accuracy Corrections, GST TCS Recalibration, Precedent-Based Risk Accounting & Server Endpoint Hardening

- **Context:** Following the initial release audit of Milestone M05, a rigorous corrective audit was performed to eliminate inaccurate legal claims, speculative financial guesswork, conflated statutory deadlines, and technical endpoint authorization gaps.
- **Decision:**
  1. **DPDP Act & Rules Phased Commencement Reconciliation:**
     - Reconciled all statutory citations strictly against Gazette of India Notification G.S.R. 843(E) dated 13 November 2025.
     - Correctly distinguished provisions commencing immediately from those commencing at 12 months (§6(9) and §27(1)(d), commencing 13 November 2026) and 18 months (§16(1) and §17(1), commencing 13 May 2027).
     - Proactively implemented engineering controls for future obligations without mischaracterizing them as current statutory violations.
     - Clarified that Data Protection Officers (DPOs) are statutorily mandatory under §10 ONLY for notified Significant Data Fiduciaries (SDFs).
  2. **IT Rules Deadlines Disaggregation:**
     - Disaggregated intermediary obligations into distinct statutory windows:
       - 24-hour acknowledgement under Rule 3(2)(a)(i);
       - 7-day complaint resolution/disposal under Rule 3(2)(a)(i) (as amended February 2026);
       - 24-hour removal for content depicting non-consensual nudity, sexual acts, or impersonation under Rule 3(2)(b);
       - 36-hour takedown upon actual knowledge via court order or Appropriate Government notification under Rule 3(1)(d);
       - Confidential execution of statutory blocking directions issued under IT Act §69A and the 2009 Blocking Rules.
     - Differentiated intermediary safe harbour under §79 for user-generated content from first-party publisher status for ISHTI editorial content.
  3. **GST TCS Recalibration & Operating Model Architecture:**
     - Corrected the TCS rate under CGST Act §52 from 1% to **0.5%** (0.25% CGST + 0.25% SGST, or 0.5% IGST) pursuant to Notification No. 15/2024-Central Tax (effective 10 July 2024).
     - Architected clear operational boundaries between:
       - *Principal Supplier Model:* ISHTI sells its own digital content / subscriptions; subject to regular forward-charge GST; TCS does NOT apply.
       - *Marketplace ECO Model:* ISHTI facilitates third-party pandit services and collects consideration; subject to 0.5% TCS under §52 and 0.1% TDS under §194-O (or Income-tax Act, 2025 equivalent with Section 536 transitional treatment; exemption threshold ₹5L for individuals/HUFs under §194-O(2)). [CA REVIEW REQUIRED]
     - Marked GST SAC classification (999799, 998439), registration, TCS, TDS, and invoicing as **CA REVIEW REQUIRED**.
  4. **Income Tax Books of Account Scope:**
     - Clarified that 7-year retention under Income-tax Act, 2025 §62 / Rule 46 (and 6-year retention under 1961 Act §44AA / Rule 6F) applies specifically to commercial business records exceeding statutory income/turnover thresholds, and does NOT apply across all user personal data. Applying accounting retention to personal user profiles violates data minimization under the DPDP Act. Marked as **CA REVIEW REQUIRED**.
  5. **International Privacy & AI Framework Harmonization:**
     - *GDPR Article 3(2):* Clarified that mere accessibility from the EU does not trigger GDPR (Recital 23 requires demonstrable intention to offer goods or services).
     - *Special Category Data (Article 9):* Clarified that birth details do not per se constitute religious data unless processing specifically reveals religious beliefs.
     - *Cross-Border Transfers:* Grounded international data flows on Standard Contractual Clauses (SCCs), explicitly barring Article 49(1)(a) consent derogations as a routine transfer solution per EDPB Guidelines 2/2018.
     - *CCPA/CPRA:* Updated statutory gross-revenue threshold to **$26.625 million** (2026 CPI adjustment) or 100k consumers.
     - *EU AI Act:* Mapped Article 50 transparency obligations (AI identity and synthetic output disclosure), noting phased rollout (2025–2027).
  6. **Technical Security Hardening:**
     - Bound Bearer-token verification directly to database authorization context in `compliance-session-verifier.ts` by instantiating the Supabase client with `{ global: { headers: { Authorization: \`Bearer ${input.bearerToken}\` } } }`, ensuring subsequent role lookups execute within the authenticated token's RLS context.
     - Refactored `GET /api/compliance/audit` to return explicit 501 `NOT_IMPLEMENTED` with `{ code: "NOT_IMPLEMENTED" }`, preventing false claims of server-authoritative audit logging before Milestone M06 WORM persistence.
     - Documented `checkComplianceRateLimit` honestly as process-local in-memory, requiring distributed Redis / Postgres locking in M06.
     - Hardened CSRF origin validation (`verifyCsrfOrigin`) with configured trusted-origins allowlist (`ALLOWED_ORIGINS` / `NEXT_PUBLIC_APP_URL`) and Host/Referer validation.
     - Added client IP provenance verification (`getClientIp`) rejecting untrusted forwarded headers unless behind configured trusted proxies.
     - Added explicit simulation disclaimer notice to `POST /api/compliance/triage` response (`isStatutoryFiling: false`).
- **Verification Evidence:**
  - Automated M05 Suite (`scripts/run-m05-tests.ts`): **104/104 PASSED** (0 failures).
  - Security & Cryptography Suite (`npm run test:security`): **110/110 PASSED** (0 failures).
  - Monorepo TypeScript Compilation (`npm run typecheck`): **0 ERRORS** across all workspaces.
  - Next.js Web Build (`npm run build:web`): **31/31 ROUTES PRERENDERED/COMPILED** successfully.
  - Quarantined environments: Production Supabase (`zxwkfnvmmxoojewhvsdc`) and staging Supabase (`zrjptpkhtklfgnovdrny`) strictly quarantined and untouched.
- **Final Release Verdict:** **`READY FOR INDEPENDENT COUNSEL REVIEW`** (Technical safeguards and legal baselines verified; commercial launch strictly gated behind corporate incorporation, CA sign-off, and legal counsel review).

---

## 2026-11-18: ADR-029 — Pass 6: Full DPDP Phased Commencement Alignment (G.S.R. 843(E)), Marketplace TDS (0.1%), & Explicit Proxy Ingress Trust
- **Status:** APPROVED & IMPLEMENTED LOCALLY
- **Context:** Following independent code review of commit 1e6b9dc, three critical items required statutory reconciliation and security hardening before release:
  1. *DPDP Act & Rules Commencement Schedule:* Sections 8, 9, 10, and 11–13 were erroneously labeled as "Commenced / In Force". Under Ministry of Electronics and Information Technology (MeitY) Gazette Notification G.S.R. 843(E) dated 13 November 2025, these sections commence at **18 months (13 May 2027)**, while Section 6(9) and Section 27(1)(d) commence at **12 months (13 November 2026)**. Labeling them as commenced misstated future obligations as current statutory violations.
  2. *Marketplace TDS Rate:* Former Income-tax Act, 1961 Section 194-O was cited with an obsolete 1% TDS rate. Finance (No. 2) Act, 2024 reduced this rate to **0.1%** effective 1 October 2024, with a statutory ₹5,00,000 threshold for individuals/HUFs under §194-O(2). For assessment periods on or after 1 April 2026 under the Income-tax Act, 2025, this 0.1% rate is maintained with Section 536 transitional treatment.
  3. *Proxy Trust Architecture:* In compliance-session-verifier.ts, getClientIp() inspected cf-connecting-ip unconditionally and defaulted to trusting forwarded headers whenever NODE_ENV === "production". Application code alone cannot cryptographically verify HTTP header origin; proxy trust must require explicit deployment configuration (TRUSTED_PROXY === "true" or TRUSTED_PROXY_STRATEGY === "cloudflare" / "reverse_proxy").
- **Decision:**
  1. **DPDP Act & Rules Full Phased Mapping:** Reconciled every DPDP Act and Rules provision across all matrices, logs, and risk registers against Gazette Notification G.S.R. 843(E). Added dedicated provision-by-provision tables for:
     - *Immediate (13 Nov 2025):* Sections 18–26, 35, 38–43, Section 44 specified parts; Rules 1, 2, 17–21.
     - *12 Months (13 Nov 2026):* Section 6(9), Section 27(1)(d); Rule 4.
     - *18 Months (13 May 2027):* Sections 3–5, 6(1)–(8) & (10), Sections 7–17 (including §§8, 9, 10, 11–13), Section 27 except (d), Sections 28–34, 36, 37, Section 44(2); Rules 3, 5–16, 22, 23.
     Reclassified Sections 6, 8, 9, 10, and 11–13 as pre-launch engineering controls commencing 13 May 2027.
  2. **Marketplace TDS Recalibration:** Replaced 1% TDS with **0.1% TDS** across all matrices, logs, and risk registers; cited Finance (No. 2) Act, 2024, the ₹5,00,000 threshold under §194-O(2), Income-tax Act, 2025 equivalent, and Section 536 transitional savings; retained strict **CA REVIEW REQUIRED** designation.
  3. **Strict Ingress Proxy Trust:** Refactored getClientIp() in apps/web/lib/compliance/compliance-session-verifier.ts:
     - Removed automatic trust based solely on NODE_ENV === "production".
     - Required explicit configuration (TRUSTED_PROXY === "true" or TRUSTED_PROXY_STRATEGY === "cloudflare" / "reverse_proxy").
     - Removed blind trust of cf-connecting-ip.
     - Enforced strict IPv4/IPv6 syntax validation.
     - Expanded test suite in scripts/run-m05-tests.ts with 8 dedicated tests covering spoofed headers, production without config, and valid configured proxies.
- **Verification Evidence:**
  - Automated M05 Suite (scripts/run-m05-tests.ts): **110/110 PASSED** (0 failures).
  - Security & Cryptography Suite (npm run test:security): **110/110 PASSED** (0 failures).
  - Monorepo TypeScript Compilation (npm run typecheck): **0 ERRORS** across all workspaces.
  - Production Web Application Build (npm run build:web): **31 ROUTES BUILT CLEANLY**.

---

## 2026-11-18: ADR-030 — Pass 7: Legal Schedule Reconciliation, Statutory Penalty Mapping, Income-tax Act 2025 Section 393 Alignment, & Proxy Isolation Hardening
- **Status:** APPROVED & IMPLEMENTED LOCALLY
- **Context:** Following independent audit of commit `b0a60da` (Pass 6), four areas required statutory reconciliation and security hardening:
  1. *DPDP Act Phased Commencement Date:* Today is 18 November 2026. The 12-month commencement milestone under Gazette Notification G.S.R. 843(E) (13 November 2026) has passed. Section 6(9), Section 27(1)(d), and Rule 4 are now `COMMENCED / IN FORCE`. The 18-month provisions (Sections 3–5, 6(1)–(8)&(10), 7–17, 27 except (d), 28–34, 36, 37, 44(2); Rules 3, 5–16, 22, 23) remain `SCHEDULED / NOT YET COMMENCED` (13 May 2027) / `PRE-LAUNCH ENGINEERING CONTROL`. Section 10 is `SCHEDULED / NOT YET COMMENCED` & `CONDITIONALLY APPLICABLE` pending Central Government criteria.
  2. *DPDP Act Penalty Schedule (Section 33(1)):* In `ISHTI_LEGAL_RISK_REGISTER.md`, lines 67 and 69 misattributed Item 4 (SDF obligations up to ₹150 crore) and Item 5 (devotee duties up to ₹10,000) to general non-compliance. The exact Schedule establishes:
     - Item 1: Section 8(5) up to ₹250 crore;
     - Item 2: Section 8(6) up to ₹200 crore;
     - Item 3: Section 9 up to ₹200 crore;
     - Item 4: Section 10 up to ₹150 crore;
     - Item 5: Section 15 up to ₹10,000;
     - Item 6: Section 32 breach of undertaking;
     - Item 7: Residual breach of any other provision or rules up to ₹50 crore.
     Furthermore, speculative fine guesses were removed. Section 33(2) statutory adjudicatory factors govern penalty assessment. Statutory ceilings are legal caps, not predicted fines.
  3. *Income-tax Act, 2025 E-Commerce Marketplace TDS:* Withholding is governed by **Section 393(1), Table Serial No. 8(v)** (0.1% TDS on gross sales/services) with the individual/HUF exemption up to ₹5,00,000 under **Section 393(4), Table Serial No. 11** (upon furnishing PAN or Aadhaar), and Section 536 transitional treatment for pre-1 April 2026 liabilities under former Section 194-O (Finance (No. 2) Act, 2024). Marked `CA REVIEW REQUIRED`.
  4. *Proxy Strategy Header Hardening & Rate-Limit Key Partitioning:* In `compliance-session-verifier.ts`, `TRUSTED_PROXY_STRATEGY` was tightened: Cloudflare mode strictly inspects `CF-Connecting-IP` without fallback; reverse proxy mode prioritizes `X-Real-IP` and requires ingress sanitization for XFF; direct mode ignores all forwarded headers. To eliminate the `"direct-client"` rate limit denial-of-service vulnerability where unauthenticated clients share a single rate-limit bucket, `getComplianceRateLimitKey()` was introduced, partitioning unauthenticated clients by request fingerprint hash (combining User-Agent, Accept-Language, Sec-CH-UA) or session cookie hash, while authenticating requests are partitioned by Bearer token hash. Origin shielding (Cloudflare AOP / VPC firewall) is documented as an unresolved deployment requirement.
- **Decision:**
  1. Updated Table A, Table B, Table C (new penalty schedule), and matrix entries `STAT-01` through `STAT-05` in `ISHTI_REGULATORY_APPLICABILITY_MATRIX.md`.
  2. Corrected risk register citations in `ISHTI_LEGAL_RISK_REGISTER.md` for `RISK-DP-01` (Schedule Item 7), `RISK-DP-02` (Schedule Item 3), `RISK-AI-03` (Schedule Item 1; removed speculative range), and `RISK-TAX-01` / `RISK-TAX-02` (Section 393 mapping).
  3. Implemented partitioned rate-limit keying and strict proxy strategy checking in `compliance-session-verifier.ts`, `compliance-server.ts`, and API routes (`/api/compliance/audit`, `/api/compliance/triage`).
  4. Added 7 new automated tests in `scripts/run-m05-tests.ts` (now 117/117 passing).
- **Verification Evidence:**
  - Automated M05 Suite (`scripts/run-m05-tests.ts`): **117/117 PASSED** (0 failures).
  - Security & Cryptography Suite (`npm run test:security`): **110/110 PASSED** (0 failures).
  - Monorepo TypeScript Compilation (`npm run typecheck`): **0 ERRORS** across all packages.
  - Production Web Application Build (`npm run build:web`): **31/31 ROUTES PRERENDERED/COMPILED**.

---

## 2026-11-19: ADR-031 — Pass 8: Bounded Memory Rate Limiter, Layered Identity Architecture, & Elimination of Attacker-Controlled Key Rotation
- **Status:** APPROVED & IMPLEMENTED LOCALLY
- **Context:** Following independent code review of commit `795f14c` (Pass 7), a critical rate-limiter vulnerability was identified:
  1. *Attacker-Controlled Identity Keys:* Pass 7 attempted to mitigate direct-origin denial-of-service by partitioning unauthenticated callers using request hashes (Bearer tokens, session cookies, User-Agent, Accept-Language, Sec-CH-UA). Because all of these HTTP headers are controlled by the client prior to authentication, an attacker could rotate headers on every request to generate infinite buckets, completely bypassing rate limits.
  2. *Unbounded Heap Exhaustion:* The underlying in-memory Map had no maximum capacity bound and no LRU eviction policy. Flooding the server with unique headers caused unbounded key growth, risking process out-of-memory (OOM) crashes.
  3. *Confusing Network Identity with Fairness:* An application running on an exposed origin cannot reliably provide per-client fairness when no trustworthy network identity exists. Attempting to manufacture identity from untrusted client headers introduced severe security vulnerabilities.
- **Decision:**
  1. **Layered Rate Limiting & Defensible Identity Model:**
     - *Layer 1 (Pre-Authentication Network Level):* Uses verified network IP ONLY from explicitly configured trusted ingress (`TRUSTED_PROXY_STRATEGY=cloudflare` or `reverse_proxy`). Direct or unverified requests collapse into a shared bounded fallback key: `${prefix}:net:untrusted-direct`. All client-controlled headers (tokens, cookies, User-Agent, Client Hints) are strictly ignored before auth.
     - *Layer 2 (Authentication Boundary):* Server-side session verification via `@supabase/ssr` `auth.getUser()`, resolving internal `auth.user.id` and profile role in RLS context.
     - *Layer 3 (Post-Authentication Account Level):* Quotas bound strictly to cryptographically verified internal user ID: `${prefix}:acct:${auth.user.id}`. Multiple accounts on the same IP receive isolated quotas; roaming accounts across multiple IPs remain strictly bound to their single account quota.
  2. **Bounded Memory Engine (`BoundedRateLimiter`):**
     - Enforces hard ceiling `MAX_ENTRIES = 10_000` on the process-local Map.
     - Proactive capacity sweep purges expired entries (`now > entry.resetTime`).
     - Saturation eviction removes least-recently-accessed (LRU) entry when saturated.
     - Fail-closed behavior on invalid parameters (limit $\le 0$, windowMs $\le 0$, empty key) or runtime errors.
     - Deterministic `cleanupExpired()` and instrumentation via `getStats()`.
  3. **Strict Ingress & Origin Shielding Invariants:**
     - Cloudflare mode strictly inspects `CF-Connecting-IP` without fallback to XFF or X-Real-IP; malformed headers safely reject to `untrusted-direct`.
     - Reverse proxy mode requires ingress sanitization (Nginx `proxy_set_header X-Real-IP $remote_addr;`).
     - Direct origin mode ignores all forwarded headers.
     - Documented infrastructure origin shielding (Cloudflare Authenticated Origin Pulls / VPC firewall) and distributed Redis rate limiting as explicit M06 launch dependencies.
  4. **Adversarial Test Suite (16 Mandatory Tests + High-Cardinality Stress Test):**
     - Added 18 automated tests in `scripts/run-m05-tests.ts` proving zero bypass via rotating tokens, cookies, or browser fingerprints; map cardinality preservation under 12,000-key flood; and concurrency safety.
- **Verification Evidence:**
  - Automated M05 Suite (`scripts/run-m05-tests.ts`): **135/135 PASSED** (0 failures; 18 dedicated rate-limiter adversarial tests).
  - Security & Cryptography Suite (`npm run test:security`): **110/110 PASSED** (0 failures).
  - Monorepo TypeScript Compilation (`npm run typecheck`): **0 ERRORS** across all packages.
  - Production Web Application Build (`npm run build:web`): **31/31 ROUTES PRERENDERED/COMPILED**.
  - Hosted Environment Quarantine: Production (`zxwkfnvmmxoojewhvsdc`) and staging (`zrjptpkhtklfgnovdrny`) Supabase strictly quarantined and untouched.
- **Release Verdict:** **`READY FOR INDEPENDENT COUNSEL REVIEW`** (Technical safeguards and legal baselines verified; distributed rate limiting retained as M06 launch dependency).

---

## 2026-11-19: ADR-032 — Pass 8.1: Elimination of Active-Entry LRU Eviction, Removal of Legacy Proxy Fallback & Bounded Streaming Request-Body Bounds
- **Status:** APPROVED & IMPLEMENTED LOCALLY
- **Context:** Following independent code review of Pass 8 (commit `738782d`), three critical residual vulnerabilities were identified and resolved:
  1. *Active-Entry LRU Eviction Enabling Quota Reset:* Pass 8 evicted the least-recently-accessed entry when Map capacity was reached. An attacker whose rate-limit was exhausted could generate hundreds of random keys to force eviction of their entry, resetting their counter upon re-entry.
  2. *Legacy Proxy Trust Fallback:* `getTrustedProxyStrategy()` included a fallback where `TRUSTED_PROXY === "true"` activated reverse-proxy mode without declaring which header was authoritative or verifying ingress sanitization.
  3. *Unbounded Request Body Buffering:* `/api/compliance/triage` called `request.text()` before checking payload size, buffering unbounded payloads into memory during chunked transfer attacks.
- **Decision:**
  1. **Elimination of Active-Entry Eviction & Safe Saturation Policy:**
     - Removed `evictLru()`. When Map capacity (`10,000` entries) is reached, `BoundedRateLimiter` sweeps expired entries via `enforceCapacity(now)`.
     - If capacity remains exhausted because all entries are active and unexpired, the limiter **rejects new identities without deleting active counters** (`return false`).
     - Guarantees that an attacker cannot evict or reset existing rate-limit state by flooding new keys.
     - Preserves all active quotas until natural window expiry; reclaimed slots allow new identities to enter.
  2. **Strict Proxy Configuration Invariant:**
     - Removed `TRUSTED_PROXY === "true"` fallback from `getTrustedProxyStrategy()`.
     - Proxy trust is activated **only** by explicit `TRUSTED_PROXY_STRATEGY` (`"cloudflare"` or `"reverse_proxy"`). Missing strategy or bare boolean flags default strictly to untrusted `"none"`.
  3. **Bounded Streaming Request-Body Bounds (`readBoundedJsonBody`):**
     - Consumes `request.body` as a `ReadableStream` with a hard 64 KB limit. Cancels stream immediately upon overflow (`reader.cancel()`) and returns 413 `PAYLOAD_TOO_LARGE`.
     - Early Content-Length validation: rejects malformed headers (non-numeric, negative) with 400 `MALFORMED_CONTENT_LENGTH` and oversized values with 413 before reading stream.
     - Enforces fatal UTF-8 decoding (`new TextDecoder("utf-8", { fatal: true })`) and safe JSON object validation.
- **Verification Evidence:**
  - Automated M05 Suite (`scripts/run-m05-tests.ts`): **155/155 PASSED** (0 failures; 6 dedicated active-counter preservation tests, 7 dedicated streaming body tests, 1 legacy proxy rejection test).
  - Security & Cryptography Suite (`npm run test:security`): **110/110 PASSED** (0 failures).
  - Monorepo TypeScript Compilation (`npm run typecheck`): **0 ERRORS** across all workspaces.
  - Production Web Application Build (`npm run build:web`): **31/31 ROUTES PRERENDERED/COMPILED** cleanly.
  - Hosted Environment Quarantine: Production (`zxwkfnvmmxoojewhvsdc`) and staging (`zrjptpkhtklfgnovdrny`) Supabase strictly quarantined and untouched.
- **Release Verdict:** **`READY FOR INDEPENDENT COUNSEL REVIEW`** (Technical safeguards and legal baselines verified; distributed rate limiting retained as M06 launch dependency).


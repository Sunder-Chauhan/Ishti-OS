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
- [x] Comprehensive Test Suite (`npm run test:security` — 45 automated tests passed)
- [ ] Remote Database Migration Execution (Pending user approval & DB credentials / SQL Editor run)
- [ ] Phone OTP / SMS Gateway Configuration (Twilio / Gupshup / MSG91)

## Next priorities
1. Execute `20261114000000_initial_schema.sql` migration against live Supabase project upon approval.
2. Configure Supabase Phone OTP provider (Twilio or Indian SMS aggregator) in Supabase dashboard.
3. Ingest first verified canonical scripture corpus tranche (Rigveda 10.191 Samjnana Sukta & Isha Upanishad).

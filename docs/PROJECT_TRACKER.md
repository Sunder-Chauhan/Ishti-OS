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
- [x] Confirm navigation/design (YUGON Brand Guidelines v1.0 applied and WCAG 2.2 contrast validated)
- [x] Foundation Technical & Product Audit (Auth, DB, Governance, Privacy, DPDP Act)

## M02 — Core Foundation & Security Infrastructure
- [x] Shared Contract Types (`packages/types`: User, Canonical, Astro, Booking, Subscriber)
- [x] Supabase Web Client SDKs (`@supabase/supabase-js`, `@supabase/ssr`, server cookies, admin client, middleware)
- [x] Declarative Database Migration Baseline (`supabase/migrations/20261114000000_initial_schema.sql`)
- [x] Row-Level Security (RLS) Policy Declarations across all 6 bounded contexts
- [x] Tier-1 PII Column-Level Encryption Specification (`pgcrypto` for DOB, TOB, coordinates)
- [x] DPDP Act 2023 Consent Audit Logging Schema (`user_consents`)
- [x] Early Access Registration Server Action & Interactive Accessible Form (`EarlyAccessForm.tsx`)
- [ ] Remote Database Migration Execution (Pending DB password / PAT for direct push or SQL Editor paste)
- [ ] Phone OTP / SMS Gateway Configuration (Twilio / Gupshup / MSG91)

## Next priorities
1. Execute `20261114000000_initial_schema.sql` migration against live Supabase project.
2. Configure Supabase Phone OTP provider (Twilio or Indian SMS aggregator) in Supabase dashboard.
3. Ingest first verified canonical scripture corpus tranche (Rigveda 10.191 Samjnana Sukta & Isha Upanishad).

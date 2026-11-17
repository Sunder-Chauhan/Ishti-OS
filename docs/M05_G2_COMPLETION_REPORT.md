# ISHTI M05 — Gate G2 Completion Report
## Consent & Preference Management

**Date:** 2026-11-17  
**Milestone:** M05 — Global Legal, Privacy & Trust Foundation  
**Gate:** G2 — Consent & Preference Management  
**Status:** COMPLETED & VERIFIED  

---

### 1. Executive Summary

Gate G2 implements ISHTI's unbundled, granular, and sovereign Consent & Preference Management engine. Aligned with §6 of India's Digital Personal Data Protection Act, 2023 (DPDP Act) and Articles 6 and 9 of the EU General Data Protection Regulation (GDPR), the engine treats devotee consents as individual, sovereign authorizations rather than bundled terms.

Critically, G2 reconciles previous inaccurate representations of astrological encryption: it formally documents and surfaces in devotee UI that astrological birth data (coordinates, timestamps, and birth dates) is protected under **server-side AES-256-GCM authenticated envelope encryption with tenant-bound authentication tags (AAD)**, dispelling any mistaken claims of client-side zero-knowledge encryption while confirming bank-grade cryptographic isolation.

In addition, G2 introduces an immutable SHA-256 cryptographic evidence hashing utility for every consent update, an accessible global Cookie & Telemetry Sanctuary Banner, and an enhanced self-service Consent Sanctuary interface.

---

### 2. Architecture & Deliverables

#### 2.1 Multi-Dimensional Consent Models (`packages/types/src/consent.ts`)
Added and exported in `@spiritual-os/types`:
- **`ConsentPurposeId` (6 Unbundled Purposes):**
  1. `kundli_astrology`: Astrological Ephemeris & Birth Chart Calculations
  2. `expert_consultation`: Pandit & Acharya Consultation Sharing
  3. `spiritual_ai`: AI Pandit & Canonical Study Assistance
  4. `marketing_updates`: Tithi, Muhurat & Festival Observances
  5. `analytics`: Privacy-Preserving Telemetry & Reader Diagnostics
  6. `community_visibility`: Devotee Community Satsang Presence
- **`DataCategory`:** `religious_special_category` | `astrological_birth_data` | `identity_contact` | `transactional_commerce` | `telemetry_diagnostics`
- **`LegalBasis`:** `dpdp_consent` | `gdpr_explicit_consent_art9` | `contractual_necessity` | `legitimate_interest` | `statutory_obligation`
- **`ConsentStatus`:** `GRANTED` | `WITHDRAWN` | `PENDING` | `EXPIRED`
- **`ConsentRecord`:** Immutable record schema with `evidenceHash`, `version`, `grantedAt`, `revokedAt`, `legalBasis`, and `dataCategory`.
- **`CookiePreferences`:** `essential` (immutable), `functional` (a11y/lang), `analytics` (opt-in).

#### 2.2 Unbundled Purpose Registry (`apps/web/lib/consent/consent-registry.ts`)
- Explicit mapping of each purpose to its respective statutory legal basis.
- Dedicated category names (`Astrological Sanctuary`, `Marketplace Consultations`, `Artificial Intelligence`, `Serene Reminders`, `Service Quality`, `Devotee Community`).
- Accurate encryption disclosure: *"Protected by server-side AES-256-GCM authenticated envelope encryption with tenant-bound authentication tags (AAD)."*

#### 2.3 Cryptographic Evidence Hasher (`apps/web/lib/consent/evidence-hasher.ts`)
- Portable, zero-dependency, isomorphic SHA-256 implementation compliant with FIPS PUB 180-4.
- Avoids Node.js built-in module bundling errors in Next.js client webpack pipelines while leveraging `crypto.subtle` where natively available.
- Generates deterministic audit hashes: `ishti:consent:${userId}:${purpose}:${status}:${version}:${timestamp}`.

#### 2.4 Consent Service Layer (`apps/web/lib/consent/consent-service.ts`)
- `loadLocalConsentState()`: Loads cached consents from localStorage with sensible defaults.
- `updateLocalConsent(purpose, granted, userId)`: Generates cryptographic evidence, updates state, persists to localStorage, and produces audit record.
- `getConsentDefinition(purpose)`: Retrieves statutory basis, default status, and descriptions.

#### 2.5 Global Cookie & Telemetry Sanctuary Banner (`apps/web/app/components/consent/CookieBanner.tsx`)
- Zero third-party ad trackers or cross-site pixels.
- Strictly essential storage required for session integrity.
- Granular customization modal to enable/disable functional preferences and opt-in reader telemetry.
- WCAG 2.2 AA compliant keyboard navigation and contrast ratios.
- Integrated into `apps/web/app/components/layout/AppShell.tsx`.

#### 2.6 Enhanced Consent Sanctuary Hub (`apps/web/app/profile/consent/page.tsx`)
- Unbundled toggle cards with category tags, legal basis badges, and dynamic status indicators.
- Live cryptographic evidence trail strip with copyable full SHA-256 proof hash for devotee verification.
- Clear statutory Data Principal rights disclosures citing DPDP Act 2023 (§6(4), §8(5), §11, §12, §13) and GDPR (Articles 6, 9, 15, 17).

---

### 3. Verification & Compilation Results

1. **TypeScript Typecheck (`npm run typecheck`):**
   - Clean pass across `@spiritual-os/types`, `@spiritual-os/web`, `@spiritual-os/mobile`. Exit code 0.
2. **Next.js 15 Static Build (`npm run build:web`):**
   - Clean pass across all 26 static pages. Exit code 0.
3. **Execution Boundaries Respected:**
   - No queries or migrations against staging or production Supabase.
   - All state mutations strictly local/browser-scoped.
   - Zero Git commits or pushes.

---

### 4. Gate Sign-Off

Gate G2 is formally complete. Proceeding sequentially to Gate G3: Privacy Rights, Retention & Deletion.

# ISHTI Milestone M05 — Overarching Autonomous Execution Summary
## Global Legal, Privacy & Trust Foundation (Gates G1–G5)

**Date:** 2026-11-17  
**Project:** ISHTI — Modern Spiritual Ecosystem  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Milestone:** M05 — Global Legal, Privacy & Trust Foundation  
**Execution Baseline:** `f3c2c5c2c14c34712c1f0b6bfec9eeac12e83a38`  
**Execution Mode:** Sequential Autonomous Background Execution (Gates G1 → G2 → G3 → G4 → G5)  
**Overall Status:** COMPLETED & FULLY VERIFIED  

---

### 1. Executive Summary

Milestone M05 establishes the comprehensive global legal, privacy, commerce trust, and governance foundation for the ISHTI spiritual ecosystem. Conceived not as an India-only platform but as a globally adaptable ecosystem serving seekers across India, the Indian diaspora (NRIs/PIOs), and international communities, M05 operationalizes dharmic trust (Samjnana Sukta) into modern software architecture.

Across five sequential implementation gates (G1 through G5), the engineering team has implemented canonical TypeScript schemas, localized policy registries, an unbundled consent engine with cryptographic proof hashing, a 7-stage account erasure and statutory retention lock orchestrator, a multi-currency fair cancellation calculator, statutory IT Rules grievance redressal mechanisms with strict SLAs, CERT-In cybersecurity triage workflows, and an append-only cryptographic evidence ledger.

All implementations execute locally in strict adherence to environmental boundaries:
- **Zero Production or Staging Access:** Production Supabase (`zxwkfnvmmxoojewhvsdc`) and staging Supabase (`zrjptpkhtklfgnovdrny`) remained strictly quarantined with zero network connections or database mutations.
- **Zero Fabrication:** Corporate entity names, registered addresses, and statutory officer designations remain marked with explicit `[LEGAL_REVIEW_REQUIRED: ...]` placeholders pending formal corporate formation and legal counsel sign-off.
- **Zero Unsanctioned Git Mutation:** Working tree changes remain local without staging, committing, or pushing.
- **100% Verification:** Full typechecks, Next.js 15 static builds (29 routes), and the comprehensive security suite (110 passed, 0 failed) pass cleanly.

---

### 2. Gate Execution Status Summary

| Gate | Title | Scope & Delivered Capabilities | Status | Report Link |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | **Policy Centre Foundation** | Multi-jurisdiction policy schemas, 10 core policy documents, Master Terms with 4 Regional Schedules (IN, EU/UK, US, Global), policy query service, public `/legal` directory, and accessible `/legal/[slug]` SSG reader. | **COMPLETED & VERIFIED** | [`docs/M05_G1_COMPLETION_REPORT.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M05_G1_COMPLETION_REPORT.md) |
| **G2** | **Consent & Preference Management** | 6 unbundled consent purposes, GDPR Art 9 & DPDP §6 legal bases, server-side AES-256-GCM envelope encryption reconciliation, portable SHA-256 evidence hasher, global Cookie & Telemetry Sanctuary Banner, and `/profile/consent` hub. | **COMPLETED & VERIFIED** | [`docs/M05_G2_COMPLETION_REPORT.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M05_G2_COMPLETION_REPORT.md) |
| **G3** | **Privacy Rights, Retention & Deletion** | DPDP §11–§14 & GDPR Art 15–20 rights, machine-readable SAR export package generator with SHA-256 fingerprint, 7-stage deletion orchestrator with financial pseudonymization (`ANON-USER-DELETED`), statutory retention matrix (Income-tax Act, 2025 §62 7-yr rule, Companies Act 8-yr rule), and `/profile/privacy` hub. | **COMPLETED & VERIFIED** | [`docs/M05_G3_COMPLETION_REPORT.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M05_G3_COMPLETION_REPORT.md) |
| **G4** | **Commerce Trust & Refund Governance** | Multi-currency engine (INR, USD, EUR, GBP, AED, SGD) with GST/VAT computation, consultation cancellation cutoff tiers ($T_1=24\text{h}$, $T_2=4\text{h}$), EU 14-day digital content withdrawal waiver per Directive 2011/83/EU Art 16(m), Pandit no-show 100% guarantee, and interactive `/profile/refunds` simulator. | **COMPLETED & VERIFIED** | [`docs/M05_G4_COMPLETION_REPORT.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M05_G4_COMPLETION_REPORT.md) |
| **G5** | **Compliance Operations & Security Governance** | Intermediary grievance ticketing under amended IT Rules (Feb 2026: 24h ack, 7d resolve, 36h takedown), GAC Rule 3A appeal path, CERT-In 6-hour cybersecurity triage protocol, append-only SHA-256 hash-chained audit ledger, public `/legal/grievance` portal, and `/profile/compliance` operations view. | **COMPLETED & VERIFIED** | [`docs/M05_G5_COMPLETION_REPORT.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/M05_G5_COMPLETION_REPORT.md) |

---

### 3. Policy Centre Document Inventory

All 10 foundational policy documents are authored in `apps/web/lib/policy/policy-registry.ts` and rendered via static site generation:

| # | Slug | Title | Category | Status & Version | Primary Statutory Bases | Key Provisions |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `terms` | Master Terms of Service | `legal` | `LEGAL_REVIEW` (v1.0.0-draft) | Indian Contract Act, 1872; IT Act 2000; Consumer Protection E-Commerce Rules 2020; EU DSA | Master terms with 4 Regional Schedules: Schedule A (India), Schedule B (EU/UK), Schedule C (US), Schedule D (Global). |
| 2 | `privacy` | Global Privacy Notice & Data Sanctuary | `privacy` | `LEGAL_REVIEW` (v1.0.0-draft) | DPDP Act, 2023; GDPR Regulation (EU) 2016/679; CCPA / CPRA; Singapore PDPA | GDPR Art 9 religious special category classification; server-side AES-256-GCM envelope encryption; cross-border SCCs; statutory retention periods. |
| 3 | `refunds` | Cancellation & Refund Policy | `commerce` | `LEGAL_REVIEW` (v1.0.0-draft) | Consumer Protection E-Commerce Rules 2020; EU Directive 2011/83/EU; UK Consumer Rights Act 2015 | Consultation cutoff tiers ($T > 24\text{h}$: 100% refund, $4\text{h} \le T \le 24\text{h}$: 50%, $T < 4\text{h}$: non-refundable); digital content waiver; Pandit no-show 100% guarantee. |
| 4 | `payments` | Commercial Payment & Multi-Currency Terms | `commerce` | `LEGAL_REVIEW` (v1.0.0-draft) | Payment & Settlement Systems Act, 2007; CGST Act, 2017; EU PSD2 / PSD3 | Multi-currency (INR, USD, EUR, GBP, AED, SGD); PCI-DSS Level 1 aggregators; GST 18% invoicing; fraud dispute protocols. |
| 5 | `data-deletion` | Data Subject Rights & Deletion Guide | `privacy` | `LEGAL_REVIEW` (v1.0.0-draft) | DPDP Act 2023 (§11–§14); GDPR (Art. 15, 17, 20); CCPA §1798.105 | Subject Access Request (SAR) process; 7-stage deletion sequence; statutory tax retention lock explanation. |
| 6 | `acceptable-use` | Acceptable Use & Community Decorum Policy | `safety` | `LEGAL_REVIEW` (v1.0.0-draft) | IT Act 2000 §79; IT Rules 2021 Rule 3(1)(b) (amended Feb 2026); BNS 2023 | Sacred decorum (Samanvaya); prohibition of blasphemy, harassment, scripture scraping, impersonation, and divisive speech. |
| 7 | `ai-usage` | Spiritual AI Guidance & Transparency Disclaimers | `safety` | `LEGAL_REVIEW` (v1.0.0-draft) | MeitY AI Advisory (2024); EU AI Act (Regulation (EU) 2024/1689); OECD AI Principles | Explicit disclosure of artificial intelligence; canonical grounding; non-substitutability for living Gurus or Deeksha; crisis & mental health boundary disclaimers (Tele-MANAS, 988). |
| 8 | `cookies` | Cookie, Storage & Telemetry Policy | `privacy` | `LEGAL_REVIEW` (v1.0.0-draft) | ePrivacy Directive 2002/58/EC; GDPR Art 5(3); DPDP Act 2023 | Zero third-party ad tracking cookies or cross-site pixels; strictly essential storage (session/CSRF); opt-in reader telemetry. |
| 9 | `security` | Security Architecture & Vulnerability Disclosure | `governance` | `LEGAL_REVIEW` (v1.0.0-draft) | ISO/IEC 27001:2022; CERT-In Directions (April 2022); NIST CSF 2.0 | Defense-in-depth: TLS 1.3, AES-256-GCM envelope encryption, PostgreSQL RLS; Coordinated Vulnerability Disclosure (CVD) safe harbor (48h response). |
| 10 | `grievance` | Statutory Grievance Redressal Mechanism | `governance` | `LEGAL_REVIEW` (v1.0.0-draft) | IT Act 2000 §79; IT Rules 2021 Rule 3(2) & 3A (amended Feb 2026); DPDP Act 2023 §13 | 24-hour statutory acknowledgement; 7-day resolution; 36-hour takedown for court/govt orders; GAC escalation (`gac.gov.in`). |

---

### 4. Multi-Jurisdictional Architecture

The Master Terms of Service (`terms`) adopts a master agreement structure augmented by jurisdiction-specific regional schedules:
- **Schedule A (India Jurisdiction):** Implements due diligence requirements under Rule 3 of the IT Rules 2021 (as amended Feb 2026) and mandatory transparency disclosures under the Consumer Protection (E-Commerce) Rules, 2020.
- **Schedule B (EU & UK Jurisdiction):** Implements the statutory right of withdrawal waiver for digital content upon immediate performance per EU Directive 2011/83/EU Article 16(m) and Digital Services Act (DSA) out-of-court dispute mechanisms.
- **Schedule C (United States Jurisdiction):** Enforces mandatory individual binding arbitration administered by the American Arbitration Association (AAA), class action waivers, and First Amendment spiritual/astrological speech notices.
- **Schedule D (Global & International Remittance):** Governs multi-currency conversion, local VAT/customs compliance, and export control adherence for international devotees.

---

### 5. Consent & Preference Management Architecture

- **6 Unbundled Purposes:**
  1. `kundli_astrology` (Astrological Ephemeris & Birth Chart Calculations)
  2. `expert_consultation` (Pandit & Acharya Consultation Sharing)
  3. `spiritual_ai` (AI Pandit & Canonical Study Assistance)
  4. `marketing_updates` (Tithi, Muhurat & Festival Observances)
  5. `analytics` (Privacy-Preserving Telemetry & Reader Diagnostics)
  6. `community_visibility` (Devotee Community Satsang Presence)
- **Data Categories & Legal Bases:**
  - Religious intentions & study progress: `religious_special_category` under GDPR Article 9 explicit consent.
  - Birth data: `astrological_birth_data` under DPDP §6 consent.
  - Telemetry: `telemetry_diagnostics` (strictly opt-in).
- **Cryptographic Evidence Hashing:**
  - Implemented portable, isomorphic SHA-256 evidence hasher (`apps/web/lib/consent/evidence-hasher.ts`) complying with FIPS PUB 180-4.
  - Generates immutable audit string: `ishti:consent:${userId}:${purpose}:${status}:${version}:${timestamp}`.
- **Sanctuary Banner:** Global accessible Cookie & Telemetry Sanctuary Banner (`apps/web/app/components/consent/CookieBanner.tsx`) in `AppShell.tsx` offering "Accept Essential Only", "Accept All", and "Customize" controls with zero third-party trackers.

---

### 6. Cryptographic Disclosures Reconciliation

In earlier draft iterations, conflicting descriptions referred to astrological data encryption as "client-side zero-knowledge encryption." M05 formally reconciles this:
- **Actual Technical Implementation:** ISHTI's astrological records (`dob`, `tob`, `coordinates`) are encrypted using **server-side AES-256-GCM authenticated envelope encryption with tenant-bound authentication tags (AAD)** (`apps/web/lib/crypto/kundli-encryption.ts`). Decryption keys are loaded into isolated server runtime environments and never exposed to client browsers.
- **UI & Legal Reconciled:** The Global Privacy Notice, Consent Sanctuary Hub, and Policy Documents now accurately declare:
  > *"Protected by server-side AES-256-GCM authenticated envelope encryption with tenant-bound authentication tags (AAD)."*
- This dispels inaccurate zero-knowledge claims while affirming robust bank-grade cryptographic isolation.

---

### 7. Privacy Rights, Retention & Deletion Architecture

- **Subject Access Request (SAR) Generator (`apps/web/lib/privacy/export-service.ts`):**
  - Generates comprehensive, machine-readable JSON packages containing profile data, active consents, cryptographic audit receipts, and encrypted Kundli descriptors.
  - Computes a deterministic SHA-256 data fingerprint.
- **7-Stage Deletion Orchestrator (`apps/web/lib/privacy/deletion-orchestrator.ts`):**
  1. *Verification:* Authenticates devotee declaration.
  2. *Anti-Cascade Unlinking:* Disassociates scripture commentary/contributions from devotee id.
  3. *Astro Key Shredding:* Permanently destroys encrypted Kundli birth records.
  4. *Spiritual Content Scrubbing:* Purges private Sankalpa intentions and prayer notes.
  5. *Financial Pseudonymization:* Reassigns invoice records to `'ANON-USER-DELETED'` to satisfy statutory tax ledgers.
  6. *Cache Purge:* Invalidates session and rate-limiting hash mappings.
  7. *Proof Receipt:* Generates a cryptographically signed Deletion Certificate with immutable SHA-256 receipt hash.
- **Authoritative Retention Schedule Matrix (`apps/web/lib/privacy/retention-matrix.ts`):**
  - *Income-tax Act, 2025 §62 / Rule 46:* 7 years for books of accounts & invoices (Statutory Lock: LOCKED).
  - *Companies Act, 2013 §128(5):* 8 financial years for company financial books (Statutory Lock: LOCKED).
  - *IT Rules 2021 Rule 3(1)(h):* 180 days preservation of account registration details (Statutory Lock: LOCKED).
  - *Astrological & Spiritual Data:* 0 years (Statutory Lock: ERASABLE immediately).

---

### 8. Commerce Trust & Refund Governance Architecture

- **Multi-Currency Support (`apps/web/lib/commerce/multi-currency.ts`):** Supports INR (₹), USD ($), EUR (€), GBP (£), AED, and SGD (S$) with localized currency formatting and GST (18%) / VAT breakdown calculations.
- **Consultation Cancellation Tiers:**
  - $T > 24\text{ hours}$ before start: 100% refund minus 2.5% payment gateway fee deduction.
  - $4\text{ hours} \le T \le 24\text{ hours}$: 50% refund minus 2.5% gateway fee deduction.
  - $T < 4\text{ hours}$: Non-refundable (preparations consecrated); one-time emergency rescheduling permitted up to 2 hours prior.
- **Digital Content Right of Withdrawal:** Under EU Directive 2011/83/EU Article 16(m), digital goods (chant audio, commentaries) are non-refundable once download or streaming commences, with explicit checkout waiver.
- **Expert Reliability Guarantee:** 100% full refund with 0% gateway deduction if an accredited Pandit cancels or fails to attend.
- **Settlement Timelines:** Domestic India (UPI / Net Banking / Cards): 3–5 business days; International Multi-Currency: 7–10 business days.
- **Interactive Simulator (`apps/web/app/profile/refunds/page.tsx`):** Real-time visual calculator displaying cutoff tiers, fee deductions, and net credited refunds.

---

### 9. Compliance Operations & Statutory Grievance Redressal

- **IT Rules 2021 (as amended February 2026) SLA Enforcement:**
  - **24-Hour Acknowledgement SLA:** Automated ticket creation with unique tracking number (`ISHTI-GRV-2026-XXXX`).
  - **7-Day Resolution SLA:** Mandatory investigation and resolution deadline enforced by the engine.
  - **36-Hour Unlawful Content Removal:** Dedicated workflow for court orders and government notifications under Rule 3(1)(d).
- **Grievance Appellate Committee (GAC) Recourse:** Explicit disclosure of appeal rights to the Central Government GAC within 30 days under Rule 3A (`gac.gov.in`).
- **Cybersecurity Incident Triage (`apps/web/lib/compliance/security-governance.ts`):** Enforces CERT-In's mandatory 6-hour reporting window for critical/systemic cyber incidents and DPDP §8(6) Data Protection Board intimation for personal data breaches.
- **Cryptographic Audit Ledger (`apps/web/lib/compliance/audit-trail.ts`):** Append-only SHA-256 hash-chained ledger verifying tamper-evident compliance history.
- **Public Portals:** Statutory Grievance Portal at `/legal/grievance` and Compliance Operations Hub at `/profile/compliance`.

---

### 10. Legal Review Placeholders & Governance Boundaries

In strict compliance with authorization boundaries:
- Corporate Entity Name: `[LEGAL_REVIEW_REQUIRED: Registered Corporate Entity Name, e.g. ISHTI Spiritual Technologies Private Limited]`
- Registered Office Address: `[LEGAL_REVIEW_REQUIRED: Registered Postal Address, City, State, PIN, India]`
- Statutory Grievance Officer: `[LEGAL_REVIEW_REQUIRED: Appointed Statutory Grievance Officer Name]`
- Data Protection Officer: `[LEGAL_REVIEW_REQUIRED: Appointed Data Protection Officer Name or Office]`
- GSTIN: `[LEGAL_REVIEW_REQUIRED: GSTIN]`
- All policy documents are categorized with status **`LEGAL_REVIEW`** or **`DRAFT`** and render an accessible legal draft disclaimer banner across public reader pages.

---

### 11. Verification & Test Execution Summary

The entire repository was rigorously verified after every gate:

| Verification Suite | Target | Result | Notes |
| :--- | :--- | :--- | :--- |
| **TypeScript Compiler** | `npm run typecheck` across all workspaces | **PASSED (Code 0)** | Zero type errors across `@spiritual-os/types`, `@spiritual-os/web`, `@spiritual-os/mobile`. |
| **Next.js 15 Production Build** | `npm run build:web` | **PASSED (Code 0)** | 29 static pages compiled and prerendered cleanly (including `/legal`, `/legal/[slug]`, `/legal/grievance`, `/profile/privacy`, `/profile/refunds`, `/profile/compliance`). |
| **Static Integrity Checks** | Comprehensive Security Suite | **29 Passed, 0 Failed** | Confirms brand migration, no raw metadata leaks, non-recursive RLS, advisory lock validation. |
| **Unit Tests (Crypto & Net)** | Comprehensive Security Suite | **52 Passed, 0 Failed** | AES-256-GCM round-trip, IV freshness, AAD context binding, tamper rejection, reverse proxy validation. |
| **Real App Integration** | Comprehensive Security Suite | **3 Passed, 0 Failed** | Application-layer integration tests. |
| **Real PostgreSQL & RLS Tests** | Comprehensive Security Suite | **22 Passed, 0 Failed** | Row-Level Security tenant isolation, slot booking concurrency, scripture rights clearance. |
| **Concurrency Tests** | Comprehensive Security Suite | **4 Passed, 0 Failed** | Slot booking atomic reservation concurrency and rate limiting. |
| **Total Executed Tests** | Comprehensive Security Suite | **110 Passed, 0 Failed** | 100% pass rate. |
| **Remote Infrastructure** | Staging & Production Supabase | **ZERO Network Connections** | Strictly quarantined. No live DB queries or migrations applied. |

---

### 12. Conclusion & Readiness for Operator Review

Milestone M05 has been fully implemented, integrated, and verified across all five gates (G1 through G5). The ISHTI Legal, Privacy & Trust Foundation is structurally sound, legally grounded, and ready for operator acceptance and formal legal counsel review.

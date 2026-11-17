# ISHTI M05 — Gate G1 Completion Report
## Policy Centre Foundation

**Date:** 2026-11-17  
**Milestone:** M05 — Global Legal, Privacy & Trust Foundation  
**Gate:** G1 — Policy Centre Foundation  
**Status:** COMPLETED & VERIFIED  

---

### 1. Executive Summary

Gate G1 establishes the global multi-jurisdiction Policy Centre for ISHTI. Grounded in the accepted G0 and G0.1 architecture reports and aligned with primary legal authorities (including the Digital Personal Data Protection Act, 2023; Gazette Notification G.S.R. 843(E) commencement timeline; Information Technology Rules 2021 as amended February 2026; GDPR Regulation (EU) 2016/679; California Consumer Privacy Act / CPRA; Income-tax Act, 2025 §62/Rule 46; and Companies Act, 2013 §128), G1 implements the canonical policy data models, content registry, service layer, public directory, and accessible policy reader routes.

All 10 foundational policy documents have been authored with rigorous legal clauses, statutory references, and transparent disclaimers. Company entity names and statutory officer designations are designated with explicit `[LEGAL_REVIEW_REQUIRED: ...]` placeholders pending corporate registration and formal counsel sign-off.

---

### 2. Architecture & Deliverables

#### 2.1 Type Definitions (`packages/types/src/policy.ts`)
Added and exported in `@spiritual-os/types`:
- `PolicyDocumentSlug`: `'terms' | 'privacy' | 'refunds' | 'payments' | 'data-deletion' | 'acceptable-use' | 'ai-usage' | 'cookies' | 'security' | 'grievance'`
- `PolicyCategory`: `'legal' | 'privacy' | 'commerce' | 'safety' | 'governance'`
- `PolicyStatus`: `'DRAFT' | 'INTERNAL_REVIEW' | 'LEGAL_REVIEW' | 'OPERATOR_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'SUPERSEDED'`
- `JurisdictionCode`: `'GLOBAL' | 'IN' | 'EU_UK' | 'US' | 'SG' | 'AE'`
- `PolicySection`: id, title, order, content, legalBasisRef
- `PolicySchedule`: id, slug, title, jurisdiction, description, sections
- `PolicyDocument`: slug, title, category, status, version, effectiveDate, lastReviewedDate, summary, sections, schedules, statutoryBasis, dpoContactRequired

#### 2.2 Content Registry (`apps/web/lib/policy/policy-registry.ts`)
Authored all 10 core policy documents:
1. **Master Terms of Service (`terms`):** Includes Master Terms and 4 Regional Schedules:
   - *Schedule A (India):* IT Rules 2021 due diligence, Consumer Protection (E-Commerce) Rules 2020 disclosures.
   - *Schedule B (EU/UK):* 14-day statutory right of withdrawal waiver for digital content, Digital Services Act (DSA) notice.
   - *Schedule C (US):* Mandatory binding arbitration, class action waiver, First Amendment spiritual/astrological speech notice.
   - *Schedule D (Global):* Currency remittance, local tax compliance, export controls.
2. **Global Privacy Notice (`privacy`):**
   - Spiritual & devotional data classification (GDPR Article 9 religious special category).
   - Astrological data protection: Server-side AES-256-GCM envelope encryption with tenant-bound authentication tags (AAD).
   - Multi-jurisdiction legal bases (DPDP §6/§7, GDPR Art 6/9, CCPA notice at collection).
   - Statutory retention periods (7 years tax under Income-tax Act, 2025 §62/Rule 46; 8 years under Companies Act, 2013 §128).
3. **Cancellation & Refund Policy (`refunds`):**
   - Configurable cutoff tiers for live consultations ($T > 24\text{h}$: 100% refund, $4\text{h} \le T \le 24\text{h}$: 50%, $T < 4\text{h}$: no refund; Pandit no-show: 100% refund).
   - Digital downloads withdrawal waiver upon download commencement (EU Directive 2011/83/EU Art 16(m)).
   - Payment gateway refund timelines (3–5 days UPI/Net Banking, 5–7 days domestic cards, 7–10 days international).
4. **Commercial Payment Terms (`payments`):**
   - Multi-currency support (INR, USD, EUR, GBP, AED, SGD), PCI-DSS Level 1 compliance, GST (18%) invoicing.
5. **Data Subject Rights & Deletion Guide (`data-deletion`):**
   - Detailed explanation of DPDP §11–§14 and GDPR Art 15–22 rights.
   - 7-stage deletion orchestration process (verification, anti-cascade unlinking, key shredding, content scrubbing, financial record pseudonymization `ANON-USER-DELETED`, cache purge, proof receipt).
6. **Acceptable Use & Community Decorum Policy (`acceptable-use`):**
   - Sacred decorum and Samanvaya principles; prohibited content under Rule 3(1)(b) of the IT Rules 2021 (as amended Feb 2026).
7. **Spiritual AI Guidance & Transparency Disclaimers (`ai-usage`):**
   - Clear disclosure of artificial intelligence models (Gemini / RAG).
   - Canonical grounding in Vedic literature; non-substitutability for living human Gurus or sacred Deeksha.
   - Strict medical/psychiatric/crisis boundary disclaimers with emergency helpline references (Tele-MANAS, 988).
8. **Cookie, Storage & Telemetry Policy (`cookies`):**
   - Zero third-party advertising cookies or cross-site tracking pixels.
   - Strictly necessary storage (CSRF, auth session) and functional preferences (a11y, language).
   - Privacy-preserving, zero-PII reader telemetry (strictly opt-in).
9. **Security Architecture & Vulnerability Disclosure (`security`):**
   - Defense-in-depth: TLS 1.3, AES-256-GCM envelope encryption, PostgreSQL Row-Level Security (RLS).
   - Coordinated Vulnerability Disclosure (CVD) policy with safe harbor for ethical security researchers (48h response).
10. **Statutory Grievance Redressal Mechanism (`grievance`):**
    - Statutory timelines under IT Rules 2021 (Feb 2026 amendment): 24-hour acknowledgement, 7-day resolution, 36-hour takedown for specified orders.
    - Escalation to Grievance Appellate Committee (GAC) under Rule 3A.

#### 2.3 Query Service Layer (`apps/web/lib/policy/policy-service.ts`)
Provides clean accessors:
- `getAllPolicies()`
- `getPolicyBySlug(slug)`
- `getPoliciesByCategory(category)`
- `getPublishedPolicies()`
- `searchPolicies(query)`

#### 2.4 User Interface & Public Routes
- **`/legal` (Policy Centre Hub):** Category filter tabs, real-time search, document summary cards with statutory basis tags, and statutory contact banner.
- **`/legal/[slug]` (Accessible Policy Reader):** Dynamic Static Site Generation (SSG) with `generateStaticParams`, Table of Contents navigation, accessible draft review banner, regional schedules tabs, and responsive layout.
- **Footer Navigation (`apps/web/app/components/Footer.tsx`):** Added explicit links to Policy Centre, Terms of Service, Privacy Notice, Refund Policy, and Grievance Redressal.

---

### 3. Verification & Compilation Results

1. **TypeScript Typecheck (`npm run typecheck`):**
   - Clean pass across all workspaces (`@spiritual-os/types`, `@spiritual-os/web`, `@spiritual-os/mobile`). Exit code 0.
2. **Next.js 15 Static Build (`npm run build:web`):**
   - Compiled successfully.
   - Generated 26 static pages (15 existing + 1 `/legal` + 10 `/legal/[slug]`). Exit code 0.
3. **Execution Boundaries Respected:**
   - No connection to production Supabase (`zxwkfnvmmxoojewhvsdc`).
   - No connection to staging Supabase (`zrjptpkhtklfgnovdrny`).
   - All corporate and officer designations marked `[LEGAL_REVIEW_REQUIRED: ...]`.
   - No files committed or pushed to Git.

---

### 4. Gate Sign-Off

Gate G1 is formally complete. Proceeding sequentially to Gate G2: Consent & Preference Management.

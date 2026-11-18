# ISHTI — Legal Decision Log (LDL)

**Document Reference:** `docs/legal/ISHTI_LEGAL_DECISION_LOG.md`  
**Milestone:** M05 — Legal, Privacy & Trust Foundation  
**Version:** 1.0.0  
**Last Updated:** 2026-11-17  
**Governance Standard:** STATUTORY TRACEABILITY RECORD  

---

## 1. Executive Protocol

The **ISHTI Legal Decision Log (LDL)** records formal architectural decisions that resolve statutory, regulatory, privacy, intellectual property, and consumer protection mandates. Every legal-architectural decision binds engineering implementations, prevents regression, and establishes an evidentiary audit trail for regulatory inquiries.

---

## 2. Register of Legal Decisions

### 2026-11-17: LDL-001 — Contextual Classification of Astrological & Devotional Data
- **Statutory Context:** DPDP Act, 2023 §6 & §8; GDPR Article 9 (Special Category Data); CCPA/CPRA §1798.140(ae).
- **Legal Problem:** Commercial astrology platforms frequently treat birth data (date, time, exact coordinates) and personal prayer intentions as generic non-sensitive personal data. In Europe and California, religious beliefs constitute special-category data with enhanced protection. In India, DPDP Act protects all digital personal data, with heightened exposure if religious profiling occurs.
- **Architectural Decision:**
  1. ISHTI contextually classifies astrological birth details and prayer intentions as **High-Sensitivity Sacred Data**.
  2. Data is protected by dedicated field-level AES-256-GCM authenticated envelope encryption (`kundli-encryption.ts`).
  3. Processing requires explicit, unbundled opt-in consent (`kundli_astrology`).
  4. Astrological birth data is strictly quarantined from advertising and third-party data broker analytics.
- **Status:** APPROVED & IMPLEMENTED LOCALLY.

---

### 2026-11-17: LDL-002 — Truth in Cryptographic Disclosures (Server Envelope Encryption vs. Zero-Knowledge)
- **Statutory Context:** Consumer Protection Act, 2019 §2(28) (Misleading Advertisement) & §2(47) (Unfair Trade Practice); DPDP Act §8(5).
- **Legal Problem:** Prior informal descriptions colloquially referred to Kundli encryption as "zero-knowledge encrypted". Under technical reality, server-side algorithms decrypt birth data using a master key to calculate planetary ephemerides and divisional charts. Retaining a "zero-knowledge" marketing claim would constitute an actionable misleading representation under consumer law.
- **Architectural Decision:**
  1. Completely purged all claims of "Zero-Knowledge" and "Client-Side Only Decryption" from application UI, policy documents, and developer documentation.
  2. Truthfully and accurately disclosed the architecture as: **"Server-Side Authenticated AES-256-GCM Envelope Encryption with Tenant-Bound Authentication Tags (AAD)"**.
  3. Explicitly noted that decryption occurs in ephemeral memory on the application server for Shastric calculations and is immediately wiped.
- **Status:** APPROVED & IMPLEMENTED IN M05 REMEDIATION.

---

### 2026-11-17: LDL-003 — Absolute Prohibition of Supernatural Guarantees & Medical Healing Claims
- **Statutory Context:** The Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954, Sections 3, 4, 7; Consumer Protection Act, 2019 §2(28); Bharatiya Nyaya Sanhita, 2023 §318 (Cheating).
- **Legal Problem:** Online puja and astrology services frequently advertise guaranteed cures for chronic diseases, promise guaranteed male children, or promise guaranteed financial windfalls through rituals, creating acute criminal and regulatory exposure.
- **Architectural Decision:**
  1. Built an absolute prohibition into platform policies and content filters against all claims of guaranteed supernatural or medical outcomes.
  2. Prohibited all references to diagnosing, curing, mitigating, or treating any disease, disorder, or physical condition through ritual or astrology.
  3. Mandatory non-medical disclaimer rendered on all puja and astrology pages: *"Devotional rituals and Vedic astrology are sacred cultural practices. They are not a substitute for professional medical, legal, financial, or psychiatric advice."*
  4. Contractually bar all onboarded pandits from guaranteeing outcomes or using fear-based dosha tactics.
- **Status:** APPROVED & EMBEDDED IN M05 POLICY SPECIFICATIONS.

---

### 2026-11-17: LDL-004 — Unbundled, Granular 6-Purpose Consent Architecture
- **Statutory Context:** DPDP Act, 2023, Section 6(1) & 6(2); GDPR Article 7; CCPA §1798.120.
- **Legal Problem:** "Take-it-or-leave-it" blanket terms of service that condition basic app registration on agreeing to marketing, telemetry, and AI training violate DPDP Act §6(1) (consent must be free, specific, informed, unconditional, and unambiguous).
- **Architectural Decision:**
  1. Engineered unbundled 6-purpose consent registry (`apps/web/lib/consent/consent-registry.ts`):
     - `kundli_astrology`: Processing birth details for horoscope calculations (core/functional).
     - `expert_consultation`: Sharing chart with consulting Acharyas (conditional on booking).
     - `spiritual_ai`: Processing conversational queries with AI models (optional, opt-in).
     - `marketing_updates`: Devotional festival notifications and emails (optional, opt-in).
     - `analytics`: Privacy-preserving telemetry without third-party tracking pixels (optional, opt-in).
     - `community_visibility`: Displaying devotee profile in Satsang circles (optional, opt-in).
  2. Optional purposes strictly default to `false`.
  3. Deterministic SHA-256 evidence hashing generated on every consent state mutation.
- **Status:** APPROVED & IMPLEMENTED LOCALLY.

---

### 2026-11-17: LDL-005 — 7-Stage Deletion Lifecycle & Segregation of Accounting Records
- **Statutory Context:** DPDP Act, 2023 §12 (Erasure); Income-tax Act, 2025 §62 / Rule 46 (7-year tax retention); Companies Act, 2013 §128 (8 financial years).
- **Legal Problem:** Data privacy laws mandate complete erasure upon devotee request, whereas statutory tax and company laws mandate preservation of financial invoices and books of account. Indiscriminate deletion destroys tax audit trails; blanket retention violates data minimization.
- **Architectural Decision:**
  1. Engineered strict architectural segregation in the 7-stage deletion orchestrator (`deletion-orchestrator.ts`):
     - Stage 1: Identity & session verification.
     - Stage 2: Anti-cascade unlinking of shared family charts.
     - Stage 3: Astro key shredding (purging ciphertext records and devotee-bound AAD tags).
     - Stage 4: Spiritual content scrubbing (purging prayer intentions, chat logs, satsang posts).
     - Stage 5: Commercial & tax pseudonymization (financial invoices and GST records locked for statutory 7/8 years, but user profile pseudonymized to `ANON-USER-DELETED`).
     - Stage 6: Cache and session purge across Redis/edge layers.
     - Stage 7: Issuance of cryptographic Deletion Certificate.
  2. Publicly disclosed that disaster recovery rolling backups are overwritten in routine 30-day snapshot rotations.
- **Status:** APPROVED & TESTED LOCALLY.

---

### 2026-11-17: LDL-006 — Dual-Jurisdiction Intermediary Grievance Redressal (24-Hour Ack, 7-Day Resolve)
- **Statutory Context:** IT Act, 2000 §79; IT Rules, 2021 (as amended February 2026), Rule 3(2) & Rule 3(1)(d).
- **Legal Problem:** The February 2026 amendments to the IT Rules compressed the statutory intermediary grievance timeline from 48h/15d to **24-hour acknowledgement and 7-day resolution**, while retaining the 36-hour takedown window for court/government orders. Retaining legacy 15-day SLAs forfeits intermediary immunity.
- **Architectural Decision:**
  1. Automated grievance ticketing engine (`grievance-service.ts`) hardcodes the amended statutory SLAs:
     - Mandatory acknowledgement timestamp calculated at exactly `T + 24 hours`.
     - Mandatory resolution deadline calculated at exactly `T + 7 days`.
     - Urgent unlawful content removal SLA configured at `T + 36 hours`.
  2. Grievance tickets require 2-factor verification (Ticket # + Complainant Email) to inspect status, preventing data leakage to unauthorized third parties.
  3. Integrated formal Grievance Appellate Committee (GAC) escalation pathways (`gac.gov.in`) under Rule 3A.
- **Status:** APPROVED & IMPLEMENTED LOCALLY.

---

### 2026-11-17: LDL-007 — Commercial Refund Framework, Pandit Guarantee & Minor-Unit Math
- **Statutory Context:** Consumer Protection Act, 2019 §2(47); Consumer Protection (E-Commerce) Rules, 2020 Rule 5; EU Directive 2011/83/EU Article 16(m).
- **Legal Problem:** Vague refund terms create consumer disputes and chargeback liabilities. Floating-point arithmetic introduces IEEE-754 rounding discrepancies in financial settlements.
- **Architectural Decision:**
  1. Converted all financial computations to integer minor units (paise/cents: `Math.round(amount * 100)`).
  2. Proposed fair cancellation tiers: >24h (100%), 4–24h (50%), <4h (0% non-refundable).
  3. Pandit No-Show Reliability Guarantee: 100% full refund with 0 fees if an expert fails to attend a confirmed consultation.
  4. Defaulted proposed payment gateway fee deduction to 0% pending aggregator contracts.
  5. Implemented EU CRD Art. 16(m) digital content right-of-withdrawal waiver upon immediate download for customized PDF Kundli reports.
- **Status:** APPROVED LOCALLY (Awaiting founder formal commercial sign-off).

---

### 2026-11-17: LDL-008 — Scripture Copyright Doctrine & Modern Translation Licensing
- **Statutory Context:** Copyright Act, 1957, Sections 2(o), 14, 51, 52.
- **Legal Problem:** A common industry misconception assumes that because the Vedas, Upanishads, and Bhagavad Gita were composed thousands of years ago, all modern printed editions, commentaries, translations, and audio recordings are in the public domain. In reality, modern translations (e.g. Swami Chinmayananda, Eknath Easwaran) and critical editions (e.g. BORI Mahabharata) are independently protected by copyright.
- **Architectural Decision:**
  1. Adopted strict two-tier content doctrine: Ancient Sanskrit root text is public domain; modern translations, editions, and commentaries are independently proprietary.
  2. All database seed records in `supabase/migrations/` cite verified 19th-century public domain translations (Ralph T.H. Griffith, 1896) and are explicitly flagged `rights_clearance_status: 'pending_peer_review'`.
  3. Mandatory requirement: No modern scripture translation or commentary may be vectorized into the production AI RAG corpus without a written commercial license or assignment.
- **Status:** APPROVED & CODIFIED IN SEED SCHEMA.

---

### 2026-11-17: LDL-009 — Server-Only Endpoint Boundary for Administrative & Compliance Controls
- **Statutory Context:** IT Act §70B; DPDP Act §8(5); OWASP Top 10 API Security (Broken Object Level Authorization & Broken Function Level Authorization).
- **Legal Problem:** Relying on client-side React hooks (`useAuth()`, `user?.role === "platform_admin"`) or client-provided `UserProfile` objects creates a superficial security boundary. Any client can alter local state or send direct HTTP requests to retrieve audit records or trigger incident triage.
- **Architectural Decision:**
  1. Built pure zero-trust session verification engine in `compliance-session-verifier.ts`, rejecting all client role claims and headers.
  2. Enforced Next.js `server-only` boundary in `compliance-server.ts`.
  3. Created protected server route handlers (`/api/compliance/audit`, `/api/compliance/triage`) that independently verify session tokens and query `public.profiles.role` in a single trusted context.
  4. Enforced CSRF origin validation on cookie-authenticated mutations and payload size limits (64KB).
  5. Formally designated live operational administrative access as `BLOCKED — BACKEND AUTHENTICATION DEPENDENCY` in the offline M05 baseline to prevent false security claims before M06.
- **Status:** APPROVED & TESTED IN M05 PASS 3.

---

### 2026-11-17: LDL-010 — Enterprise AI Zero-Retention Mandate
- **Statutory Context:** DPDP Act, 2023 §8(1); GDPR Article 28; Professional / Religious Confidentiality.
- **Legal Problem:** Consumer terms of major LLM providers (e.g. free consumer Gemini/OpenAI tiers) explicitly permit retaining conversational inputs and fine-tuning future public foundation models on user chat data. Devotees sharing intimate life struggles in AI spiritual chat would face catastrophic privacy leakage.
- **Architectural Decision:**
  1. Mandate that all production AI interactions must route exclusively through Google Cloud Vertex AI / Enterprise Gemini API with enterprise data governance terms.
  2. Zero-retention addendum must be executed ensuring user prompts and completions are never logged, inspected by human reviewers, or used for model retraining.
  3. Client-side PII scrubbing filter implemented before prompt dispatch.
- **Status:** APPROVED IN PRINCIPLE (Implementation required in M06).

---

### 2026-11-18: LDL-011 — Legal Accuracy Reconciliations, GST TCS Recalibration & Technical Endpoint Hardening
- **Statutory Context:** DPDP Act phased commencement under G.S.R. 843(E) (13 Nov 2025); IT Rules Rule 3(2)(a)(i) (as amended Feb 2026); CGST Act §52 & Notification No. 15/2024-Central Tax (TCS 0.5%); Income-tax Act, 2025 §62 / Rule 46; GDPR Article 3(2) & EDPB Guidelines 2/2018; CCPA/CPRA $26.625M threshold (2026 CPI adjustment); EU AI Act Article 50.
- **Legal Problem:** Prior drafts conflated statutory deadlines (e.g. misstating TCS rate as 1% instead of 0.5%, mischaracterizing future-commencing DPDP Act sections as current statutory violations, conflating accounting books retention with personal user data, and treating Article 49 consent as a routine cross-border transfer mechanism).
- **Architectural Decision:**
  1. Reconciled all DPDP Act citations strictly against Gazette Notification G.S.R. 843(E) dated 13 November 2025: distinguished in-force provisions from 12-month (§6(9), §27(1)(d)) and 18-month (§16(1), §17(1)) provisions; framed them as pre-launch engineering controls rather than current violations.
  2. Disaggregated IT Rules intermediary deadlines: 24h acknowledgement (Rule 3(2)(a)(i)), 7d disposal (Rule 3(2)(a)(i) as amended Feb 2026), 24h removal for non-consensual sexually explicit content / impersonation (Rule 3(2)(b)), 36h takedown upon court/govt order (Rule 3(1)(d)), and §69A confidential blocking directions under the 2009 Blocking Rules.
  3. Recalibrated GST TCS rate to **0.5%** (0.25% CGST + 0.25% SGST, or 0.5% IGST) pursuant to Notification No. 15/2024-Central Tax (effective 10 July 2024) and modeled the operational difference between principal sales (regular forward charge GST) and marketplace ECO operations (0.5% TCS applies).
  4. Clarified that Income-tax Act, 2025 §62 books of accounts retention applies to business/professional accounting records exceeding statutory turnover thresholds, not generic devotee profile data; marked GST, TCS, TDS (§194-O/194J), and tax retention as `CA REVIEW REQUIRED`.
  5. Enforced Standard Contractual Clauses (SCCs) for cross-border data flows, explicitly barring Article 49 consent derogation as a routine transfer solution per EDPB Guidelines 2/2018.
  6. Hardened technical endpoints: bound Bearer-token verification to database authorization context, returned explicit 501 `NOT_IMPLEMENTED` on audit ledger endpoint until M06 WORM storage exists, documented process-local rate limiting, hardened CSRF trusted-origin check, validated client IP provenance, and added explicit simulation disclaimer to security triage output.
- **Status:** APPROVED & IMPLEMENTED LOCALLY.

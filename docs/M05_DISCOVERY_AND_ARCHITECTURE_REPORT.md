# ISHTI M05 — Global Legal, Privacy & Trust Foundation
## Discovery and Architecture Report (Gate G0)

**Document Reference:** `docs/M05_DISCOVERY_AND_ARCHITECTURE_REPORT.md`  
**Date:** November 17, 2026  
**Status:** Gate G0 Discovery Deliverable (Pending Operator Review)  
**Baseline Git Commit:** `f3c2c5c2c14c34712c1f0b6bfec9eeac12e83a38`  
**Execution Boundary:** STRICT READ-ONLY AUDIT. No code changes, no migration mutations, zero production access.

---

## 1. Executive Summary

ISHTI is architected as an authentic, modern spiritual ecosystem designed to serve devotees and seekers across India, non-resident Indians (NRIs), the global Indian diaspora, and international spiritual practitioners across North America, Europe, the United Kingdom, the Middle East, Southeast Asia, and Australasia.

As the platform transitions from its Application Foundation (Milestones M01–M04.6) into commercial services, expert consultations, personalized astrological calculations, and spiritual community offerings (Milestone M05), it encounters diverse, overlapping, and stringent legal jurisdictions. 

### Critical Architecture Discovery
1. **The Religious Data Sensitivity Rule:** Under the European Union General Data Protection Regulation (GDPR Article 9) and the UK Data Protection Act 2018, data concerning religious beliefs constitutes **Special Category Personal Data**. Under California law (CCPA/CPRA § 1798.140), religious beliefs and precise geolocation are classified as **Sensitive Personal Information (SPI)**. ISHTI's core data models—encompassing sampradaya traditions, puja intentions, deity devotions, and astrological birth coordinates—trigger the highest legal tiers of protection, necessitating explicit affirmative consent, strict purpose limitation, and dedicated rights to restrict processing.
2. **Rejection of "India-Only" Legal Architecture:** While India remains the operational and doctrinal baseline under the Digital Personal Data Protection Act, 2023 (DPDP Act) and IT Rules 2021, ISHTI's terms, privacy policies, consent engines, payment frameworks, and cancellation models must not be designed as India-exclusive. A global master framework supplemented by jurisdiction-specific schedules is mandatory to avoid extraterritorial non-compliance fines (up to €20M / 4% global turnover under GDPR, or ₹250 crore under DPDP Act 2023).
3. **Cross-Border Transfer Realities:** Primary database assets currently reside in Supabase's Mumbai region (`ap-south-1`). Because India currently lacks an EU or UK adequacy decision under GDPR Article 45, transferring European user data to Indian databases legally requires appropriate safeguards—specifically European Commission Standard Contractual Clauses (SCCs) combined with a Transfer Impact Assessment (TIA under *Schrems II*).
4. **Multi-Currency & Consumer Protection Disparity:** Existing database schemas store transaction values in hardcoded `amount_inr` integers with Razorpay sandbox integration. Expanding globally necessitates multi-currency support (USD, GBP, EUR, AED, SGD), regional tax compliance (Indian GST vs. EU/UK VAT vs. US State Sales Tax), and differentiated statutory cooling-off rights (such as the mandatory EU 14-day withdrawal period versus bespoke expert consultation cancellation schedules).

---

## 2. Existing Implementation Inventory (Read-Only Technical Audit)

A comprehensive audit of the M04.6 repository baseline was conducted across database DDL, server actions, client context providers, and verification test harnesses:

### A. Database Schema Assets (`supabase/migrations/20261114000000_initial_schema.sql`)
| Table Name | Existing Schema Capabilities | Legal & Compliance Relevance | Reusability in M05 |
|---|---|---|---|
| `public.profiles` | User ID, phone, email, full name, role (`devotee`, `expert_pandit`, `content_scholar`, `platform_admin`), language preference, `sampradaya_tradition`, verification flag. | Stores identity and religious sampradaya data (Special Category Data under GDPR Art. 9). | **Direct Reuse**: Base identity entity; requires country of residence and timezone fields for jurisdictional routing. |
| `public.role_assignment_audit` | Immutable audit log capturing previous role, new role, assigned by, system flag, timestamp. Enforced via `prevent_audit_log_tampering()` trigger. | Tamper-evident administrative audit trail proving role governance and least privilege. | **Direct Reuse**: Serves as the architectural model for the new `privacy_requests_audit` table. |
| `public.user_consents` | `user_id`, `purpose` (`kundli_astrology`, `expert_consultation`, `marketing_updates`, `analytics`), `granted`, `consent_version`, `ip_hash` (salted SHA-256), `user_agent`, timestamps. | Captures purpose-specific consent logs aligned with DPDP Act 2023 §6. | **Partial Reuse**: Purposes must be expanded; legal basis enum (`consent`, `contract`, `legitimate_interest`) and jurisdictional tagging must be added. |
| `public.kundli_profiles` | `user_id`, `ciphertext_dob`, `ciphertext_tob`, `ciphertext_coordinates`, `encryption_key_version`, `encryption_iv`, `encryption_auth_tag`, `ayanamsha`. | Envelope encryption (AES-256-GCM) with context-bound AAD. Trigger `validate_kundli_ciphertext_payload()` rejects plaintext writes. | **Direct Reuse**: Exemplary cryptographic safeguard satisfying GDPR Art. 32 and DPDP Act §8(5). Supports cryptographic erasure. |
| `public.expert_profiles` | Full name, title, specializations, hourly fee in INR, verification status (`unverified`, `documents_submitted`, `scholarly_vetted`, `accredited`), rating. | Professional vetting, credentialing, and provider compliance under Consumer Protection E-Commerce Rules. | **Partial Reuse**: Currently hardcoded to INR (`hourly_fee_inr`); requires multi-currency pricing and tax ID fields. |
| `public.consultation_slots` | Expert ID, start time, end time, `is_booked` flag. Unique index on `(expert_id, start_time)`. | Scheduling inventory and capacity management. | **Direct Reuse**: Basis for cancellation and refund eligibility window calculations. |
| `public.booking_requests` | `expert_id`, `user_id`, `slot_id`, `service_type`, `status` (`pending_confirmation`, `confirmed`, `completed`, `cancelled`, `refunded`), `amount_inr`, `payment_status`. Partial unique index on active slots. | Contractual transaction record. Trigger `validate_and_reserve_booking_slot()` enforces price checks. | **Partial Reuse**: Hardcoded to `amount_inr`; requires currency code, refund audit linkage, and tax breakdown. |
| `public.rate_limit_events` | Bucket (`early_access`, `auth_otp`, `kundli_decrypt`, `booking_request`), identifier hash, created timestamp. Advisory lock RPC `check_rate_limit()`. | Defense-in-depth against credential stuffing, brute force, and denial of service. | **Direct Reuse**: Essential security control supporting CERT-In and GDPR Art. 32 security requirements. |
| `public.early_access_subscribers` | Email, phone, preferred tradition, interests array, `ip_hash`, created timestamp. Unique email constraint. | Marketing lead intake with honeypot bot defense and server-side validation. | **Partial Reuse**: Requires explicit double opt-in verification and opt-out mechanisms for international marketing compliance (CAN-SPAM, CASL, PECR). |

### B. Application Code & Security Infrastructure
- **Security Definier Helpers:** `public.is_admin()` and `public.is_scholar()` execute with non-recursive SQL security definer semantics, strictly preventing privilege escalation and RLS recursion crashes.
- **Client Presentation Boundaries:** `apps/web/lib/environment/presentation-layer.ts` enforces devotee reference masking (e.g. `ISHTI-7C6E5DC1`) preventing database UUID disclosure, while `toHumanReadableError()` intercepts Postgres error codes (`42P01`, `PGRST*`, `23505`) and sanitizes diagnostic logs to server-only outputs.
- **Multilingual Architecture:** `apps/web/lib/i18n/` implements complete English and Hindi dictionaries with safe deep-fallback merge and transparent "Roadmap (English fallback)" badging for 8 regional languages.
- **Consent UI Baseline:** `apps/web/app/profile/consent/page.tsx` delivers a working client-side consent toggle dashboard with guest local storage fallback, currently branded exclusively under Indian DPDP Act 2023 terminology.

---

## 3. Global Regulatory Applicability Matrix

| Jurisdiction | Legislation / Regulation | Territorial Scope & Trigger | Applicability to ISHTI | Current Status | Key Devotee Rights | ISHTI Mandatory Obligations | Required Engineering Controls | Penalties & Risk Exposure | Legal Counsel Required | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| **India** | **DPDP Act, 2023 & Draft Rules 2025** | Processing of digital personal data within India; or outside India if offering goods/services to Data Principals in India (§3). | **DIRECT & MANDATORY** (HQ, primary servers, core services). | Enacted Aug 2023; Rules in final gazette notification phase (2025). | Access (§11), Correction/Erasure (§12), Grievance Redressal (§13), Nomination (§14). | Itemised notice in 22 languages (§5), valid consent (§6), reasonable security (§8(5)), breach reporting to DPB (§8(6)), child data safeguards (§9). | Granular unbundled consent logging, age verification gateway, withdrawal mechanism, DPO/Grievance contact in UI. | Up to ₹250 crore for security failures; ₹200 crore for failure to notify DPB of personal data breaches. | Mandatory Indian Tech/Privacy Counsel. | **P0 (Immediate)** |
| **India** | **IT Act, 2000 & Intermediary Rules, 2021** | Intermediaries transmitting or hosting user content or connecting users and experts (§79). | **DIRECT & MANDATORY** (Community satsang forums, Pandit booking network). | Active and strictly enforced. | Right to lodge complaints against offensive or unlawful content. | Due diligence, published privacy policy and user agreement, Resident Grievance Officer, 24h acknowledgement, 15d resolution, 36h takedown upon lawful order. | Report abuse button, moderation dashboard, Grievance Officer notice page, automated 24h receipt generation. | Loss of safe harbor protection (§79), criminal liability under IPC / BNS for hosting prohibited content. | Mandatory Intermediary Counsel. | **P0 (Immediate)** |
| **India** | **Consumer Protection (E-Commerce) Rules, 2020** | E-commerce entities offering goods or services to consumers in India. | **DIRECT & MANDATORY** (Paid consultations, puja bookings, digital goods). | Active and strictly enforced. | Transparent pricing, clear refund terms, freedom from dark patterns. | Disclose legal entity name, address, contact, grievance officer, refund policy, total price break-up. Prohibition of dark patterns (CCPA Guidelines 2023). | Comprehensive checkout fee summary (service + GST), explicit refund timeline tracking, no pre-ticked opt-in boxes. | CCPA investigations, misleading advertisement penalties up to ₹50 lakh, product recall/cancellation orders. | Mandatory E-Commerce Counsel. | **P0 (Immediate)** |
| **India** | **CERT-In Cyber Security Directions (2022)** | All service providers, intermediaries, data centres, and body corporate in India. | **DIRECT & MANDATORY** (Operating web applications and cloud instances). | Active and strictly enforced. | General public cybersecurity assurance. | Report specified cyber incidents within 6 hours of noticing, retain logs for 180 days within India, NTP clock synchronization with NPL/NIC. | Server audit log retention pipeline (180 days), automated incident alert routing, clock sync verification scripts. | Imprisonment up to 1 year and/or fines under Section 70B(7) of the IT Act. | Cyber Regulatory Counsel. | **P1 (Near-Term)** |
| **EU / EEA** | **GDPR (Regulation (EU) 2016/679)** | Offering goods or services to data subjects in the EU, or monitoring their behavior (Art. 3(2)). | **DIRECT & MANDATORY** upon targeting EU users (marketing, accepting EUR, language offerings). | Active since May 2018. | Access (Art. 15), Rectification (Art. 16), Erasure (Art. 17), Restriction (Art. 18), Portability (Art. 20), Object (Art. 21). | Lawful basis (Art. 6), **Explicit consent for religious data (Art. 9 Special Category)**, SCCs for cross-border transfers (Art. 46), EU Representative (Art. 27). | Geolocation-aware cookie banner, explicit Art. 9 consent checkbox, Standard Contractual Clauses (SCC) framework, 30-day SAR exporter. | Up to €20,000,000 or 4% of total worldwide annual turnover, whichever is higher (Art. 83). | Mandatory EU Privacy Counsel (GDPR Specialist). | **P0 (Prerequisite to EU Launch)** |
| **EU / EEA** | **Consumer Rights Directive (2011/83/EU)** | B2C distance contracts with consumers residing in EU member states. | **MANDATORY** for paid services rendered to EU consumers. | Active across all EU Member States. | 14-day right of withdrawal (cooling-off period) for online contracts. | Clear pre-contractual information, model withdrawal form. Digital content waiver requirement (Art. 16(m)) for immediate download. | Explicit checkbox at checkout acknowledging loss of right of withdrawal upon instant download/report generation; cancellation refund engine. | Contract voidability, full reimbursement mandates, national consumer enforcement fines. | EU Consumer Protection Counsel. | **P1 (EU Rollout Gate)** |
| **United Kingdom** | **UK GDPR & Data Protection Act 2018** | Processing personal data of individuals in the UK while offering goods/services. | **DIRECT & MANDATORY** upon serving UK residents / diaspora. | Active (Post-Brexit retained law). | Identical to EU GDPR: Access, Erasure, Correction, Portability, Objection. | Special category data conditions (Sch. 1), UK International Data Transfer Agreement (IDTA) or UK Addendum to EU SCCs, age limit 13. | UK-specific consent options, IDTA cross-border transfer documentation, age 13 digital consent validation. | Up to £17,500,000 or 4% of annual global turnover, whichever is higher. | UK Privacy Counsel. | **P1 (UK Rollout Gate)** |
| **United States** | **CCPA / CPRA (Cal. Civ. Code § 1798.100 et seq.)** | Doing business in California collecting personal data of California residents and meeting thresholds or voluntarily adopting standard. | **STANDARD OF CARE** (High-volume NRI/diaspora population in CA; sets US standard). | Active (CPRA amendments fully effective 2023). | Know/Access, Delete, Correct, Opt-Out of Sale/Sharing, **Limit Use of Sensitive Personal Info (SPI)**, Non-Discrimination. | Notice at collection, "Do Not Sell or Share My Personal Info" link, "Limit the Use of My Sensitive Personal Info" link, honor Global Privacy Control (GPC). | Client-side `Sec-GPC` header detection, Sensitive Data Limitation toggle, California specific privacy notice. | Administrative fines of $2,500 per violation ($7,500 for intentional violations or child data); private right of action for security breaches. | California Tech/Privacy Counsel. | **P1 (US Rollout Gate)** |
| **United States** | **FTC Act § 5 & ROSCA / Click-to-Cancel Rule** | Interstate commerce, online subscriptions, and automatic renewals. | **MANDATORY** if offering recurring subscriptions or astrology memberships to US users. | FTC "Click to Cancel" rule finalized Oct 2024 (effective early 2025). | Clear disclosure of automatic renewal terms, cancellation mechanism as easy as sign-up. | Prominent disclosure of billing terms, affirmative consent prior to charging, immediate online cancellation without hurdles. | 1-click subscription cancellation button in profile, renewal reminder emails 3-7 days prior to billing. | Civil penalties up to $50,120 per violation, mandatory restitution, FTC injunctions. | US Commercial/Consumer Counsel. | **P2 (Subscription Phase)** |
| **Canada** | **PIPEDA & Bill C-27 (CPPA)** | Commercial activities collecting personal information in Canada across provinces. | **MANDATORY** when serving Canadian diaspora. | Active (Bill C-27 currently under parliamentary review). | Access, accuracy, withdrawal of consent, complaint to OPC. | Meaningful consent, express consent for sensitive religious/spiritual data, reasonable security safeguards. | Consent log with explicit sensitivity markers, Canadian privacy policy supplement. | Regulatory findings, court damages, potential administrative penalties under impending CPPA up to 5% global revenue. | Canadian Privacy Counsel. | **P2 (North America Gate)** |
| **Australia** | **Privacy Act 1988 & APPs** | Australian Privacy Principles (APPs) governing entities with Australian link collecting info. | **MANDATORY** for Australian devotees. | Active (Statutory reforms ongoing). | Access (APP 12), Correction (APP 13). | APP 3.3: Sensitive information (religion/philosophical beliefs) requires consent; APP 8: Cross-border transfer accountability. | Cross-border transfer notice, explicit consent for religious data collection. | Fines up to $50 million AUD or 30% of adjusted turnover for serious or repeated interferences with privacy. | Australian Privacy Counsel. | **P2 (APAC Gate)** |
| **UAE** | **Federal Decree-Law No. 45/2021 (PDPL)** | Processing personal data of data subjects residing or working in the United Arab Emirates. | **MANDATORY** for extensive UAE/Gulf diaspora users. | Enacted Jan 2022; implementing executive regulations pending. | Access, data transfer, correction, erasure, restriction. | Clear consent, heightened protection for sensitive data (religion), cross-border transfer compliance. | Gulf-region privacy notice, strict purpose restriction on astrological and ritual requests. | Administrative fines determined by UAE Data Office regulations. | UAE / MENA Legal Counsel. | **P2 (Middle East Gate)** |
| **Singapore** | **Personal Data Protection Act (PDPA 2012)** | Collection, use, or disclosure of personal data in Singapore. | **MANDATORY** for Singaporean devotees. | Active (Significant amendments effective 2021). | Access, Correction, Withdrawal of Consent. | Consent obligation, purpose limitation, notification, protection, retention limitation, transfer limitation (comparable protection). | Transfer limitation certification, DNC registry verification for outbound promotional SMS/WhatsApp. | Up to 10% of annual turnover in Singapore or $1,000,000 SGD, whichever is higher. | Singapore Legal Counsel. | **P2 (ASEAN Gate)** |

---

## 4. International Data Inventory & Cross-Border Data Flows

### A. Data Classification & Inventory Matrix
```
[Devotee / User Terminal]
       │
       ▼  (HTTPS / TLS 1.3 - Encrypted in Transit)
[Cloudflare Edge Network / Reverse Proxy] (DDoS, WAF, Rate Limiting, Geo-Headers)
       │
       ▼  (Forwarded with Trusted Proxy Authentication)
[ISHTI Next.js 15 Web Application Server] (Vercel / Node Runtime)
       │
       ├───▶ [Client-Side Encryption Engine] (AES-256-GCM Kundli Payload Encryption)
       │
       ├───▶ [Supabase Mumbai: ap-south-1] (PostgreSQL 18 - Encrypted at Rest)
       │        ├── profiles (Identity, Sampradaya)
       │        ├── user_consents (Purpose, Version, Hash)
       │        ├── kundli_profiles (Ciphertext DOB/TOB/Coordinates)
       │        ├── booking_requests (Consultations, Pujas)
       │        └── rate_limit_events (Advisory Lock Hash)
       │
       ├───▶ [Payment Gateway] (Razorpay Sandbox -> International Aggregator: Stripe/Adyen)
       │
       └───▶ [Communications Engine] (Twilio SMS / SendGrid Email / Meta WhatsApp API)
```

| Data Category | Specific Data Elements | Where Collected | Storage Location | Processing Purpose | Applicable Features | External Subprocessors | Access Permissions | Retention & Deletion Policy | Special Classification |
|---|---|---|---|---|---|---|---|---|---|
| **Identity & Contact** | Full name, phone number, email address, avatar URL, display name. | Auth modal, registration forms, profile settings. | Supabase `profiles` (Mumbai, India). | Account authentication, service notifications, identity verification. | AppShell, Auth, Devotee Profile, Early Access. | Supabase (Cloud DB), Twilio (SMS), SendGrid (Email). | Devotee (self), Platform Admin (governance). | Retained during active account lifetime; deleted within 30 days of verified deletion request. | Personal Data (GDPR Art. 4, DPDP §2(t)). |
| **Special Category / Sensitive Data** | **Sampradaya tradition, religious lineage, deity devotion, puja intentions, prayer vows.** | Profile onboarding, puja booking questionnaires. | Supabase `profiles.sampradaya_tradition`, `booking_requests`. | Personalization of liturgical traditions, Vedic ritual officiation. | Bhakti, Puja booking, Panchang ritual recommendations. | None (internal database only). | Devotee (self), Officiating Pandit (transient session access). | Retained until user modifies profile or revokes consent; deleted upon account deletion. | **Special Category (GDPR Art. 9(1)), SPI (CCPA §1798.140). Requires Explicit Consent.** |
| **Astrological & Ephemeris Data** | Date of birth, time of birth, birth coordinates (latitude/longitude/city). | Kundli creation form (`/astro`). | Supabase `kundli_profiles` (Ciphertext fields only). | Deterministic planetary calculations, Divisional charts (D1-D60), Dasha periods. | Astro pillar, Kundli matching, Consultation sharing. | None. Planetary ephemeris engine executes server-side/client-side without cloud ML. | Devotee (self), Verified Astrologer (only upon active booking). | Cryptographically shredded upon user deletion request (key destroyed). | **Sensitive Personal Data. High Privacy Impact.** |
| **Booking & Consultation** | Scheduled slot times, service type, consultation notes, ritual venue, audio/video call room ID. | Booking flow (`/experts`, `/puja`). | Supabase `booking_requests`, `consultation_slots`. | Officiating rituals, scheduling pandits, calendar synchronization. | Experts network, Puja booking lifecycle. | Video infrastructure (e.g. Daily.co / Agora / 100ms - planned). | Devotee (client), Assigned Expert (service provider). | Retained for 7 years post-fulfillment to satisfy tax/statutory financial audit obligations. | Commercial / Contractual Data. |
| **Financial & Transaction** | Order ID, transaction amount, currency, payment status, payment method token, invoice records. | Checkout payment modal. | Supabase `booking_requests`, Payment Aggregator Vault. | Processing payments, issuing tax invoices, processing refunds. | Checkout, Order history, Refund processing. | Razorpay (India), Future International Aggregator (Stripe / Adyen). | Service Role, Finance Admin, Payment Gateway. | 7 years retention mandated by Indian Companies Act & Income Tax Act; GDPR Art. 6(1)(c) compliance. | Sensitive Financial Data. Zero raw card storage. |
| **Community & User-Generated Content** | Satsang posts, forum comments, devotional questions, prayer circle requests. | Community forums (`/community`). | Supabase database (planned community tables). | Devotional community sharing, peer discussions. | Community pillar. | Content Moderation AI (planned text filtering). | Public devotees (read), Author (write/delete), Content Scholar (moderate). | Retained while active; immediate soft-deletion upon user deletion; permanent purge within 90 days. | User Content. IT Intermediary Rules & DSA scope. |
| **Telemetry, Cookies & Device Data** | Salted IP hash, User-Agent, language preference, accessibility tokens (`data-a11y-*`), session cookies. | HTTP headers, Next.js Middleware, LocalStorage. | Edge logs, LocalStorage, `user_consents.ip_hash`. | Rate limiting, DDoS defense, accessibility persistence, language routing. | AppShell, A11y engine, I18n provider, Rate limiter. | Cloudflare (WAF/Edge). | Automated Security Daemon, Local Client Browser. | Telemetry logs rotated after 180 days (CERT-In mandate); LocalStorage cleared on client reset. | Pseudo-anonymized Technical Data. ePrivacy scope. |

---

## 5. Cross-Border Data Transfer Assessment

### A. The Inadequacy Dilemma (India as Non-Adequate Third Country)
Under GDPR Chapter V (Articles 44–49) and UK GDPR, personal data may only be transferred outside the EEA/UK to a third country if:
1. The European Commission / UK Government has issued an **Adequacy Decision** recognizing that the third country ensures an essentially equivalent level of protection; OR
2. The data exporter implements **Appropriate Safeguards** (such as Standard Contractual Clauses) accompanied by supplementary technical/organizational measures; OR
3. A specific statutory derogation applies (such as explicit informed consent under Article 49(1)(a) for occasional, non-repetitive transfers).

**Current Legal Reality:** India has **NOT** received an adequacy decision from the European Commission or the UK Information Commissioner's Office (ICO). Furthermore, the European Court of Justice (*Schrems II*, Case C-311/18) established that Standard Contractual Clauses (SCCs) are not self-sufficient; data exporters must conduct a documented **Transfer Impact Assessment (TIA)** to evaluate whether local intelligence or surveillance laws in the destination country (such as Section 69 of India's IT Act) undermine the protections of the SCCs.

### B. Risk Evaluation for ISHTI
- **Storage Centralization in Mumbai (`ap-south-1`):** Collecting personal data from EU, UK, or US devotees directly into Indian Supabase servers constitutes an international cross-border transfer subject to GDPR Article 44.
- **Special Category Data Severity:** Because astrological and sampradaya data reveals religious beliefs (Art. 9), transfers to a non-adequate third country without fortified safeguards present extreme regulatory exposure.

### C. Recommended Cross-Border Transfer Safeguard Architecture
1. **Contractual Safeguards:** Implement the **European Commission Standard Contractual Clauses (SCCs)** (Module 1: Controller-to-Controller for expert bookings; Module 2: Controller-to-Processor for vendor processing) as a standard schedule to the International Terms of Service.
2. **UK Addendum:** Execute the UK Information Commissioner's International Data Transfer Addendum to the EU Commission SCCs.
3. **Supplementary Technical Measures (The "Schrems II Shield"):**
   - **Client-Side Envelope Encryption:** Devotee birth date, birth time, and birth coordinates are encrypted on the client side using AES-256-GCM before transmission. The ciphertext payload stored in Mumbai cannot be decrypted by host-level infrastructure or surveillance without the devotee's private credentials.
   - **Zero Plaintext Coordinates:** Geographic birth coordinates are never stored in raw decimal format.
   - **Ephemeral Session Decryption:** When an accredited astrologer views a chart, decryption occurs ephemerally in volatile memory with zero server-side caching.
4. **Statutory Derogations (GDPR Art. 49(1)(a) & (b)):**
   - At the time of account creation or booking, international devotees are presented with an explicit, informed cross-border transfer notice:
     > *"By creating your ISHTI account, you acknowledge and explicitly consent that your profile and spiritual requests will be processed and securely stored in encrypted data centres located in India, where privacy standards may differ from your home jurisdiction. Your sensitive astrological records are protected with client-side AES-256-GCM envelope encryption."*

---

## 6. Global Policy Architecture

ISHTI must adopt a **Modular Global Policy Hierarchy**: a foundational global master agreement governing universal tenets, accompanied by jurisdiction-specific statutory addenda that dynamically govern devotees based on their verified location.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      ISHTI GLOBAL MASTER TERMS                         │
│   (Vedic Philosophy, Doctrinal Integrity, Account Terms, Fair Use)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   SCHEDULE A     │       │   SCHEDULE B     │       │   SCHEDULE C     │
│  India Addendum  │       │  EU & UK Addendum│       │   USA Addendum   │
│  - DPDP Act 2023 │       │  - GDPR/UK GDPR  │       │  - CCPA / CPRA   │
│  - IT Rules 2021 │       │  - Art. 9 Consent│       │  - Cal. SPI Limit│
│  - Grievance Off.│       │  - 14-day Cooling│       │  - GPC Recognition│
│  - E-Commerce R. │       │  - SCC Safeguards│       │  - FTC ROSCA Can.│
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### A. Recommended Document Catalog
1. **Master Terms of Service (`/legal/terms`):**
   - Core agreement between the devotee and ISHTI.
   - Doctrinal disclaimer: Authentic Vedic practices are offered for contemplative, religious, and cultural purposes; not a substitute for qualified medical, legal, psychiatric, or financial counsel.
   - User conduct, account security, intellectual property rights, and community standards.
2. **Master Global Privacy Policy (`/legal/privacy`):**
   - Transparent disclosure of what data is collected, why it is processed, storage locations, and security measures.
   - Clear enumeration of devotee rights across all supported regions.
3. **Jurisdiction-Specific Schedules:**
   - **Schedule 1: India Compliance Schedule** (DPDP 2023 Data Fiduciary details, Resident Grievance Officer name/email/phone, CERT-In compliance notice, consumer redressal channels).
   - **Schedule 2: European Economic Area & UK Privacy Notice** (GDPR Articles 13/14 notice, legal bases table, Article 9 Special Category consent framework, SCC cross-border transfer disclosures, DPO contact, supervisory authority complaint rights).
   - **Schedule 3: United States & California Consumer Privacy Notice** (CCPA/CPRA Notice at Collection, categories of PI and SPI collected, "Do Not Sell or Share My Personal Information" disclosure, "Limit the Use of My Sensitive Personal Information" mechanisms, non-discrimination guarantee).
   - **Schedule 4: Rest of World Addendum** (Canada PIPEDA, Australia Privacy Act, UAE PDPL, Singapore PDPA specific statutory disclosures).
4. **Cancellation, Refund & Booking Governance Policy (`/legal/refunds`):**
   - Categorized cancellation windows and refund schedules distinguishing instant digital goods from live consultation time slots.
5. **AI Usage & Astrological Transparency Charter (`/legal/ai-policy`):**
   - Clear disclosure of deterministic algorithms vs. generative AI assistants. Zero training on devotee spiritual queries.
6. **Acceptable Use & Community Safety Standards (`/legal/acceptable-use`):**
   - Zero tolerance for hate speech, communal discord, blasphemous harassment, predatory commercial occult claims, or fear-mongering.

---

## 7. Architecture Proposal for M05 Work Packages

### Work Package 1: Legal Policy Centre & Versioning Engine
- **Implementation:** Next.js route group `apps/web/app/legal/(policies)/...` utilizing clean markdown/MDX rendering with typography optimized for readability.
- **Dynamic Policy Versioning Schema:**
  ```sql
  CREATE TABLE public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL, -- e.g. 'terms-of-service', 'privacy-policy'
    version TEXT NOT NULL, -- e.g. '2026.1'
    jurisdiction TEXT NOT NULL DEFAULT 'GLOBAL', -- 'GLOBAL', 'IN', 'EU', 'US', 'UK'
    title TEXT NOT NULL,
    content_hash TEXT NOT NULL, -- SHA-256 of canonical text
    effective_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (slug, version, jurisdiction)
  );

  CREATE TABLE public.user_policy_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.legal_documents(id) ON DELETE RESTRICT,
    ip_hash TEXT,
    user_agent TEXT,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```

### Work Package 2: Privacy and Consent Management
- **Jurisdiction-Aware Banner:** Cloudflare / edge header `cf-ipcountry` (or Next.js geolocation headers) detects visitor region:
  - **EU / UK Visitors:** Displays strict prior opt-in banner for all non-essential cookies and analytics. Explicit modal for religious data processing consent (GDPR Art. 9).
  - **India Visitors:** Granular, unbundled purpose toggles matching DPDP Act §6.
  - **California / US Visitors:** Banner with prominent "Do Not Sell or Share My Personal Information" and "Limit the Use of My Sensitive Personal Information" actions. Global Privacy Control (`Sec-GPC` header) automatically respected.
- **Evolution of `public.user_consents`:** Add `legal_basis` (`consent`, `contract`, `legitimate_interest`), `jurisdiction_code` (`IN`, `EU`, `US`, etc.), and `revocation_reason`.

### Work Package 3: Data Access, Correction & Deletion (SAR Engine)
- **Subject Access Request (SAR) Architecture:**
  ```sql
  CREATE TABLE public.privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('access_export', 'correction', 'erasure', 'restriction')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'processing', 'completed', 'rejected')),
    jurisdiction TEXT NOT NULL DEFAULT 'IN',
    rejection_reason TEXT,
    due_date TIMESTAMPTZ NOT NULL, -- 30 days default
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
- **Self-Service Data Export Pipeline:** Devotees can trigger a automated JSON export of all profile data, unencrypted consultation history, and consent logs directly from their dashboard.
- **Cryptographic Shredding for Erasure:** Deleting a devotee's account triggers cryptographic erasure: the customer's master encryption keys and database records are purged. Transaction records required by financial laws (tax invoices) are anonymized and decoupled from identity.

### Work Package 4: Refund, Cancellation & Billing Governance
- **Differentiated Cancellation Policy Engine:**
  ```sql
  CREATE TABLE public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.booking_requests(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    requested_amount_paise INTEGER NOT NULL,
    refunded_amount_paise INTEGER,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'declined', 'processed')),
    gateway_refund_id TEXT,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
  );
  ```
- **Rules Matrix:**
  - *Digital Instant Reports (Kundli PDF):* Immediate delivery upon checkout. Devotee must tick an explicit waiver: *"I consent to immediate digital delivery and acknowledge that I thereby lose my statutory right of withdrawal under EU/UK consumer law."*
  - *Expert Pandit Consultations:* Free cancellation > 24 hours prior. 50% refund between 24h and 4h. Non-refundable within 4h (compensating Pandit for blocked time). 100% refund if Pandit fails to attend.
  - *Temple Pujas:* Materials purchased 48h prior; non-refundable within 48h.

### Work Package 5: AI Usage & Astrological Disclosure Engine
- **Algorithmic Transparency:** Astrological chart generation is deterministic ephemeris calculation based on standard Swiss Ephemeris / Lahiri Ayanamsha mathematics, NOT generative AI hallucinations.
- **AI Assist Disclosure:** Any synthetic commentary, language translation, or conversational assistant will carry a permanent, unmistakable indicator:
  > *"Generated with the assistance of ISHTI Vedic AI. Sacred interpretations are provided for contemplation and personal reflection. Consult accredited Acharyas for solemn life rituals."*
- **Privacy Assurance:** Devotee birth charts and spiritual queries are never transmitted to third-party public LLM providers for model training.

### Work Package 6: Acceptable Use & Content Safety (Intermediary Due Diligence)
- **Takedown & Grievance Pipeline:**
  - Mandatory "Report Post" and "Report Consultation" UI controls across `/community` and `/experts`.
  - Automated ticket generation logging timestamp, reporter ID, reported content URL, and statutory clock.
  - 24-hour SLA for acknowledgement, 36-hour SLA for unlawful content takedown (Indian IT Rules 2021 & EU DSA).

### Work Package 7: Security Incident & Vulnerability Disclosure
- **Incident Response Protocol:** Formal 6-hour CERT-In incident notification runbook; 72-hour GDPR / DPDP Act breach notification pipeline.
- **Coordinated Vulnerability Disclosure (CVD):** Published `security.txt` (`/.well-known/security.txt`) providing encrypted PGP keys and safe harbor rules for ethical security researchers.

### Work Package 8: Compliance Administration & Audit
- **Compliance Console:** Dedicated administrative portal accessible strictly to `role = 'platform_admin'`.
- Allows authorized compliance officers to review pending SAR requests, verify statutory deadlines, audit role changes, and view anonymized consent trends without exposing devotee birth chart ciphertexts.

---

## 8. Gap and Risk Register

| Risk ID | Risk Category | Current State (Baseline) | Target Required State | Jurisdictions Affected | Severity | Dependencies | Recommended Resolution | Verification Method | Legal Counsel Action |
|---|---|---|---|---|---|---|---|---|---|
| **GAP-01** | **Regulatory Disclosures** | No formal `/legal/terms`, `/legal/privacy`, or `/legal/refunds` public routes exist in web application. | Modular Legal Policy Centre rendering global terms and regional schedules with policy version tracking. | Global, India, EU, UK, US. | **HIGH** | Web routes, UI layout. | Implement MDX legal policy routes with version tracking and footer integration. | Route inspection, Next.js build verification, 200 HTTP status. | Draft and review terms with qualified counsel. |
| **GAP-02** | **Special Category Religious Data** | Sampradaya tradition and astrological queries collected without explicit GDPR Art. 9 / CCPA SPI affirmative consent. | Explicit, affirmative, unbundled consent checkboxes designating religious data sensitivity prior to collection. | EU, UK, US (California, Virginia, Colorado). | **CRITICAL** | Consent UI, DB schema. | Add Art. 9 explicit consent modal for EU/UK users; Sensitive Data limitation for US users. | Automated E2E test verifying checkbox requirement before DB insertion. | Review Art. 9 consent wording with EU Privacy Counsel. |
| **GAP-03** | **Cross-Border Transfer Safeguards** | Data collected globally into Mumbai Supabase (`ap-south-1`) without executed SCCs or Transfer Impact Assessment. | Standard Contractual Clauses (SCCs) and UK IDTA formally adopted with documented technical safeguards. | EU, UK. | **CRITICAL** | Legal terms, encryption. | Incorporate SCCs as Schedule B; document AES-256-GCM envelope encryption as Schrems II technical safeguard. | Verify SCC schedule inclusion and encryption audit documentation. | Formal TIA review by EU Data Protection Counsel. |
| **GAP-04** | **Consumer Refund Framework** | Single hardcoded `amount_inr` field; no formalized refund and cancellation policy or waiver mechanism. | Multi-category refund policy with statutory 14-day EU cooling-off waivers for instant digital reports. | Global, EU, UK, India. | **HIGH** | Booking DB, Checkout UI. | Implement `refund_requests` table and checkout waiver checkbox for immediate digital downloads. | Test checkout flow with and without waiver acceptance. | Consumer Protection Counsel review. |
| **GAP-05** | **Data Subject Rights (SAR/Erasure)** | No programmatic pipeline for devotees to download their data or request right to be forgotten. | Self-service SAR export tool and cryptographic shredding deletion workflow within 30-day SLA. | India (DPDP), EU (GDPR), UK, US. | **HIGH** | Database RPC, Auth context. | Build `privacy_requests` pipeline and automated account deletion cascade with financial record anonymization. | Test SAR JSON generation and verified account erasure. | Privacy Counsel sign-off on retention exceptions. |
| **GAP-06** | **Cookie & Telemetry Governance** | LocalStorage tokens (`ishti_a11y_prefs_v1`, `ishti_locale_preference`) set without prior EU consent banner. | Intelligent, region-aware cookie banner offering Accept All / Reject Non-Essential / Customize. | EU (ePrivacy), UK (PECR), US (GPC). | **MEDIUM** | Frontend banner, middleware. | Implement cookie banner with GPC header auto-detection; essential a11y preferences exempt. | Test with EU IP headers and inspect client cookie/storage writes. | Privacy Counsel review of cookie classifications. |
| **GAP-07** | **Grievance Redressal Officer** | No designated Indian Resident Grievance Officer published with physical address and contact info. | Published Grievance Officer details meeting IT Rules 2021 and DPDP Act §13 statutory mandates. | India. | **HIGH** | Legal pages, Support UI. | Add statutory Grievance Officer details to India Schedule and footer. | Inspect published notice and verify 24h acknowledgement mechanism. | Indian Intermediary Counsel review. |
| **GAP-08** | **AI & Astrological Transparency** | Devotees lack formal policy disclosures regarding algorithmic vs. AI assistance in horoscopes and consultations. | Published AI Usage Charter explicitly stating deterministic ephemeris mathematics and zero model training. | Global, EU (AI Act), US (FTC). | **MEDIUM** | Legal pages, Astro UI. | Author `/legal/ai-policy` and add inline Vedic AI attribution tags on synthetic commentary. | Inspect policy route and visual attribution badges. | Emerging Tech Counsel review. |

---

## 9. M05 Milestone Implementation Roadmap (Gates G0–G5)

```
[Gate G0: Discovery & Architecture] (Current Baseline - Read-Only Audit)
       │
       ▼
[Gate G1: Legal Policy Centre & Foundational DDL]
       │  • Author Master Terms, Global Privacy, Refunds, AI Policy
       │  • Deploy legal_documents & privacy_requests DDL (Staging only)
       │
       ▼
[Gate G2: Jurisdiction-Aware Consent & Cookie Management]
       │  • Geolocation header detection & Regional Cookie Banner
       │  • Explicit GDPR Art. 9 Religious Data Consent Checkbox
       │  • Global Privacy Control (GPC) signal detection
       │
       ▼
[Gate G3: Data Subject Rights (SAR) & Cryptographic Erasure]
       │  • Self-service data export pipeline (JSON download)
       │  • Cryptographic shredding deletion engine
       │  • 30-day statutory SLA tracking
       │
       ▼
[Gate G4: Refund Lifecycle & Booking Governance Engine]
       │  • Digital report immediate-download cooling-off waiver
       │  • Pandit consultation tiered cancellation schedule
       │  • Multi-currency pricing schema foundation
       │
       ▼
[Gate G5: Compliance Admin Console & Pre-Production Acceptance]
          • Platform admin privacy request dashboard
          • Security incident runbook & CERT-In 6h logging verification
          • Full verification suite (110+ security tests, 100% brand parity)
```

### Gate Breakdown
- **Gate G0 (Current Phase):** Global legal discovery, regulatory applicability matrix, data flow audit, gap register. *Deliverable: This report.*
- **Gate G1 (Policy Centre & Core DDL):** Implement public legal routes (`/legal/*`); author master policies and regional schedules; provision `legal_documents` and `privacy_requests` tables on staging database `zrjptpkhtklfgnovdrny`.
- **Gate G2 (Consent & Cookie Engine):** Implement region-aware consent modal; deploy explicit GDPR Article 9 consent for astrological data; activate GPC detection.
- **Gate G3 (SAR & Right to be Forgotten):** Implement data subject rights pipeline; automate profile export; implement cryptographic shredding.
- **Gate G4 (Refund & Billing Governance):** Implement digital product waiver checkboxes; build consultation cancellation logic; prepare multi-currency data structures.
- **Gate G5 (Compliance Console & Verification):** Implement compliance management views for platform admins; conduct end-to-end security regression suite; prepare country-by-country launch checklist.

---

## 10. Country-by-Country Launch Readiness Framework

ISHTI must not launch globally in a single unvetted release. A phased territorial rollout ensures compliance before marketing in foreign jurisdictions:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TERRITORIAL ROLLOUT TIERS                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
[TIER 1: FOUNDATION]       [TIER 2: DIASPORA CORE]       [TIER 3: GLOBAL EXPANSION]
- India (Domestic)         - United States               - European Union (EU/EEA)
- Singapore                - United Kingdom              - Australia & New Zealand
- UAE / Gulf Region        - Canada                      - Rest of World
```

### Launch Prerequisites by Tier

#### Tier 1: Foundation (India, UAE, Singapore)
- **Legal Requirements:** DPDP Act 2023 compliance, IT Rules 2021 Grievance Officer, Consumer Protection E-Commerce Rules, UAE PDPL notice, Singapore PDPA notification.
- **Payment Currency:** Domestic INR (UPI, RuPay, Netbanking, Cards) + International Cards enabled on Razorpay.
- **Technical Safeguards:** AES-256-GCM Kundli encryption, CERT-In 180-day log retention, 6h incident alert workflow.

#### Tier 2: Diaspora Core (United States, United Kingdom, Canada)
- **Legal Requirements:** CCPA/CPRA California Notice at Collection with GPC support; FTC ROSCA click-to-cancel subscription flow; UK GDPR compliance with UK Addendum to SCCs; Canada PIPEDA compliance with express consent.
- **Payment Currency:** USD ($) and GBP (£) multi-currency presentation; international card checkout.
- **Technical Safeguards:** UK IDTA cross-border transfer documentation, California Sensitive Data Limitation toggle.

#### Tier 3: Global Expansion (European Union / EEA, Australia, Rest of World)
- **Legal Requirements:** Full EU GDPR compliance; Article 9 explicit consent modal for religious data; European Commission SCCs executed; 14-day Consumer Rights Directive cooling-off waiver; Australian Privacy Principles cross-border disclosure.
- **Payment Currency:** EUR (€) and AUD ($) pricing; regional VAT/GST tax calculation.
- **Technical Safeguards:** Prior opt-in cookie banner (ePrivacy compliance); Transfer Impact Assessment (TIA) signed by EU counsel; EU Representative designated (Art. 27).

---

## 11. Decisions Requiring Operator Approval

The following architectural and business decisions require operator review and approval prior to Gate G1 execution:

1. **Entity Structure & Place of Establishment:** Confirmation of the contracting legal entity name, registered office address, and jurisdiction of incorporation (default: Indian private limited company).
2. **Designation of Statutory Officers:**
   - Appointment of the **Resident Grievance Officer** (India) as required by IT Intermediary Rules 2021 and Consumer Protection Rules.
   - Appointment of the **Data Protection Officer (DPO)** or Privacy Officer under DPDP Act 2023 and GDPR.
3. **Refund Policy Tolerance:** Approval of the tiered consultation cancellation schedule (e.g. 100% refund > 24h, 50% between 24h and 4h, 0% < 4h) and physical puja samagri non-refundable window (48h).
4. **Third-Party Subprocessor Authorization:** Approval of third-party infrastructure providers that process user communications and payments (Cloudflare, Supabase, Twilio, SendGrid, Razorpay, future international payment gateways).
5. **International Launch Phasing:** Formal approval of the 3-Tier territorial rollout strategy (Tier 1: India/UAE/SG -> Tier 2: US/UK/CA -> Tier 3: EU/AU).

---

## 12. Decisions Requiring Qualified Legal Counsel

The following matters exceed engineering determination and must be formally drafted, reviewed, or certified by qualified legal counsel in the relevant jurisdictions:

1. **Master Terms & Arbitration Enforceability (Indian & Global Counsel):**
   - Enforceability of mandatory arbitration clauses and class action waivers under Indian law, US law (Federal Arbitration Act), and EU/UK consumer protection standards (where consumer forum jurisdiction cannot be contractually eliminated).
2. **GDPR Article 9 Special Category Consent Wording (EU Legal Counsel):**
   - Exact statutory phrasing for explicit consent to process data revealing religious and philosophical beliefs in connection with Hindu astrological and liturgical traditions.
3. **Transfer Impact Assessment (TIA) & SCC Execution (EU/UK Privacy Counsel):**
   - Legal formalization of the Schrems II Transfer Impact Assessment for transmitting personal data to India, validating that ISHTI's AES-256-GCM envelope encryption provides adequate supplementary technical protection.
4. **Consumer Protection & Digital Content Waiver (EU/UK Consumer Counsel):**
   - Statutory compliance of the 14-day withdrawal waiver language for immediate digital downloads under EU Consumer Rights Directive Article 16(m).
5. **US State Privacy Law Compliance (California Tech Counsel):**
   - Validation that ISHTI's California privacy disclosures and Sensitive Personal Information limitation controls satisfy CCPA/CPRA, and confirmation of statutory thresholds.

---

## 13. Sources and References

1. **Government of India:**
   - *Digital Personal Data Protection Act, 2023* (Act No. 22 of 2023), Gazette of India, August 11, 2023. [https://www.meity.gov.in/content/digital-personal-data-protection-act-2023](https://www.meity.gov.in/content/digital-personal-data-protection-act-2023)
   - *Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021* (as amended). [https://www.meity.gov.in/content/information-technology-intermediary-guidelines-and-digital-media-ethics-code-rules-2021](https://www.meity.gov.in/content/information-technology-intermediary-guidelines-and-digital-media-ethics-code-rules-2021)
   - *Consumer Protection (E-Commerce) Rules, 2020*, Ministry of Consumer Affairs, Food and Public Distribution, July 23, 2020.
   - *Guidelines for Prevention and Regulation of Dark Patterns, 2023*, Central Consumer Protection Authority (CCPA), November 30, 2023.
   - *CERT-In Directions under Section 70B(6) of the IT Act, 2000*, Ministry of Electronics and Information Technology, April 28, 2022.
2. **European Union:**
   - *Regulation (EU) 2016/679 (General Data Protection Regulation - GDPR)*, Official Journal of the European Union, April 27, 2016. [https://eur-lex.europa.eu/eli/reg/2016/679/oj](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
   - *Directive 2011/83/EU on Consumer Rights*, Official Journal of the European Union, October 25, 2011.
   - *European Commission Implementing Decision (EU) 2021/914 on standard contractual clauses for the transfer of personal data to third countries*, June 4, 2021.
   - *EDPB Recommendations 01/2020 on measures that supplement transfer tools to ensure compliance with the EU level of protection of personal data*, November 10, 2020.
   - *Court of Justice of the European Union, Data Protection Commissioner v Facebook Ireland Limited and Maximillian Schrems (Schrems II)*, Case C-311/18, July 16, 2020.
3. **United Kingdom:**
   - *Data Protection Act 2018*, legislation.gov.uk. [https://www.legislation.gov.uk/ukpga/2018/12/contents](https://www.legislation.gov.uk/ukpga/2018/12/contents)
   - *UK International Data Transfer Agreement (IDTA) and Addendum*, UK Information Commissioner's Office (ICO), March 2022.
   - *Consumer Rights Act 2015*, legislation.gov.uk.
4. **United States:**
   - *California Consumer Privacy Act of 2018 (CCPA) as amended by the California Privacy Rights Act of 2020 (CPRA)*, Cal. Civ. Code § 1798.100 et seq. [https://oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
   - *Federal Trade Commission (FTC) Final Rule on Subscriptions and Negative Option Plans ("Click to Cancel")*, 16 CFR Part 425, October 2024.
   - *Restore Online Shoppers' Confidence Act (ROSCA)*, 15 U.S.C. §§ 8401–8405.
   - *Children's Online Privacy Protection Act (COPPA)*, 15 U.S.C. §§ 6501–6506.
5. **International Standards:**
   - *Canada Personal Information Protection and Electronic Documents Act (PIPEDA)*, Office of the Privacy Commissioner of Canada.
   - *Australia Privacy Act 1988 & Australian Privacy Principles*, Office of the Australian Information Commissioner (OAIC).
   - *United Arab Emirates Federal Decree-Law No. 45/2021 on Personal Data Protection*, UAE Data Office.
   - *Singapore Personal Data Protection Act 2012 (PDPA)*, Personal Data Protection Commission (PDPC).

---

## 14. Governance Recommendation

**Milestone M05 Gate G0 (Discovery & Architecture) is COMPLETE.**

The findings contained herein establish the legal, technical, and regulatory foundation necessary to author production legal terms, implement jurisdiction-aware consent controls, configure cross-border transfer protections, and build the data subject rights engine in Gate G1 through G5.

**Invariants Maintained:**
- Working tree remains clean of unapproved changes.
- Remote production Supabase (`zxwkfnvmmxoojewhvsdc`) remains quarantined.
- No code, database schemas, or migrations were modified during this read-only audit.

*Awaiting operator review and formal Gate G0 approval.*

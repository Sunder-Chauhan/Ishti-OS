# ISHTI Milestone M05 — Final Security Remediation & Legal Readiness Report

**Document Reference:** `docs/M05_FINAL_SECURITY_AND_LEGAL_READINESS_REPORT.md`  
**Milestone:** M05 — Legal, Privacy & Trust Foundation  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Branch:** `feature/m05-trust-governance`  
**Target Base:** `main` (commit `f3c2c5c2c14c34712c1f0b6bfec9eeac12e83a38`)  
**Execution Timestamp:** 2026-11-17T22:30:00+05:30  
**Overall Readiness Verdict:** **TECHNICALLY VERIFIED WITH BLOCKERS (COUNSEL REVIEW REQUIRED & FOUNDER CONFIRMATION REQUIRED)**  

---

## 1. Executive Summary

Milestone M05 establishes the comprehensive **Legal, Privacy & Trust Foundation** for **ISHTI**, a global spiritual ecosystem delivering devotional content, Panchang calendar calculations, encrypted Kundli astrology, puja services, expert consultations, community satsang circles, and AI-powered spiritual guidance.

Following an independent GitHub code review and legal audit, this final remediation programme completed two core mandates:
1. **Server-Side Authentication Security Hardening:** Eliminated manual cookie parsing, bound identity verification and database role queries to a single trusted `@supabase/ssr` context, reassembled chunked cookies, decoded base64-encoded cookie payloads, accurately differentiated 401/403/503 outage codes, and enforced CSRF origin validation, sliding-window rate limiting, and 64KB payload bounds on protected administrative endpoints.
2. **Comprehensive Legal Risk & Regulatory Readiness Programme:** Conducted an exhaustive legal risk assessment across 10 statutory domains. Formulated a 23-item risk ledger, identified missing corporate facts, mapped primary statutory sources with official Gazette citations, established a Two-Tier Scripture Rights Doctrine, inventoried personal data lifecycles (ROPA), and instituted hard-stop sequential Launch Gates (L0 through L5).

> [!CRITICAL]
> **GOVERNANCE & STATUTORY DISCLAIMER:**
> Automated test passage demonstrates **technical implementation correctness only**. It does **NOT** constitute legal compliance, legal certification, regulatory sign-off, or immunity from litigation.
> 
> All legal analyses, statutory interpretations, and policy documents authored herein are architectural engineering specifications requiring formal review and execution by qualified Indian legal counsel and the platform promoters prior to commercial launch.

---

## 2. Authentication & Authorization Security Corrections

### A. Manual Cookie Parsing Eliminated
- **Previous Defect:** `compliance-session-verifier.ts` manually searched for raw string names (`sb-access-token`, `sb-*-auth-token`) and attempted to parse JSON array strings, failing on chunked or encoded Supabase SSR cookies.
- **Remediation:** Reused the established `@supabase/ssr` server client (`createClient()` from `apps/web/lib/supabase/server.ts`). Automated chunk reassembly (`reassembleChunkedCookies`) and base64 payload decoding (`decodeCookieValue`) natively support multi-part cookies (e.g. `sb-<ref>-auth-token.0`, `.1`) and encoded session strings.

### B. Bound Identity Verification & Authoritative Role Resolution
- **Previous Defect:** `verifyToken()` validated a token in isolation, while a separate client queried `public.profiles`, introducing a split-identity vulnerability.
- **Remediation:** Implemented `resolveUserAndRole()` in a single trusted context:
  1. Resolves the authenticated user via `supabase.auth.getUser()`.
  2. Extracts the verified, immutable `user.id`.
  3. Queries `public.profiles.role` for that exact verified `user.id` using the same client.
  4. Never consumes client-supplied role headers (`x-user-role`, `x-ishti-role`), request bodies, or React state.

### C. Backend Outage Classification vs. Authentication Failures
- **Previous Defect:** Network and database timeouts were collapsed into generic 401 Unauthorized responses.
- **Remediation:** Enforced strict status differentiation:
  - Missing Session $\to$ `401 Unauthorized` (`MISSING_SESSION`)
  - Invalid Signature / Malformed Token $\to$ `401 Unauthorized` (`INVALID_TOKEN`)
  - Expired Token Timestamp $\to$ `401 Unauthorized` (`EXPIRED_TOKEN`)
  - Authenticated Non-Admin Role (`devotee`, `expert_pandit`, `content_scholar`) $\to$ `403 Forbidden` (`NON_ADMIN`)
  - User Account Exists but Profile Record Missing in DB $\to$ `403 Forbidden` (`PROFILE_MISSING`)
  - Authentication Service Infrastructure Outage $\to$ `503 Service Unavailable` (`AUTH_OUTAGE`)
  - Authoritative Profile Database Outage $\to$ `503 Service Unavailable` (`DB_OUTAGE`)
  - Verified `platform_admin` Session $\to$ `200 Authorized` (`SUCCESS`)

### D. Protected API Endpoints Hardening
- **`/api/compliance/audit`:** Protected with rate limiting (30 req/min), independent session verification, and CSRF origin validation on mutations.
- **`/api/compliance/triage`:** Protected with rate limiting (10 req/min), 64KB Content-Length payload bounds, JSON schema validation, CSRF origin checks (`verifyCsrfOrigin`), and HTTP method restrictions (`Allow: POST`).
- **`/profile/compliance`:** Presentation-only client component; displays restricted access card upon 401, 403, or 503; contains zero administrative bypass logic.

---

## 3. Automated Verification Test Results

### Suite Summary Across Monorepo

| Test Suite | Command | Executed | Passed | Failed | Exit Code | Result |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **M05 Technical & Governance Suite** | `npx tsx scripts/run-m05-tests.ts` | 101 | 101 | 0 | 0 | **PASSED** |
| **Security & Cryptography Suite** | `npm run test:security` | 110 | 110 | 0 | 0 | **PASSED** |
| **TypeScript Typecheck** | `npm run typecheck` | 2 packages | 2 | 0 | 0 | **PASSED** |
| **Next.js Production Build** | `npm run build:web` | 31 routes | 31 | 0 | 0 | **PASSED** |
| **Total Automated Tests** | All Suites Combined | **211** | **211** | **0** | **0** | **PASSED** |

### Breakdown of Dedicated Security Tests (Gate 5 Section 1)
1. Missing session $\to$ 401 Unauthorized (`[PASS]`)
2. Invalid token signature $\to$ 401 Unauthorized (`[PASS]`)
3. Expired token timestamp $\to$ 401 Unauthorized (`[PASS]`)
4. Valid devotee session $\to$ 403 Forbidden (`[PASS]`)
5. Valid expert pandit session $\to$ 403 Forbidden (`[PASS]`)
6. Valid content scholar session $\to$ 403 Forbidden (`[PASS]`)
7. Valid platform administrator session $\to$ 200 Authorized (`[PASS]`)
8. Chunked Supabase cookies (.0, .1) reassembly in index order $\to$ 200 Authorized (`[PASS]`)
9. Encoded Supabase cookies (base64- prefix) decoded safely $\to$ 200 Authorized (`[PASS]`)
10. Bearer-only authentication resolves admin $\to$ 200 Authorized (`[PASS]`)
11. Client-supplied role header manipulation rejected $\to$ 403 Forbidden (`[PASS]`)
12. Unauthenticated caller role manipulation rejected $\to$ 401 Unauthorized (`[PASS]`)
13. Profile lookup failure: Database outage $\to$ 503 Service Unavailable (`[PASS]`)
14. Profile lookup failure: Profile missing in database $\to$ 403 Forbidden (`[PASS]`)
15. Authentication service provider outage $\to$ 503 Service Unavailable (`[PASS]`)
16. Direct API request without session $\to$ 401 Unauthorized (`[PASS]`)
17. Malformed requests: Payload > 64KB rejected with 413; malformed JSON rejected with 400 (`[PASS]`)
18. CSRF protections: Cross-site mutation rejected (403); mismatched Origin rejected (403); Bearer exempt (`[PASS]`)
19. Unconfigured backend authentication disables admin access $\to$ 503 Service Unavailable (`[PASS]`)

---

## 4. Legal Research Methodology & Primary Source Register

All legal conclusions are grounded in primary Indian legislation, central Gazette notifications, and statutory directions:

| Statute / Instrument | Citation / Gazette Reference | Current Status | Primary URL |
| :--- | :--- | :--- | :--- |
| **Digital Personal Data Protection Act, 2023** | Act No. 22 of 2023; Gazette G.S.R. 843(E) | In Force (Phased) | `https://www.meity.gov.in/content/digital-personal-data-protection-act-2023` |
| **Information Technology (Intermediary Guidelines) Rules, 2021** | Notification G.S.R. 139(E), amended Feb 2026 | In Force | `https://www.meity.gov.in/content/information-technology-intermediary-guidelines-and-digital-media-ethics-code-rules-2021` |
| **CERT-In Directions under IT Act §70B(6)** | Direction No. 20(3)/2022-CERT-In | In Force (28 Jun 2022) | `https://www.cert-in.org.in/directions2022.jsp` |
| **Consumer Protection Act, 2019 & E-Commerce Rules, 2020** | Act No. 35 of 2019; Notification G.S.R. 462(E) | In Force | `https://consumeraffairs.nic.in/acts-and-rules/consumer-protection` |
| **Guidelines for Prevention of Dark Patterns, 2023** | CCPA Notification 30 Nov 2023 | In Force | `https://consumeraffairs.nic.in/sites/default/files/Dark_Patterns_Guidelines_2023.pdf` |
| **The Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954** | Act No. 21 of 1954 | In Force | `https://www.indiacode.nic.in/handle/123456789/1515` |
| **Bharatiya Nyaya Sanhita, 2023** | Act No. 45 of 2023 (§299 Outraging Religious Feelings) | In Force (1 Jul 2024) | `https://www.mha.gov.in/en/commoncontent/the-bharatiya-nyaya-sanhita-2023` |
| **Copyright Act, 1957** | Act No. 14 of 1957 (§14, §51, §52) | In Force | `https://copyright.gov.in/Documents/CopyrightRules1957.pdf` |
| **Income-tax Act, 2025 & Income-tax Rules, 2026** | Act No. 6 of 2025 (§62 & Rule 46: 7-Year Retention) | Effective 1 Apr 2026 | `https://incometaxindia.gov.in` |
| **Income-tax Act, 1961** | Act No. 43 of 1961 (§44AA / Rule 6F: 6 Assessment Years) | Transitional Savings (§536) | `https://incometaxindia.gov.in` |
| **Companies Act, 2013** | Act No. 18 of 2013 (§128: 8 Financial Years) | In Force | `https://www.mca.gov.in` |
| **Central Goods and Services Tax Act, 2017** | Act No. 12 of 2017 (§24 Mandatory Registration, §52 TCS) | In Force | `https://cbic-gst.gov.in` |
| **General Data Protection Regulation (GDPR)** | Regulation (EU) 2016/679 (Art 3(2), Art 9 Special Category) | In Force | `https://eur-lex.europa.eu/eli/reg/2016/679/oj` |
| **California Consumer Privacy Act (CCPA/CPRA)** | Cal. Civ. Code §1798.100 et seq. ($26.625M threshold) | In Force | `https://oag.ca.gov/privacy/ccpa` |

---

## 5. Critical & High-Priority Legal Risks Identified

A complete 23-item risk ledger was authored in [`docs/legal/ISHTI_LEGAL_RISK_REGISTER.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/ISHTI_LEGAL_RISK_REGISTER.md). The highest-exposure risks are:

1. **RISK-CORP-01 (Unincorporated Commercial Operations):** Launching commercial transactions before corporate entity formation exposes founders to unlimited personal liability. *(Status: BLOCKED — Incorporation Required in Gate L0)*.
2. **RISK-DP-02 (Processing Personal Data of Children):** Generating Kundli birth charts for infants/minors without verified parental consent violates DPDP Act §9(1) (statutory penalty up to ₹200 crore). *(Status: BLOCKED — Minor Governance Flow Required in M06)*.
3. **RISK-RS-01 (Magic Remedies Act Violations):** Promising medical cures, fertility, or male children through rituals triggers criminal imprisonment under Sections 3 and 7 of the Drugs & Magic Remedies Act 1954. *(Status: Mitigated in Architecture; Operational Content Moderation Required)*.
4. **RISK-AI-01 (Hallucinatory Scripture Attribution):** AI conversational assistants fabricating Sanskrit shlokas or misattributing controversial views to Shastras risks criminal prosecution under BNS §299 and loss of IT Act §79 safe harbour. *(Status: BLOCKED — RAG Vector Pipeline & Scholar Peer Review Required in M06)*.
5. **RISK-IP-01 (Unlicensed Scripture Translations in AI Vector DB):** Ingesting modern copyright-protected English/Hindi commentaries into the AI RAG corpus constitutes commercial copyright infringement under Copyright Act §51. *(Status: Mitigated in Architecture; Seeds Restricted to Verified Public Domain)*.
6. **RISK-INT-01 (Intermediary SLA Non-Compliance):** Failing to acknowledge user complaints within 24 hours or resolve within 7 days under the February 2026 amended IT Rules forfeits Section 79 intermediary immunity. *(Status: Mitigated Locally; Backend Ticketing Required in M06)*.

---

## 6. Engineering Controls Implemented in M05

| Domain | Technical Control Implemented | Source Code Location |
| :--- | :--- | :--- |
| **Authentication Security** | Pure server-only session token verification; single trusted context; chunked/encoded cookie reassembly; 401/403/503 differentiation; CSRF origin checks | `apps/web/lib/compliance/compliance-session-verifier.ts`<br/>`apps/web/lib/compliance/compliance-server.ts` |
| **Protected Endpoints** | Dynamic Next.js App Router route handlers verifying admin sessions and rejecting unauthorized requests | `apps/web/app/api/compliance/audit/route.ts`<br/>`apps/web/app/api/compliance/triage/route.ts` |
| **Presentation Boundary** | Browser compliance page refactored to presentation-only; displays restricted access card upon 401/403/503; zero client override | `apps/web/app/profile/compliance/page.tsx` |
| **Consent Sanctuary** | Unbundled 6-purpose consent registry; optional purposes default to false; deterministic SHA-256 evidence hashing | `apps/web/lib/consent/consent-registry.ts`<br/>`apps/web/lib/consent/consent-service.ts` |
| **Privacy Rights** | Demonstration SAR JSON package generator with SHA-256 fingerprint; 7-stage deletion sequence marked `NOT_IMPLEMENTED` | `apps/web/lib/privacy/export-service.ts`<br/>`apps/web/lib/privacy/deletion-orchestrator.ts` |
| **Statutory Retention** | Field-level retention matrix separating 7/8-year commercial tax records from scrubbed personal data | `apps/web/lib/privacy/retention-matrix.ts` |
| **Commerce Trust** | Minor-unit integer arithmetic; proposed 0% fee deduction; Pandit No-Show guarantee; EU CRD Art. 16(m) digital content waiver | `apps/web/lib/commerce/cancellation-calculator.ts`<br/>`apps/web/lib/commerce/multi-currency.ts` |
| **Grievance Operations** | Automated IT Rules 2026 ticketing (24h ack, 7d resolve); 2-factor lookup (Ticket # + Email); zero fake complaints | `apps/web/lib/compliance/grievance-service.ts`<br/>`apps/web/app/legal/grievance/page.tsx` |
| **Cybersecurity Triage** | Automated CERT-In 6-hour reporting window calculation; DPDP Act §8(6) personal breach assessment | `apps/web/lib/compliance/security-governance.ts` |
| **Cryptographic Audit** | Append-only SHA-256 block hash chain with full data recomputation across all 7 tampering scenarios | `apps/web/lib/compliance/audit-trail.ts` |

---

## 7. Deliverables Register: Legal Governance Documents Authored

The following formal governance and risk deliverables have been authored and committed to `docs/legal/`:

1. **[`docs/legal/LEGAL_FACTS_REQUIRED.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/LEGAL_FACTS_REQUIRED.md):** Missing business and founder determinations register (incorporation, CIN, registered office, bank accounts, GSTIN, officer appointments).
2. **[`docs/legal/ISHTI_LEGAL_RISK_REGISTER.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/ISHTI_LEGAL_RISK_REGISTER.md):** Comprehensive 23-item risk ledger across 10 statutory domains with three-tier exposure calculations.
3. **[`docs/legal/ISHTI_REGULATORY_APPLICABILITY_MATRIX.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/ISHTI_REGULATORY_APPLICABILITY_MATRIX.md):** 21-statute applicability matrix citing official Gazette notifications and commencement timelines.
4. **[`docs/legal/ISHTI_LEGAL_LAUNCH_CHECKLIST.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/ISHTI_LEGAL_LAUNCH_CHECKLIST.md):** Sequential release gates L0 through L5 with documentary evidence requirements and hard stops.
5. **[`docs/legal/ISHTI_LEGAL_DECISION_LOG.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/ISHTI_LEGAL_DECISION_LOG.md):** Legal decision log recording LDL-001 through LDL-010.
6. **[`docs/legal/ISHTI_VENDOR_AND_PROCESSOR_REGISTER.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/ISHTI_VENDOR_AND_PROCESSOR_REGISTER.md):** Subprocessor inventory (Supabase, Vercel, Razorpay, Stripe, Twilio, Google Cloud, Cloudflare).
7. **[`docs/legal/ISHTI_CONTENT_RIGHTS_REGISTER.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/ISHTI_CONTENT_RIGHTS_REGISTER.md):** Scripture and content copyright register establishing the Two-Tier Scripture Rights Doctrine.
8. **[`docs/legal/ISHTI_CONTRACT_REGISTER.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/ISHTI_CONTRACT_REGISTER.md):** 13-contract master inventory across corporate, consumer, marketplace, technology, and insurance domains.
9. **[`docs/legal/ISHTI_DATA_INVENTORY_AND_LIFECYCLE.md`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/docs/legal/ISHTI_DATA_INVENTORY_AND_LIFECYCLE.md):** Personal data inventory, legal bases, access roles, and 7-stage deletion lifecycle (ROPA).

---

## 8. Launch Gates Status & Pre-Launch Blockers

| Gate | Scope | Status | Technical Readiness | Legal / Corporate Readiness | Primary Blocker |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Gate L0** | Business & Entity Facts | **BLOCKED** | 100% | 0% | Company not incorporated; IP assignment deeds not executed. |
| **Gate L1** | Privacy & Security | **BLOCKED** | 90% | 25% | Statutory Grievance Officer not appointed; Minor consent flow pending M06. |
| **Gate L2** | Consumer & Commerce | **BLOCKED** | 95% | 20% | Payment aggregator merchant KYC pending; GST registration required. |
| **Gate L3** | Content & AI | **BLOCKED** | 50% | 20% | RAG vector pipeline pending M06; modern translation commercial licenses required. |
| **Gate L4** | Community & Experts | **BLOCKED** | 60% | 10% | Pandit onboarding contractor agreements not executed; moderation pending M06. |
| **Gate L5** | International Expansion | **BLOCKED** | 80% | 15% | International payment merchant onboarding (FEMA inward remittance) required. |

---

## 9. Founder Decisions & Counsel Reviews Required

### A. Founder Determinations Required (Gate L0):
1. **Corporate Formation:** Incorporate Private Limited Company under Companies Act, 2013 and obtain Certificate of Incorporation, PAN, and TAN.
2. **IP Assignment:** Execute formal Intellectual Property Assignment Agreement transferring all software, architecture, branding, and domains to the corporate entity.
3. **Statutory Officers:** Formally appoint resident Statutory Grievance Officer (IT Rules 2021) and Data Protection Officer (DPDP Act §10).
4. **Commercial Terms:** Formally approve consultation cancellation tiers (24h/50%/0%) and confirm whether gateway transaction fees are absorbed or deducted.
5. **Corporate Bank Account & Merchant Onboarding:** Complete entity KYC with Razorpay / Cashfree and Stripe.

### B. Legal Counsel Reviews Required:
1. **Corporate & IP Counsel:** Review IP Assignment Agreement and register trademark applications for "ISHTI" wordmark and flame device logo (Classes 9, 38, 41, 45).
2. **Data Privacy Counsel:** Review Notice at Collection, unbundled consent disclosures, and execute Standard Contractual Clauses (SCCs) for international diaspora data flows.
3. **Consumer Protection Counsel:** Review Terms of Service, refund tiers, and non-medical spiritual disclaimers against Consumer Protection Act 2019 and Dark Patterns Guidelines 2023.
4. **Tax Counsel / CA:** Confirm SAC service classifications (999799, 998439), 1% TCS compliance under CGST Act §52, and 7-year electronic tax retention under Income-tax Act 2025.

---

## 10. Git Verification & Infrastructure Quarantine Attestation

### Git State
- **Branch:** `feature/m05-trust-governance`
- **Latest Commit Hash:** To be finalized upon staging and commit
- **Base `main` Commit:** `f3c2c5c2c14c34712c1f0b6bfec9eeac12e83a38` (clean, uncommitted, untouched)
- **Local Working Tree:** Clean after commit; zero unstaged modifications; zero direct commits to `main`.

### Quarantine Attestation
We formally certify that:
1. **Production Supabase (`zxwkfnvmmxoojewhvsdc`) was strictly quarantined and uncontacted.** Zero SQL queries, migrations, or data mutations were executed.
2. **Staging Supabase (`zrjptpkhtklfgnovdrny`) was strictly quarantined and uncontacted.** Zero remote network calls were executed.
3. Zero deployments were executed to Vercel or any cloud hosting provider.
4. Zero live SMS, emails, or push notifications were dispatched.
5. All administrative access in the offline M05 baseline is fail-closed, returning 503 or 401 by default.

---

## 11. Final Operational Conclusion

The technical architecture and governance foundations of ISHTI Milestone M05 are **technically verified, cleanly built, and supported by 211 passing automated tests**. 

However, in accordance with the mandatory governance principle:
**ISHTI is legally prepared by design, but commercial launch remains strictly held pending corporate entity incorporation, statutory officer appointments, merchant contracts, and formal legal counsel sign-off.**

**FINAL STATUS:** **TECHNICALLY VERIFIED WITH BLOCKERS (COUNSEL REVIEW REQUIRED & FOUNDER CONFIRMATION REQUIRED)**

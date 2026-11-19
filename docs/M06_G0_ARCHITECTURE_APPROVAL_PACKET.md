# ISHTI Milestone M06 — Architecture Decision Approval Packet (G0 Gate)

**Document Reference:** `docs/M06_G0_ARCHITECTURE_APPROVAL_PACKET.md`  
**Milestone:** M06 — Core Backend Persistence, Distributed Invariants & Production Shielding  
**Repository:** `https://github.com/Sunder-Chauhan/Ishti-OS`  
**Branch:** `feature/m05-trust-governance`  
**Date:** 19 November 2026  
**Auditor Roles:** Principal Software Architect, Application Security Engineer, Privacy Lead & Infrastructure Lead  

---

## 1. Executive Summary & Purpose

This Approval Packet presents the eight foundational architecture decisions for Milestone M06 for explicit founder/operator review and approval. 

In accordance with strict M06 G0 gate rules:
- **No decision is marked "APPROVED" merely because its technical recommendation is sound.**
- Every decision below is marked **`STATUS: PENDING OPERATOR APPROVAL`**.
- Milestone M06 implementation (including branch creation, schema migrations, and code changes) remains **strictly paused** until the operator reviews this packet and provides explicit written authorization.

---

## 2. Compact Decision Approval Sections

```mermaid
flowchart TD
    subgraph Decision Packet [Pre-Implementation Decisions Pending Approval]
        DEC1["DEC-M06-001:\nDistributed Rate Limiting"]
        DEC2["DEC-M06-002:\nVercel Origin Shielding"]
        DEC3["DEC-M06-003:\nGrievance Ingress & Timers"]
        DEC4["DEC-M06-004:\nMulti-Copy Privacy Erasure"]
        DEC5["DEC-M06-005:\nAudit Ledger Immutability"]
        DEC6["DEC-M06-006:\nAnonymous Intake RPC"]
        DEC7["DEC-M06-007:\nCommerce & Tax Decoupling"]
        DEC8["DEC-M06-008:\nScripture Search Decoupling"]
    end
    
    Operator(["Founder / Operator Review"]) --> DEC1 & DEC2 & DEC3 & DEC4 & DEC5 & DEC6 & DEC7 & DEC8
```

---

### DEC-M06-001: Distributed Rate Limiting & Concurrency Engine
- **Decision ID:** `DEC-M06-001`
- **Recommended Option:** **Upstash Redis Serverless Primary with Strict Fail-Closed Policy on Sensitive Routes**
  * Use Upstash Redis REST/TLS with atomic Lua sliding-window counters across all serverless instances.
  * Secondary PostgreSQL advisory locking limiter (`public.check_rate_limit()`) used strictly for local developer testing and CI.
  * If Upstash Redis is unreachable or times out (>150ms), **sensitive mutation routes (`/api/auth/otp`, `/api/commerce/checkout`, `/api/compliance/triage`, `/api/compliance/privacy-request`) MUST FAIL CLOSED (HTTP 503 `RATE_LIMIT_UNAVAILABLE`)**.
  * Zero silent local-memory fallback on sensitive endpoints.
  * Public read-only endpoints degrade gracefully to conservative local rate limiting (20 req/min).
- **Alternatives Rejected & Why:**
  1. *Universal Process-Local Fallback:* Rejected because concurrent requests across Vercel serverless replicas multiply allowable quotas, enabling distributed brute-force attacks.
  2. *Universal PostgreSQL Advisory Lock Limiting:* Rejected because opening database transactions for every incoming request saturates transaction connection poolers (PgBouncer) under high ingress spikes.
  3. *Self-Hosted Valkey Container:* Rejected for M06 baseline due to container OS patching and cluster management overhead during serverless application persistence phase.
- **Risks Accepted:** Sensitive mutation routes become temporarily unavailable (503) if Upstash Redis experiences a global outage.
- **Risks Still Open:** Upstash AWS `ap-south-1` Mumbai round-trip latency from Vercel edge/serverless runtime is **UNVERIFIED UNTIL EMPIRICALLY BENCHMARKED**. Phase 2 execution requires running a comprehensive benchmark harness measuring p50/p95/p99 latency, cold vs warm execution, high concurrency (100–1,000 reqs), timeout/error rates, fail-closed enforcement, and budget/volume assumptions.
- **Owner:** Principal Software Architect & Application Security Engineer
- **Required Approval:** Founder / Engineering Lead
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-002: Ingress Origin Shielding on Vercel Hosting
- **Decision ID:** `DEC-M06-002`
- **Classification Status:** **`RECOMMENDED — DEPLOYMENT VERIFICATION REQUIRED (PENDING OPERATOR APPROVAL)`**
- **Recommended Option:** **Cloudflare CIDR Firewall Allowlisting + Cryptographic Shared Proxy Secret + Direct Host Header Protection (Proposed Vercel Baseline)**
  * Restrict Vercel incoming HTTP traffic strictly to Cloudflare's published IPv4 and IPv6 CIDR blocks via Vercel Firewall rules.
  * Cloudflare Transform Rules inject a 32-byte random secret header `x-ishti-proxy-secret` on origin pulls; Next.js middleware drops requests lacking the verified secret with HTTP 403.
  * Direct `*.vercel.app` domain bypass mitigated by inspecting the `Host` header in middleware and redirecting/rejecting unauthenticated direct access.
  * **Critical Qualification:** Cloudflare CIDR allowlisting plus a shared secret header is currently a **proposed Vercel-compatible approach, NOT an empirically verified origin security control**. It must NOT be claimed that Cloudflare blocks direct Vercel access unless deployment-level tests demonstrate it.
  * Explicitly note: A shared secret is an application-layer safeguard, **NOT equivalent to mutual TLS (mTLS)**. Full Cloudflare AOP client-cert verification is incompatible with standard Vercel Pro.
  * Containerized contingency: If Vercel origin shielding is compromised, migrate Next.js to Fly.io/ECS behind **Cloudflare Tunnel (`cloudflared`)** to close all inbound public ports.
- **Mandatory Empirical Deployment Verification Tests Required:**
  1. Direct `*.vercel.app` deployment URL access bypass.
  2. Direct access to alternative Vercel aliases or preview URLs.
  3. Requests reaching origin without the expected proxy header.
  4. Spoofed proxy header requests from untrusted external IPs.
  5. Secret rotation dual-window validation test.
  6. Host-header manipulation / host poisoning tests.
  7. Next.js middleware bypass or unprotected route tests (e.g. static assets vs API).
  8. Requests reaching origin through unexpected network paths (IPv6 vs IPv4, peering).
- **Alternatives Rejected & Why:**
  1. *Cloudflare Authenticated Origin Pulls (AOP with mTLS):* Rejected as technically unsupported on standard Vercel Pro plan without costly Enterprise custom edge contracts.
  2. *Secret Header Alone:* Rejected because discovering the origin domain or IP allows direct bypass if firewall rules are absent.
- **Risks Accepted:** Origin shielding on Vercel relies on edge middleware execution and firewall rule maintenance rather than cryptographic network-layer mTLS handshake termination.
- **Risks Still Open:** Empirical origin shielding tests must be executed in staging prior to production cutover; secret rotation requires a 90-day operational runbook supporting dual-secret acceptance windows.
- **Owner:** DevOps & Infrastructure Security Lead
- **Required Approval:** Founder / Infrastructure Lead
- **Status:** **`RECOMMENDED — DEPLOYMENT VERIFICATION REQUIRED (PENDING OPERATOR APPROVAL)`**

---

### DEC-M06-003: Grievance Architecture, Timestamp Provenance, Clock-Start Invariant & Audit Integrity Realignment (ADR-040)
- **Decision ID:** `DEC-M06-003`
- **Recommended Option:** **Next.js Route Handler (`POST /api/compliance/triage`), Timestamp Provenance, Multi-Allegation & Evidence Schema (`grievance_cases` -> `grievance_allegations` / `grievance_evidence` -> `grievance_clocks`), Unguessable CSPRNG References, Clock-Start Invariant & Tamper-Evident Events**
  * Next.js Route Handler selected as the sole public intake interface over Server Actions due to REST standard contract, HTTP status codes, mobile app compatibility, and bounded stream reading.
  * **Timestamp Provenance Taxonomy:** Strictly separates five distinct timestamps:
    - `case_received_at` *(System-Captured, Immutable)*: Ingress timestamp of parent case container at the Route Handler.
    - `allegation_received_at` *(System-Captured, Immutable)*: Ingestion timestamp of a specific claim or URL.
    - `evidence_received_at` *(System-Captured, Immutable)*: Ingestion timestamp of an uploaded file, screenshot, or URL payload.
    - `statutory_triggered_at` *(Assigned / Derived via Authorized Classification)*: Legally applicable timestamp initiating statutory countdown.
    - `classified_at` *(System-Captured at Decision)*: Timestamp when the officer records the classification decision.
  * **The Clock-Start Invariant & Triggering Timestamp Anchor:**
    - Statutory deadlines are **strictly computed from the legally applicable triggering event timestamp (`statutory_triggered_at`)**, NOT from classification time:
      $$\text{applicable\_deadline} = \text{statutory\_triggered\_at} + \text{statutory\_duration}$$
    - **Classification NEVER resets, restarts, or postpones a statutory clock.** For example, an emergency complaint received at 10:00 and classified at 11:30 has its 2-hour deadline set to 12:00 (leaving 30 minutes for operational takedown). If classification occurs after 12:00, the clock immediately records as `BREACHED_PENDING_ACTION` with an automatic P0 escalation.
  * **Late-Arriving Evidence & Scenario 8 Correction:**
    - If a user files a general commercial complaint at 10:00 and later at 11:30 submits a supplemental URL/screenshot alleging non-consensual impersonation under Rule 3(2)(b):
      $$\text{statutory\_triggered\_at} = \text{evidence\_received\_at} = 11:30$$
      $$\text{deadline} = 11:30 + 2\text{ hours} = 13:30$$
    - The platform is **NOT** penalized for time prior to receiving the allegation (which backdating to 10:00 would have done), nor granted an unlawful extension (which setting from classification time at 11:45 would have done). Compliance Officers document legal reasoning in the classification RPC, and legal uncertainties are marked `PENDING COUNSEL CONFIRMATION`.
  * **Separation of Raw Request Bytes from Sanitized Application Data:**
    - Raw request bytes ($\le 32$ KB) are decoded into UTF-8 and hashed immediately: `raw_request_sha256 = SHA-256(raw_bytes)`.
    - Sanitized data is stored in `sanitized_payload_json JSONB`, accompanied by `sanitization_metadata JSONB`. Sanitized JSONB is **never described as the original raw submission**.
  * **Relational Multi-Allegation, Evidence & Typed Clocks Data Model:**
    - `public.grievance_cases` (parent submission with unguessable `public_reference`), `public.grievance_allegations` (multi-allegation / multi-URL decomposition), `public.grievance_evidence` (1-to-many evidentiary attachments and URLs with quarantined storage), and `public.grievance_clocks` (typed independent statutory and operational clock instances).
    - `public.grievance_events` is **append-only and tamper-evident**, protected by trigger `trg_grievance_events_immutable` (raising SQLSTATE `42501` on UPDATE/DELETE) and cryptographic hash chaining (`event_hash`). Lawful redactions append signed `REDACTION_TOMBSTONE` events.
  * **Public Case-Reference Security & Anti-Enumeration Gates:**
    - Replaced predictable `ISHTI-CASE-YYYY-XXXX` with cryptographically unguessable CSPRNG tokens: `ISHTI-GRV-` + 16 Crockford Base32 characters (80 bits entropy, e.g. `ISHTI-GRV-7M9K-2WX4-BQ8R-5TY1`).
    - Public status lookup requires secondary verification (public reference + verified complainant email + OTP).
    - Rate-limited to 5 lookups per 15 minutes per IP with generic uniform 404/403 responses.
  * **Seven Distinct Categories & Classification Gate:** Intake enters a review queue (`PENDING_CLASSIFICATION`). Statutory clocks are bound **strictly upon verified legal determination** by a Compliance Officer:
    1. *Statutory Intermediary Grievance (Rule 3(2)(a)(i)):* 24h statutory ack (`statutory_triggered_at + 24 hours`), 7d statutory disposal (`statutory_triggered_at + 7 days`). Requires documented due diligence nexus under Rule 3(1).
    2. *Voluntary Platform Complaint:* General feedback/bugs. Zero statutory clock; internal operational SLTs only.
    3. *Expert / Pandit Service Dispute:* Commercial booking quality, cancellations, refunds. Zero statutory clock.
    4. *Privacy-Rights Request:* DPDP Act §§11–13 rights (access, correction, erasure). Routed to `public.privacy_requests`.
    5. *Qualifying Content Removal Request:*
       - *5a (Rule 3(2)(b)):* Emergency sexual content / impersonation. **Action / takedown within 2 hours of receipt** (`statutory_triggered_at + 2 hours`). Zero statutory ack clock.
       - *5b (Proviso to Rule 3(2)(a)(i)):* **Expedited removal within 36 hours of receipt** (`statutory_triggered_at + 36 hours`) for content specifically referred to in Rule 3(1)(b), plus 24h statutory ack (`statutory_triggered_at + 24 hours`). *(Not a generic 36-hour grievance disposal clock).*
    6. *Court Orders & Reasoned Government Intimations (Rule 3(1)(d)):* **Removal or access disablement within 3 hours of service** (`statutory_triggered_at + 3 hours`) from receipt of qualifying actual-knowledge order/intimation within statutory Article 19(2) scope. *(Zero statutory acknowledgement deadline; zero generic grievance disposal deadline).*
    7. *Statutory Confidential Blocking Directions (IT Act §69A):* **Immediate confidential compliance** under 2009 Blocking Rules; direction-specified requirements (no fixed 36h duration); penal consequences under Section 69A(3).
  * **Incomplete Requests & Clock Pause Rules Protocol:**
    - Incomplete submissions flagged `AWAITING_CLARIFICATION`.
    - Clarification requests do **NOT automatically pause or reset statutory clocks** without written Indian legal counsel confirmation. Zero pause permitted under Rule 3(2)(b) and Rule 3(1)(d); pause rules for ordinary grievances require formal legal counsel confirmation.
  * Decouple statutory deadlines from internal operational targets (SLTs: 30m triage SLT for emergency/court claims, 2h standard; 12h ack, 48h resolution for standard complaints; 30m review, 1h removal for Rule 3(1)(d) and Rule 3(2)(b)).
- **Alternatives Rejected & Why:**
  1. *Server Actions for Public Ingress:* Rejected because Server Actions use React flight protocol serialization, preventing standard REST integration for mobile apps or external complainants.
  2. *Single 24h Blanket Timeline:* Rejected as legally incorrect; failed to meet the strict 2-hour takedown mandate for Rule 3(2)(b) content and 3-hour mandate for Rule 3(1)(d) court orders.
  3. *Unverified User-Driven Statutory Clock Binding:* Rejected because untrusted external input cannot unilaterally bind statutory deadlines without legal applicability verification.
  4. *Clock-Start from Classification Timestamp (`now() + ...`):* Rejected because delaying classification would unconstitutionally and unlawfully extend statutory deadlines.
  5. *Single Flat Table for Multi-Allegation Submissions:* Rejected because a single submission often contains both an urgent content removal claim and unrelated commercial dispute items that require separate legal handling.
  6. *Backdating Late Evidence to Case Receipt:* Rejected because penalizing the platform for time elapsed prior to complainant submitting actionable claims is factually impossible and operationally unviable.
  7. *Sequential Predictable Case Identifiers:* Rejected because predictable patterns allow enumeration attacks and leak platform case volumes.
- **Risks Accepted:** The 2-hour window under Rule 3(2)(b) and 3-hour window under Rule 3(1)(d) require an active Grievance Officer on-call alerting rotation.
- **Risks Still Open:** Formal written opinion from Indian legal counsel required to verify applicability classifications, safe-harbour risk posture, and pause rules before commercial launch.
- **Owner:** Legal Engineering Lead & Compliance Officer
- **Required Approval:** Founder & Legal Counsel
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-004: Multi-Copy Privacy Erasure & Backup Retention Lifecycle
- **Decision ID:** `DEC-M06-004`
- **Recommended Option:** **15-Point Multi-Stage Erasure State Machine with Cryptographic DEK Shredding and 30-Day Backup Expiry Policy**
  * Reject equating key deletion with complete erasure. Execute an 8-stage state machine across all 15 personal data copies (primary DB, related tables, Kundli ciphertext, search indexes, vector embeddings, Redis caches, server logs, analytics, export files, storage buckets, database backups, vendor logs, job queues, push tokens, and KMS audit logs).
  * Cryptographically shred per-profile AES-256 Data Encryption Keys (DEKs), rendering Kundli ciphertext mathematically irrecoverable across all historical database backups.
  * Confirm that the **30-day backup expiry window is a technical operational policy choice, NOT a statutory deadline**. Immutable database backups rotate on a rolling 30-day lifecycle; disaster recovery restores replay the **Deletion Tombstone Manifest** archived in external WORM storage.
  * Document lawful retention exceptions (Income-tax Act, 2025 §62 7-year retention for financial books of account; IT Rules 3-year dispute records) in `public.privacy_requests.retained_records_summary`.
- **Alternatives Rejected & Why:**
  1. *Single-Table SQL DELETE:* Rejected because personal data remains lingering across caches, logs, backups, and vendor systems.
  2. *Immediate Backup Modification:* Rejected as technically impossible on PostgreSQL WAL snapshots without corrupting block integrity.
- **Risks Accepted:** Personal data remains in encrypted physical backups for up to 30 days until natural backup rollover occurs (protected by tombstone replay runbook).
- **Risks Still Open:** Requires legal counsel verification of the retention exception list.
- **Owner:** Privacy Engineering Lead & Cryptography Architect
- **Required Approval:** Founder & Legal Counsel
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-005: Audit Ledger Immutability & Record-Category Retention Schedule
- **Decision ID:** `DEC-M06-005`
- **Recommended Option:** **8-Layer Defense-in-Depth Hierarchy (SHA-256 Merkle Chains + Daily Signed Roots + Cloudflare R2 Object Lock in Compliance Mode) with Statutory Retention Matrix**
  * Discontinue claims of "absolute immutability" via database triggers alone. Enforce an 8-layer integrity hierarchy: application semantics $\to$ SQL triggers $\to$ privilege separation $\to$ Merkle hash chaining $\to$ daily signed roots $\to$ secondary cloud account WORM Object Lock in Compliance Mode $\to$ automated verification daemons $\to$ disaster recovery tombstones.
  * Replace blanket 7-year retention with a statutory Record-Category Retention Matrix:
    - *Financial Books & Invoices:* **7 Years** (Income-tax Act, 2025 §62 / Rule 46).
    - *User Consent Records & History:* **Active Account + 3 Years** (DPDP Act §6).
    - *Grievance Records & Evidence:* **3 Years** (IT Rules / Limitation Act).
    - *ICT Security & Ingress Access Logs:* **180 Days** (CERT-In Directions).
    - *Ephemeral Debug Logs:* **14 to 30 Days** (Internal operational policy).
- **Alternatives Rejected & Why:**
  1. *Database Trigger Immutability Alone:* Rejected because database superusers (`postgres`) can bypass triggers via `ALTER TABLE ... DISABLE TRIGGER`.
  2. *Blanket 7-Year Retention:* Rejected because retaining personal user logs without statutory mandate violates DPDP Act §8(7) data minimization principles.
- **Risks Accepted:** Privileged database administrators can alter local records, but alterations are immediately detected via daily Merkle root discrepancy against external WORM storage.
- **Risks Still Open:** Requires provisioning an isolated secondary cloud account for Cloudflare R2 / AWS S3 WORM storage.
- **Owner:** Application Security Engineer & Legal Counsel
- **Required Approval:** Founder & Legal Counsel
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-006: Server-Mediated Anonymous Public Intake & RPC Security
- **Decision ID:** `DEC-M06-006`
- **Recommended Option:** **Dedicated Route Handler with Zod Schema Bounds Calling Restricted `SECURITY DEFINER` RPC Granted Strictly to `service_role`**
  * Revoke all direct table INSERT/UPDATE/DELETE permissions from PostgREST `anon` and `public` roles (`REVOKE ALL ON public.grievance_tickets FROM anon, public`).
  * Anonymous public intake accepted exclusively via Route Handler `POST /api/compliance/triage`.
  * Route Handler validates input with Zod, caps payload at 32 KB, enforces Layer 1 IP rate limiting (3 req / 10 min), and calls `public.submit_anonymous_grievance` RPC using server-only `service_role`.
  * RPC is marked `SECURITY DEFINER` with fixed `search_path = public, pg_temp`; execution privilege is granted **STRICTLY TO `service_role`** (`REVOKE EXECUTE FROM PUBLIC, anon`).
  * Client never receives direct database access; service-role key is never exposed to the browser.
- **Alternatives Rejected & Why:**
  1. *Granting INSERT to anon in PostgREST:* Rejected as unsafe; exposes raw database schema to direct injection and unmetered spam floods.
  2. *Granting EXECUTE on RPC to anon:* Rejected because untrusted clients could invoke the RPC directly, bypassing Next.js rate limiting and Zod bounds.
- **Risks Accepted:** Serverless Next.js functions bear the computational overhead of payload parsing and rate limit enforcement prior to database insertion.
- **Risks Still Open:** Cloudflare Turnstile integration required if botnets coordinate distributed low-frequency spam floods.
- **Owner:** Application Security Engineer & Backend Architect
- **Required Approval:** Founder & Application Security Lead
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-007: Scope Decoupling: Milestone M06 Persistence vs. Milestone M07 Commerce Engine
- **Decision ID:** `DEC-M06-007`
- **Recommended Option:** **Decouple Financial Accounting, Double-Entry Ledgers, and Tax Automation to Milestone M07 (Require Mandatory CA Written Sign-off Prior to Activation)**
  * Core Milestone M06 focuses strictly on essential persistence: rate limiting, consent, privacy erasure, audit ledger, grievance redressal, and origin shielding.
  * Milestone M07 implements double-entry financial ledgers, Razorpay webhook idempotency, and configurable tax rules (`public.tax_configuration_rules`).
  * Real automated tax withholding (0.5% GST TCS under §52; 0.1% TDS under Section 194-O / 2025 Act §393) and e-invoicing remains disabled until a practicing Chartered Accountant provides formal written certification.
- **Alternatives Rejected & Why:**
  1. *Implementing Financial Engine in M06:* Rejected because tax determinations, marketplace ECO contracts, and pandit commission splits require professional CA review that would delay core persistence.
- **Risks Accepted:** Marketplace booking mutations in M06 remain stubbed; commercial billing cannot occur until Milestone M07.
- **Risks Still Open:** Formal engagement of Chartered Accountant for written tax certification.
- **Owner:** Principal Software Architect, Founder & Chartered Accountant
- **Required Approval:** Founder & Chartered Accountant
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-008: Scope Decoupling: Milestone M06 Persistence vs. Milestone M08 Scripture Search Engine
- **Decision ID:** `DEC-M06-008`
- **Recommended Option:** **Decouple Scripture Catalog Persistence, Scholar Workflows, and `pgvector` Semantic Search to Milestone M08**
  * Core Milestone M06 establishes user data persistence and security invariants.
  * Milestone M08 implements scripture catalog schemas, scholar curation workflows, Sanskrit full-text search, and `pgvector` hybrid embeddings following formal copyright attribution clearance.
- **Alternatives Rejected & Why:**
  1. *Implementing Scripture Search in M06:* Rejected because contemporary commentaries and translations require ongoing Vedic scholar copyright clearance (M05 seed for Rigveda 10.191.2 is marked `pending_peer_review` and `pending_clearance`).
- **Risks Accepted:** Public knowledge search remains static during M06.
- **Risks Still Open:** Formal copyright review of English/Hindi Vedic translations by qualified scholars.
- **Owner:** Principal Software Architect & Vedic Scholar
- **Required Approval:** Founder & Vedic Scholar
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

## 3. Operator Approval Execution Sign-Off Block

| Decision Reference | Recommended Option Summary | Current Engineering Status | Operator Verdict | Operator Signature / Initials | Date |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **DEC-M06-001** | Upstash Redis Primary + Fail-Closed Sensitive Routes | Latency Unverified (Pending Benchmark) | `PENDING APPROVAL` | ____________________ | ______ |
| **DEC-M06-002** | Cloudflare CIDR Allowlisting + Shared Secret Header on Vercel | Proposed (Deployment Verification Required) | `PENDING APPROVAL` | ____________________ | ______ |
| **DEC-M06-003** | Route Handler `/api/compliance/triage` + Timestamp Provenance + Typed Clocks + Unguessable CSPRNG References + Tamper-Evident Events | Reconciled to Timestamp Provenance, Clock-Start Invariant & Typed Clocks | `PENDING APPROVAL` | ____________________ | ______ |
| **DEC-M06-004** | 15-Point Multi-Copy Erasure + DEK Shredding + 30d Backup Expiry Policy | Architecture Complete | `PENDING APPROVAL` | ____________________ | ______ |
| **DEC-M06-005** | 8-Layer Defense (Merkle Chains + R2 WORM) + Retention Matrix | Architecture Complete | `PENDING APPROVAL` | ____________________ | ______ |
| **DEC-M06-006** | Server-Mediated Ingress + `SECURITY DEFINER` RPC strictly for `service_role` | Architecture Complete | `PENDING APPROVAL` | ____________________ | ______ |
| **DEC-M06-007** | Decouple Commerce to M07 + Mandatory CA Written Certification | Scope Decoupled | `PENDING APPROVAL` | ____________________ | ______ |
| **DEC-M06-008** | Decouple Scripture Catalog & `pgvector` Search to M08 | Scope Decoupled | `PENDING APPROVAL` | ____________________ | ______ |

---

## 4. Multi-Dimensional Milestone M06 G0 Status Breakdown
> [!WARNING]
> **GOVERNANCE INTEGRITY MANDATE:**  
> In accordance with strict architectural audit rules, G0 criteria are **NOT marked satisfied merely because they have been documented**. Empirical verification and legal approvals remain distinct operational gates.

| Evaluation Dimension | Current Formal Status | Audit Evidence & Detailed Findings |
| :--- | :---: | :--- |
| **1. Architecture Recommendation** | **`COMPLETE`** | All 8 core architectural decisions (DEC-M06-001 through DEC-M06-008) have been comprehensively specified, alternatives evaluated, failure modes modeled, and trade-offs documented across 7 M06 planning deliverables. |
| **2. Statutory Mapping** | **`CORRECTED & RECONCILED`** | Fully reconciled against official Gazette Notification G.S.R. 843(E) (DPDP Act phased commencement) and the consolidated IT Rules 2021 as amended 10 February 2026 (including corrigendum): Rule 3(2)(b) emergency removal within 2h from receipt, Rule 3(1)(d) court/govt actual-knowledge removal/disablement within 3h from service (zero statutory ack/disposal clock), Proviso to Rule 3(2)(a)(i) expedited content removal within 36h from receipt for Rule 3(1)(b) violations, Rule 3(2)(a)(i) 24h ack & 7d disposal from receipt, and IT Act §69A confidential blocking orders. Timestamp provenance strictly distinguishes `case_received_at`, `allegation_received_at`, `evidence_received_at`, `statutory_triggered_at`, and `classified_at`. Clock-start invariant strictly enforced (statutory deadlines computed from legally applicable triggering timestamps, never postponed by classification); late-arriving evidence (Scenario 8) anchored to evidence receipt; relational multi-allegation schema (`grievance_cases` -> `grievance_allegations` / `grievance_evidence` -> `grievance_clocks`) deployed; unguessable CSPRNG public references (`ISHTI-GRV-XXXX`) enforced; `grievance_events` protected by append-only trigger and hash chaining; pause rules marked as requiring counsel confirmation. |
| **3. Infrastructure Compatibility** | **`PROPOSED (NOT EMPIRICALLY VERIFIED)`** | Ingress shielding via Cloudflare CIDR firewall allowlisting + shared proxy secret (`x-ishti-proxy-secret`) and host-header protection is architecturally proposed for Vercel Pro. However, it is **not yet verified in a live deployment environment**. |
| **4. Infrastructure Empirical Verification** | **`PENDING DEPLOYMENT BENCHMARKS`** | Upstash Redis `ap-south-1` Mumbai latency, Vercel edge runtime round-trips, and the 8-point origin shielding bypass test suite (direct `*.vercel.app`, spoofed headers, alias bypass) are **unverified pending empirical benchmark testing in Phase 2 & Phase 5**. |
| **5. Database Migration Plan** | **`REVIEWED WITH ROLLBACK LIMITATIONS DOCUMENTED`** | Migration DDL schemas (4 forward migrations) and RLS security models have been fully authored. Migration reversibility is rigorously categorized into 6 operational classes; naive down-script assumptions have been eliminated; backup and restore verification is mandated prior to destructive changes. |
| **6. Legal Counsel Approval** | **`PENDING INDEPENDENT COUNSEL REVIEW`** | Platform intermediary classifications, commercial terms, disclaimers under Consumer Protection Act 2019, Rule 4 notice texts, and grievance clock pause rules are documented but await formal written opinions from external Indian legal counsel (`APP-LEG-001` through `APP-LEG-006`). |
| **7. Operator Approval** | **`PENDING OPERATOR SIGN-OFF`** | Final implementation authorization on branch `feature/m06-backend-persistence` remains strictly paused awaiting founder/operator countersignature of the Decision Register and G0 Approval Packet. |

> [!NOTE]
> **NEXT ACTION:**
> The operator may grant approval by countersigning the approval block or by instructing the agent:
> *"I approve the M06 G0 Architecture Decision Approval Packet (DEC-M06-001 through DEC-M06-008). Proceed with creating branch `feature/m06-backend-persistence`."*

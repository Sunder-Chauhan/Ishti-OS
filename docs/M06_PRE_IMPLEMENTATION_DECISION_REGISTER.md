# ISHTI Milestone M06 — Pre-Implementation Decision Register (Final G0 Validation)

**Document Reference:** `docs/M06_PRE_IMPLEMENTATION_DECISION_REGISTER.md`  
**Milestone:** M06 — Core Backend Persistence, Distributed Invariants & Production Shielding  
**Repository:** `https://github.com/Sunder-Chauhan/Ishti-OS`  
**Revision Date:** 19 November 2026  
**Auditor Roles:** Principal Software Architect, Application Security Engineer, Privacy Lead & Infrastructure Lead  

---

## 1. Purpose & Governance Protocol

This register records the exhaustive evaluation, technical trade-offs, security implications, and operational failure modes for all eight critical architectural decisions governing Milestone M06.

In accordance with strict M06 G0 gate rules:
- **No decision is marked "APPROVED" merely because its technical recommendation is sound.**
- Every decision is marked **`PENDING OPERATOR APPROVAL`** until formal written sign-off is granted by the platform founder/operator.
- Implementation of Milestone M06 code and schema migrations remains strictly paused until this register and the companion Approval Packet are ratified.

---

## 2. Exhaustive Pre-Implementation Decision Analyses

```mermaid
flowchart TD
    D1["DEC-M06-001:\nDistributed Rate Limiting Engine"] --> R1["Recommended:\nUpstash Redis Primary + Fail-Closed Sensitive Routes"]
    D2["DEC-M06-002:\nVercel Origin Shielding"] --> R2["Recommended:\nCloudflare CIDR Allowlisting + Shared Secret Header + Host Rewrite"]
    D3["DEC-M06-003:\nGrievance Public Ingress"] --> R3["Recommended:\nRoute Handler /api/compliance/triage + Dual-Clock Timers (2h/24h/36h/7d)"]
    D4["DEC-M06-004:\nPrivacy Erasure Lifecycle"] --> R4["Recommended:\n15-Point Multi-Copy Purge + DEK Shredding + 30d Backup Expiry Policy"]
    D5["DEC-M06-005:\nAudit Ledger Immutability"] --> R5["Recommended:\n8-Layer Defense (Merkle Chains + R2 Object Lock WORM + Category Matrix)"]
    D6["DEC-M06-006:\nAnonymous Intake RPC"] --> R6["Recommended:\nSECURITY DEFINER RPC (EXECUTE strictly to service_role)"]
    D7["DEC-M06-007:\nCommerce & Tax Scope"] --> R7["Recommended:\nDecouple to M07 (Require Mandatory CA Written Sign-Off)"]
    D8["DEC-M06-008:\nScripture & Search Scope"] --> R8["Recommended:\nDecouple to M08 (Require Vedic Scholar Rights Clearance)"]
```

---

### DEC-M06-001: Distributed Rate Limiting & Concurrency Engine Architecture
- **Decision ID:** `DEC-M06-001`
- **Exact Problem:** In multi-replica serverless deployments (Next.js on Vercel), process-local memory rate limiters (`BoundedRateLimiter`) maintain independent state in each container instance. Incoming requests routed round-robin across $N$ instances multiply allowable burst quotas by $N$, enabling distributed brute-force attacks against phone OTP, payment checkout, and grievance intake. A distributed, atomic coordination engine is required.
- **Recommended Approach:**
  * **Primary Engine:** **Upstash Redis Serverless** utilizing atomic Lua sliding-window scripts executed via REST/TLS.
  * **Serverless Execution Model Evaluation:** Vercel serverless functions connect to Supabase PostgreSQL through connection poolers (PgBouncer in transaction mode or Supavisor).
    - Session-level advisory locks (`pg_advisory_lock`) are **STRICTLY INCOMPATIBLE** with transaction-mode connection poolers because the connection may be returned to the pool while the lock remains held, leading to connection poisoning or deadlocks.
    - Transaction-level advisory locks (`pg_advisory_xact_lock`) operate correctly within an active transaction block. However, opening a dedicated database transaction for every incoming HTTP request to verify rate limits introduces severe connection pool exhaustion, CPU spikes, and connection latency (15–30ms) on Supabase PostgreSQL during traffic surges.
    - Therefore, PostgreSQL advisory locking is rejected as a universal high-frequency rate-limiting fallback. It is designated **strictly as a secondary concurrency coordinator for low-frequency, high-value operations** (e.g. serializing refund mutations and booking slot claims).
  * **Mandatory Fail-Closed Policy:** If Upstash Redis is unreachable, times out (>150ms), or exhausts its provider quota, **sensitive mutation routes (`/api/auth/otp`, `/api/auth/verify`, `/api/commerce/checkout`, `/api/commerce/refund`, `/api/compliance/privacy-request`, `/api/compliance/triage`) MUST FAIL CLOSED with HTTP 503 `RATE_LIMIT_UNAVAILABLE`.**
  * **Zero Silent Local Fallback:** Under no circumstances will sensitive routes silently fall back to uncoordinated process-local memory.
  * **Public Read-Only Routes:** Public content (`/api/panchang/daily`, `/api/scriptures/search`) falls back to conservative local rate limiting (20 req/min) or serves stale CDN cache with `X-RateLimit-Degraded: true`.
- **Alternatives Evaluated & Rejected:**
  1. *Universal Process-Local Fallback:* Rejected because an attacker can flood concurrent requests across multiple serverless functions to bypass brute-force limits.
  2. *Dedicated Valkey / Redis on Fly.io Container:* Rejected for M06 baseline because it requires managing Linux container infrastructure, VPC peering, and manual Redis cluster high availability during a phase focused on serverless application persistence.
  3. *Universal PostgreSQL Advisory Lock Rate Limiting:* Rejected due to transaction pooler saturation, write amplification, and connection starvation under DDoS attacks.
- **Security Trade-Offs:** Failing closed prioritizes defense against credential stuffing and financial double-spend over availability of mutation routes during a rare Redis outage.
- **Cost Implications:** $0.00/mo in Beta (<10k ops/day free tier); ~$7.00/mo at initial public launch (3.5M commands); ~$90.00/mo at 100k MAU scale.
- **Operational Dependencies:** Requires Upstash Redis credentials (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) in production. Automated local mock engine used for CI/local testing.
- **Failure Modes & Circuit Breakers:** Bounded 150ms timeout; max 1 retry with 25ms backoff. Circuit trips to `OPEN` after 5 consecutive failures, emitting a P1 operational alert. Half-open probe resets circuit after 30 seconds.
- **Evidence:** Tested in M02 with native PostgreSQL 18 advisory locks; proved that local process memory cannot synchronize across concurrent worker threads.
- **Approval Owner:** Principal Software Architect & Application Security Engineer
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-002: Ingress Origin Shielding Mechanism on Hosting Platform
- **Decision ID:** `DEC-M06-002`
- **Exact Problem:** If malicious actors discover the underlying origin server IP or direct hosting URL, they can bypass Cloudflare Edge WAF, DDoS mitigation, and rate limiting by sending requests directly to the origin with forged `CF-Connecting-IP` or `X-Forwarded-For` headers.
- **Recommended Approach (Vercel Production Baseline):**
  * **Dual-Layer Application & Ingress Shielding:**
    1. *Cloudflare Transform Rules:* Edge proxy injects a 32-byte cryptographically secure random secret header `x-ishti-proxy-secret` on all proxied origin pulls.
    2. *Next.js Edge Middleware:* Validates `x-ishti-proxy-secret` against `process.env.REVERSE_PROXY_SHARED_SECRET`. Requests lacking this header are dropped immediately with HTTP 403 Forbidden.
    3. *Host Header Rewrite & Direct Vercel URL Protection:* Vercel automatically assigns `*.vercel.app` domains to deployments. To prevent attackers from accessing the application via `https://project.vercel.app`:
       - The Next.js middleware inspects `request.headers.get("host")`.
       - If the host ends with `.vercel.app`, the request is redirected to the canonical custom domain (`https://ishti.com`) or rejected with HTTP 403 unless accompanied by a Vercel deployment protection bypass secret.
    4. *Vercel Firewall CIDR Allowlisting:* In Vercel Project Settings $\to$ Security $\to$ Firewall, configure IP allowlist rules to restrict incoming HTTP traffic strictly to Cloudflare's published IPv4 and IPv6 CIDR blocks.
  * **Explicit Distinction Regarding Mutual TLS (mTLS):** A shared secret header is **NOT equivalent to mutual TLS (mTLS)**. A shared secret is an application-layer check that executes after TCP connection establishment and HTTP parsing; mTLS drops unauthorized connections at the TLS handshake before any HTTP data is parsed. Full Cloudflare Authenticated Origin Pulls (AOP) with custom client certificates is **incompatible with standard Vercel Pro** and requires Vercel Enterprise or containerized hosting.
  * **Hosting-Compatible Alternative (Containerized Contingency):** If Vercel origin shielding proves insufficient or if secret leakage occurs, ISHTI will deploy the Next.js application as a Docker container on Fly.io / AWS ECS behind **Cloudflare Tunnel (`cloudflared`)**. Cloudflare Tunnel creates outbound-only connections to Cloudflare Edge, completely closing all public inbound firewall ports.
- **Alternatives Evaluated & Rejected:**
  1. *Cloudflare AOP (mTLS Client Certificates):* Rejected as unachievable on standard Vercel Pro plan without costly Enterprise contract.
  2. *Relying on Secret Header Alone:* Rejected because exposing the secret or allowing requests from non-Cloudflare IPs allows IP spoofing.
- **Security Trade-Offs:** Shared secret headers provide strong protection against opportunistic bypass, but require a 90-day secret rotation runbook (dual-secret window in middleware) to mitigate leakage risks.
- **Cost Implications:** $0.00 (Included in Vercel Pro and Cloudflare Free/Pro).
- **Operational Dependencies:** Cloudflare Transform Rule configuration; Vercel Firewall rule synchronization with Cloudflare IP lists.
- **Failure Modes:** If Cloudflare IP ranges change without updating Vercel firewall rules, legitimate traffic could be dropped. Mitigated by automated monthly IP sync script.
- **Approval Owner:** DevOps Lead & Infrastructure Security Lead
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-003: Grievance Architecture & IT Rules Timeline Realignment
- **Decision ID:** `DEC-M06-003`
- **Exact Problem:** Previous planning drafts contained contradictory implementation pathways (Server Actions vs Route Handlers) and conflated statutory IT Rules deadlines (promising 24h for all takedowns without distinguishing acknowledgement, investigation, resolution, and emergency sexual content removal).
- **Recommended Approach:**
  * **Single Public Ingress Interface:** Next.js **Route Handler (`POST /api/compliance/triage`)** with JSON REST request/response contracts is selected as the sole server-mediated public intake interface.
    - *Rationale:* Route Handlers provide standard WHATWG HTTP endpoints accessible by external web clients, mobile apps, and statutory escalation webhooks with standard HTTP status codes (`201 Created`, `400 Bad Request`, `413 Payload Too Large`, `429 Too Many Requests`, `503 Service Unavailable`). Server Actions are coupled to React component forms and use internal React flight protocol serialization, making them inappropriate for public external intake and webhook integrations.
  * **IT Rules Updated Timeline Alignment (10 February 2026 Amendments):**
    1. *Ordinary Intermediary Grievance (Rule 3(2)(a)(i)):* **Acknowledgement within 24 hours**; **resolution/disposal within 7 days** (reduced from 15 days by February 2026 amendment).
    2. *Specific Removal Requests (Proviso to Rule 3(2)(a)(i)):* **Resolution within 36 hours** for content specified under relevant sub-clauses.
    3. *Emergency Private Area, Nudity, Sexual Act, Impersonation Content (Rule 3(2)(b)):* **Action/takedown within 2 hours** (strictly 2 hours).
    4. *Court Orders / Government Notifications (Rule 3(1)(d)):* **Removal within 36 hours** from receipt of official court order or government notice.
    5. *Government Blocking Orders (IT Act §69A read with 2009 Blocking Rules):* **Immediate confidential compliance**.
  * **Dual-Clock Architecture:** Statutory legal deadlines are decoupled from internal operational Service-Level Targets (SLTs). The database tracks both `statutory_disposal_deadline` (for legal compliance) and `internal_slt_disposal_deadline` (e.g. 48h resolution for standard complaints, 1h for emergency content) to alert staff before statutory windows expire.
- **Alternatives Evaluated & Rejected:**
  1. *Server Action Ingress:* Rejected because it cannot serve mobile apps or external API consumers with standard REST contracts.
  2. *Single 24h Blanket Clock:* Rejected as legally incorrect; conflated acknowledgement with final disposal and failed to meet the strict 2h requirement for Rule 3(2)(b).
- **Security & Legal Trade-Offs:** The 2-hour window under Rule 3(2)(b) requires automated P0 alerting (SMS/phone notification to on-call Grievance Officers) to prevent forfeiture of intermediary safe harbour under IT Act §79.
- **Cost Implications:** $0.00 (Core logic implemented in PostgreSQL triggers and Next.js Route Handler).
- **Operational Dependencies:** Grievance Officer on-call rota for 24/7 coverage of Rule 3(2)(b) emergency takedowns.
- **Approval Owner:** Legal Engineering Lead & Compliance Officer
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-004: Multi-Copy Privacy Erasure & Immutable Backup Retention Lifecycle
- **Decision ID:** `DEC-M06-004`
- **Exact Problem:** Treating data erasure under DPDP Act §12(3) / GDPR Art 17 merely as a single database DELETE query or single-point DEK deletion fails to address personal data lingering across 15 separate platform locations, while failing to document lawful retention exceptions required by tax laws.
- **Recommended Approach:**
  * **15-Point Multi-Stage Erasure Architecture:** Implement an 8-stage state machine that orchestrates data purging across all 15 personal data copies:
    1. Primary PostgreSQL database (`profiles`, `users`, `user_consents`).
    2. Related transaction and booking records (personal identifiers pseudonymized).
    3. Encrypted Kundli birth records (per-profile AES-256 DEK cryptographically shredded).
    4. Search indexes (`tsvector` full-text search).
    5. Vector embeddings (`pgvector` semantic representations).
    6. In-memory / distributed caches (Redis session tokens and cached profile payloads).
    7. Application server logs (personal data masked at source; logs age out after 180 days).
    8. Product analytics (user deletion events dispatched to analytics vendors).
    9. Generated export archives & temporary files (PDF Kundlis, SAR ZIPs purged from storage).
    10. Supabase Storage buckets (avatars, uploaded grievance evidence).
    11. Physical database backups (WAL logs and rolling snapshots).
    12. Vendor notification logs (MSG91 SMS and Resend email communication logs).
    13. Background job queues (PgBoss / BullMQ messages and dead-letter queues).
    14. Notification push providers (FCM / APNs device tokens).
    15. Key management audit systems (AWS KMS / Supabase Vault key metadata).
  * **Backup Expiry Policy Clarification:** The **30-day backup expiry window is a technical operational policy choice, NOT a statutory deadline**.
    - Statutory laws mandate prompt erasure without undue delay, but data protection authorities (EDPB, UK ICO, and regulatory guidance under DPDP) recognize that physical database backup archives cannot be selectively altered without destroying block integrity.
    - Personal data in backups naturally expires as rolling backups cycle out (30 days).
    - If a disaster recovery restore occurs, the restoration runbook automatically executes the **Deletion Tombstone Manifest** archived in external WORM storage to purge restored records.
  * **Lawful Retention Documentation:** Records retained under statutory mandates (Income-tax Act, 2025 §62 7-year retention for financial books of account; IT Rules 3-year dispute records) are documented in `public.privacy_requests.retained_records_summary`.
- **Alternatives Evaluated & Rejected:**
  1. *Immediate Surgical Backup Purge:* Rejected as technically impossible on PostgreSQL WAL snapshots without corrupting the entire database.
  2. *Single DEK Purge Alone:* Rejected because unencrypted PII (names, phone numbers, email addresses) in related tables remains exposed.
- **Security & Legal Trade-Offs:** Provides mathematical finality for sensitive astrological birth records via DEK shredding while ensuring full compliance with statutory accounting retention laws.
- **Cost Implications:** Minimal background worker compute overhead.
- **Approval Owner:** Privacy Engineering Lead & Cryptography Architect
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-005: Audit Ledger Immutability & Record-Category Retention Schedule
- **Decision ID:** `DEC-M06-005`
- **Exact Problem:** Previous planning claimed that database triggers provide "absolute immutability" and applied a blanket 7-year retention period across all audit data. Privileged database administrators can disable triggers, while retaining all user logs for 7 years violates data minimization under DPDP Act §8(7).
- **Recommended Approach:**
  * **Defense-in-Depth Immutability Hierarchy (8 Layers):**
    1. Application ORM semantics (zero update/delete methods).
    2. PostgreSQL trigger `trg_audit_ledger_immutable` (blocks standard SQL updates/deletions with code 42501).
    3. Database role privilege separation (standard application role lacks UPDATE/DELETE grants).
    4. SHA-256 sequential Merkle hash chaining (`record_hash = SHA-256(seq || timestamp || payload_hash || prev_hash)`).
    5. Daily signed Merkle roots (signed by an offline Ed25519 platform compliance key).
    6. External WORM Object Lock (signed snapshots exported to **Cloudflare R2 / AWS S3 Object Lock in Compliance Mode** in an isolated secondary cloud account).
    7. Automated daily integrity verification daemon (`verify_audit_ledger_integrity()`).
    8. Disaster recovery tombstone reconciliation.
  * **Record-Category Retention Matrix:**
    - *Financial Transaction Books & Invoices:* **7 Years** (Income-tax Act, 2025 §62 / Rule 46).
    - *User Consent Records & Audit History:* **Duration of active account + 3 Years** (DPDP Act §6).
    - *Grievance Tickets & Evidence:* **3 Years** (IT Rules / Limitation Act).
    - *ICT Security & Ingress Access Logs:* **180 Days** (CERT-In Directions dated 28 April 2022).
    - *Ephemeral Debug Logs:* **14 to 30 Days** (Internal operational policy).
- **Alternatives Evaluated & Rejected:**
  1. *Trigger-Only Protection:* Rejected because database superusers (`postgres`) can bypass triggers via `ALTER TABLE ... DISABLE TRIGGER`.
  2. *Blanket 7-Year Retention:* Rejected as an active statutory violation of DPDP Act §8(7) data minimization principles.
- **Security & Legal Trade-Offs:** Multi-account WORM archiving prevents root AWS account compromise from destroying compliance evidence.
- **Cost Implications:** ~$3.00/mo at launch; ~$15.00/mo at scale on Cloudflare R2 WORM.
- **Approval Owner:** Application Security Engineer & Legal Counsel
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-006: Server-Mediated Anonymous Public Intake & RPC Security
- **Decision ID:** `DEC-M06-006`
- **Exact Problem:** External complainants and prospective early-access users need to submit data without authenticating. Granting direct database write access to the PostgREST `anon` role enables parameter pollution and bulk spamming, while exposing an unconstrained `SECURITY DEFINER` function creates a privilege escalation risk.
- **Recommended Approach:**
  * **Strict Database Role Isolation:** The PostgREST `anon` and `public` roles are granted **ZERO table permissions** (`REVOKE ALL ON public.grievance_tickets FROM anon, public`).
  * **Server-Mediated Ingress:** All anonymous submissions must hit the Next.js Route Handler `POST /api/compliance/triage`.
  * **Input Validation & Abuse Mitigation:**
    - Zod schema validation enforces strict field formats and string lengths (complainant email max 255 chars, description max 4,000 chars, total payload max 32 KB).
    - Layer 1 IP rate limiting (3 submissions per 10 minutes per verified network IP).
    - Cloudflare Turnstile / managed challenge invoked if burst traffic or bot signatures are detected.
  * **Hardened PostgreSQL RPC Function (`public.submit_anonymous_grievance`):**
    - Marked `SECURITY DEFINER` with a fixed `search_path = public, pg_temp` to prevent search_path hijacking.
    - Execution privilege is granted **STRICTLY TO `service_role`**; `REVOKE EXECUTE FROM PUBLIC, anon`.
    - Internal validation rejects payloads exceeding size limits.
    - Automatically assigns statutory deadlines (2h for Rule 3(2)(b); 36h for Rule 3(1)(d); 7d for Rule 3(2)(a)(i)) and internal SLTs.
    - Inserts immutable audit record with `actor_role = 'anonymous_public'`.
- **Alternatives Evaluated & Rejected:**
  1. *Granting INSERT to anon in PostgREST:* Rejected as unsafe; exposes database schema to direct unmetered client injection.
  2. *Granting EXECUTE on RPC to anon:* Rejected because untrusted clients could invoke the RPC directly without passing through Next.js rate limiting or Zod validation.
- **Security Trade-Offs:** The Next.js Route Handler acts as an authenticated security gateway; the `service_role` key is never exposed to the browser.
- **Cost Implications:** $0.00.
- **Approval Owner:** Application Security Engineer & Backend Architect
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-007: Scope Decoupling: Milestone M06 Persistence vs. Milestone M07 Commerce Engine
- **Decision ID:** `DEC-M06-007`
- **Exact Problem:** Coupling double-entry financial accounting, payment gateway webhooks, and automated tax withholding (0.5% GST TCS, 0.1% TDS) to Milestone M06 over-burdens core persistence with uncertified tax assumptions.
- **Recommended Approach:**
  * **Decouple Commerce to Milestone M07:** Milestone M06 focuses strictly on core persistence (rate limiting, consent, privacy erasure, audit ledger, and grievance redressal).
  * Milestone M07 implements double-entry financial ledgers, Razorpay webhook idempotency, and configurable tax rules (`public.tax_configuration_rules`).
  * **Mandatory Pre-Automation Certification:** Real automated tax withholding and e-invoicing code remains disabled until a practicing Chartered Accountant provides written certification of GST SAC classifications (998439 vs 999799), 0.5% TCS registration under CGST Act §52, and 0.1% TDS under Section 194-O / 2025 Act §393.
- **Alternatives Evaluated & Rejected:**
  1. *Building Commerce in M06:* Rejected because tax law determinations and marketplace contractual models require CA and founder sign-offs that would stall core persistence engineering.
- **Security & Financial Trade-Offs:** Prevents costly rework of financial database tables prior to receiving professional tax opinions.
- **Approval Owner:** Principal Software Architect, Founder & Chartered Accountant
- **Status:** **`PENDING OPERATOR APPROVAL`**

---

### DEC-M06-008: Scope Decoupling: Milestone M06 Persistence vs. Milestone M08 Scripture Search Engine
- **Decision ID:** `DEC-M06-008`
- **Exact Problem:** Integrating scripture catalog persistence, scholar curation workflows, and `pgvector` semantic search into M06 introduces intellectual property risks regarding modern translation copyrights.
- **Recommended Approach:**
  * **Decouple Knowledge Persistence to Milestone M08:** Milestone M06 establishes core user data persistence.
  * Milestone M08 implements scripture catalog schemas, scholar curation workflows, and `pgvector` hybrid search following formal copyright review and attribution clearance by Vedic scholars.
- **Alternatives Evaluated & Rejected:**
  1. *Building Scripture Search in M06:* Rejected because contemporary translations and commentary remain marked `pending_clearance` and `pending_peer_review`.
- **Security & Legal Trade-Offs:** Defers pgvector compute add-on costs ($10–$40/mo) until knowledge ingestion commences; eliminates copyright exposure.
- **Approval Owner:** Principal Software Architect & Vedic Scholar
- **Status:** **`PENDING OPERATOR APPROVAL`**

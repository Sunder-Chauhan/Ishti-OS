# ISHTI Milestone M06 — Test & Verification Strategy (Revised)

**Document Reference:** `docs/M06_TEST_AND_VERIFICATION_STRATEGY.md`  
**Milestone:** M06 — Core Backend Persistence, Distributed Invariants & Production Shielding  
**Repository:** `https://github.com/Sunder-Chauhan/Ishti-OS`  
**Revision Date:** 19 November 2026  
**Auditor Roles:** Principal Test Architect, Security Verification Engineer & Privacy Lead  

---

## 1. Multi-Tier Testing Hierarchy Overview

To ensure that distributed backend components, privacy workflows, and security safeguards operate flawlessly under adversarial conditions, Milestone M06 enforces a **5-tier testing hierarchy**:

```mermaid
pyramid
    title M06 Verification Hierarchy
    "Tier 5: Chaos, Failover & Load Benchmarks (10k req/s, Redis outage, DB partition)"
    "Tier 4: Concurrency & Race Condition Verification (Real multi-connection pool)"
    "Tier 3: Database RLS Penetration & Tenant Isolation (Native PostgreSQL 18)"
    "Tier 2: API Integration & Stateful Security Boundary Tests"
    "Tier 1: Fast Unit Tests (Crypto, Decimal Math, Hash Chaining)"
```

| Testing Tier | Scope | Target Environment | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **Tier 1: Unit Tests** | Pure business logic, minor-unit calculations, SHA-256 Merkle chain computations, payload decoding. | Local Node.js / Vitest | 100% passing; execution time < 5s. |
| **Tier 2: API Integration Tests** | Next.js API route handlers, Server Actions, bounded stream reading, session verifiers. | Local mock HTTP / Supertest | 100% passing; zero unhandled promise rejections. |
| **Tier 3: Database & RLS Penetration** | Native PostgreSQL 18 RLS policies, trigger immutability, role separation, anonymous RPC access. | Local PostgreSQL 18 container (port 54321) | Zero data leakage; unauthorized direct writes throw 42501. |
| **Tier 4: Concurrency Tests** | Atomic booking reservations, sliding-window rate limit counters across worker threads. | Multi-connection pool (20-50 simultaneous clients) | Exactly 1 winner in race conditions; zero deadlocks. |
| **Tier 5: Chaos & Load Benchmarks** | Redis disconnection, circuit breaker tripping, thundering herd traffic spikes. | K6 / Artillery load testing runner | Fail-open / fail-closed adheres to matrix; latency p99 < 50ms. |

---

## 2. Dedicated Adversarial Test Harnesses & Scenarios

### 2.1. Distributed Rate Limiter Outage & Fail-Closed Test (Correction 3)
- **Objective:** Verify that when Redis is unreachable or times out (>150ms), sensitive mutation routes fail closed (HTTP 503) without silently falling back to uncoordinated local process memory.
- **Harness:** `scripts/test-rate-limiter-chaos.ts` wraps Redis client with an artificial network partition proxy.
- **Test Scenarios:**
  1. *Normal Distributed Ingress:* 60 req/min limit enforced across 5 concurrent Node worker processes. Requests 1–60 return HTTP 200; requests 61–100 return HTTP 429.
  2. *Redis Severance (Sensitive Route):* Sever Redis connection and submit request to `/api/auth/otp` and `/api/compliance/triage`.
     * *Assertion:* Endpoints return `HTTP 503 Service Unavailable` with error code `RATE_LIMIT_UNAVAILABLE`. Zero silent local-memory quota fallback.
  3. *Redis Severance (Public Read Route):* Sever Redis connection and submit request to `/api/panchang/daily`.
     * *Assertion:* Endpoint returns `HTTP 200 OK` with header `X-RateLimit-Degraded: true` using conservative local limiter.
  4. *Circuit Breaker Tripping:* Generate 5 consecutive Redis timeouts (>150ms).
     * *Assertion:* Circuit trips to `OPEN`. P1 alert dispatched. Requests fail fast without incurring the 150ms timeout. Probe request at 30s resets circuit to `HALF_OPEN`.

### 2.2. Server-Mediated Anonymous Intake Penetration Suite (Correction 4)
- **Objective:** Verify that unauthenticated public intake is mediated securely without exposing direct database write privileges.
- **Harness:** `scripts/test-anonymous-intake-security.ts`.
- **Test Scenarios:**
  1. *Direct DB Write Attempt:* Attempt direct SQL insert into `public.grievance_tickets` using Supabase client with `anon` public key.
     * *Assertion:* Database rejects query with exception `42501 (permission denied for table grievance_tickets)`.
  2. *Server-Mediated Valid Submission:* Dispatch valid JSON payload to `POST /api/compliance/triage`.
     * *Assertion:* Returns HTTP 201 Created with ticket reference (`ISHTI-GRV-2026-XXXX`). Audit ledger records event with `actor_role = 'anonymous_public'`.
  3. *Oversized Payload Flooding:* Dispatch a 128 KB JSON payload to `/api/compliance/triage`.
     * *Assertion:* Bounded stream reader cancels stream immediately and returns HTTP 413 `PAYLOAD_TOO_LARGE` without buffering full body into memory.
  4. *Anonymous IP Burst Throttling:* Dispatch 10 consecutive submissions from the same IP.
     * *Assertion:* First 3 submissions succeed; submissions 4–10 are rejected with HTTP 429.

### 2.3. 15-Point Multi-Copy Data Erasure Verification (Correction 5)
- **Objective:** Prove that confirmed statutory erasure purges personal data across all 15 platform repositories and mathematically destroys encrypted Kundli ciphertext via DEK shredding.
- **Harness:** `scripts/test-privacy-erasure-lifecycle.ts`.
- **Test Scenarios:**
  1. Provision a test devotee with personal profile, encrypted Kundli birth records, consent records, and cached Redis sessions.
  2. Trigger confirmed erasure via `executePrivacyErasure(userId)`.
  3. *Primary DB Verification:* Query `public.profiles` and `public.user_consents` for `userId`. Assert 0 rows returned.
  4. *Cryptographic Shredding Verification:* Query `public.kundli_encryption_keys` for `userId`. Assert 0 rows returned. Attempt AES-256-GCM decryption of historical Kundli ciphertext using platform master key.
     * *Assertion:* Decryption throws `AUTHENTICATION_TAG_VERIFICATION_FAILED`. Birth data is mathematically irrecoverable.
  5. *Cache Purge Verification:* Query Redis for `ishti:session:{userId}`. Assert key does not exist (`nil`).
  6. *Lawful Retention Documentation:* Inspect `public.privacy_requests.retained_records_summary`.
     * *Assertion:* Documents financial transaction IDs retained pursuant to Income-tax Act, 2025 §62 (7-year retention exception).

### 2.4. Grievance Redressal IT Rules Typed Clocks & Clock-Start Invariant Verification (Correction 2)
- **Objective:** Verify that grievance intake preserves immutable receipt timestamps, decomposes multi-allegation submissions, enforces human classification gates, and binds independent typed statutory clocks strictly anchored to the original triggering timestamp under official consolidated IT Rules updated 10 February 2026 (including corrigendum).
- **Harness:** `scripts/test-grievance-slas.ts`.
- **The Eight Mandatory Test Scenarios:**
  1. *Scenario 1: Qualifying Emergency Complaint Received at 10:00, Classified at 11:30 (Clock-Start Invariant)*
     - **Action:** Ingest an emergency complaint alleging non-consensual sexual/impersonation content at simulated timestamp 10:00 (`received_at = 10:00`). Compliance officer executes `classify_and_bind_statutory_clock()` at 11:30.
     - **Assertion:** Clock `RULE_3_2_B_EMERGENCY_REMOVAL` is instantiated in `public.grievance_clocks` with `triggering_timestamp = 10:00` and `applicable_deadline = 12:00` (exactly 10:00 + 2 hours, **NOT** 11:30 + 2 hours). Status is `ACTIVE` with a remaining operational buffer of 30 minutes. If classification is delayed past 12:00 (e.g. at 12:15), the clock status is immediately recorded as `BREACHED_PENDING_ACTION` with an automatic P0 alert.
  2. *Scenario 2: Court Order Received Through Approved Channel, Classified Later*
     - **Action:** A court order under Rule 3(1)(d) is officially served via physical/registered delivery at 09:00. The legal team logs the case into the platform at 10:15, providing `p_override_trigger_timestamp = 09:00`.
     - **Assertion:** Clock `RULE_3_1_D_ORDER_TAKEDOWN` is bound with `triggering_timestamp = 09:00` and `applicable_deadline = 12:00` (exactly 3 hours from service). Zero statutory acknowledgement clock is created (Rule 3(1)(d) mandates immediate takedown, not acknowledgement).
  3. *Scenario 3: Standard Grievance Initially Unclassified*
     - **Action:** A user submits a grievance alleging failure of platform due diligence at 14:00 via `POST /api/compliance/triage`.
     - **Assertion:** Parent record created in `public.grievance_cases` with `classification_status = 'PENDING_CLASSIFICATION'`. Zero statutory clocks are bound to `public.grievance_clocks`. Operational triage SLT is set to +2 hours (16:00).
  4. *Scenario 4: Mixed Submission: Commercial Pandit Dispute + Urgent Impersonation Allegation*
     - **Action:** Complainant submits a single intake ticket containing two distinct claims: (A) A commercial fee dispute alleging a pandit did not perform a booked puja; (B) An urgent allegation that the pandit profile image depicts an impersonated private photograph of the complainant.
     - **Assertion:** A single parent record `public.grievance_cases` is created, with two child records in `public.grievance_allegations`. Officer classifies Allegation A as `PANDIT_SERVICE_COMMERCIAL_DISPUTE` (binds an `INTERNAL_OPERATIONAL_SLT` clock with a 72-hour target and zero statutory IT Rules clock). Officer classifies Allegation B as `RULE_3_2_B_EMERGENCY_TAKEDOWN` (binds `RULE_3_2_B_EMERGENCY_REMOVAL` with deadline = `received_at + 2 hours`). Both allegations and clocks coexist independently under the same parent case without legal conflation.
  5. *Scenario 5: Multi-URL Content Removal Request*
     - **Action:** Complainant submits an intake payload citing 4 distinct infringing forum URLs violating Rule 3(1)(b).
     - **Assertion:** The intake RPC decomposes the array of URLs into 4 separate rows in `public.grievance_allegations`. Upon verification as `RULE_3_2_A_I_PROVISO_EXPEDITED_REMOVAL`, the system instantiates typed clocks `RULE_3_2_A_I_ACKNOWLEDGEMENT` (`received_at + 24 hours`) and `RULE_3_2_A_I_EXPEDITED_REMOVAL` (`received_at + 36 hours`).
  6. *Scenario 6: Incomplete Request Awaiting Clarification (No Silent Clock Pause)*
     - **Action:** Complainant submits a vague defamation claim under Rule 3(1)(b) without identifying the specific forum thread URL. Compliance officer updates allegation status to `AWAITING_CLARIFICATION` and sends an information request.
     - **Assertion:** Allegation enters `AWAITING_CLARIFICATION`. Statutory clocks continue running strictly anchored to `received_at`; **no automatic pause or reset occurs** unless written confirmation from Indian legal counsel explicitly authorizes tolling for that category.
  7. *Scenario 7: Confidential Section 69A Blocking Direction*
     - **Action:** Central Government Designated Officer serves a confidential blocking direction under Section 69A.
     - **Assertion:** Direction is logged strictly via restricted administrative channel. Instantiates a `SECTION_69A_BLOCKING_DIRECTION` clock with `applicable_deadline = NULL` and `direction_execution_requirement` populated with the direction text. The system enforces strict confidentiality under Rule 16 of the 2009 Blocking Rules; zero public ticket is published; zero assumption of a fixed 36-hour window.
  8. *Scenario 8: Classification Decision That Changes After New Evidence (Re-Classification Audit Trail)*
     - **Action:** A submission is initially classified as `VOLUNTARY_FEEDBACK_NON_STATUTORY` with an internal 72-hour resolution SLT. 45 minutes later, complainant provides supplemental evidence proving the post contains non-consensual intimate imagery under Rule 3(2)(b). Officer re-classifies the case to `RULE_3_2_B_EMERGENCY_TAKEDOWN`.
     - **Assertion:** The internal SLT clock transitions to `CANCELLED_RECLASSIFIED`. A new `RULE_3_2_B_EMERGENCY_REMOVAL` clock is created. **Clock-Start Invariant:** The deadline is computed strictly as `case.received_at + 2 hours` (NOT re-classification timestamp + 2 hours). If 2 hours have already elapsed since original intake, the clock status immediately records as `BREACHED_PENDING_ACTION`. A complete audit trail of the re-classification event is appended to `public.grievance_events`.

### 2.5. Merkle Hash Chain Corruption & Tamper Detection (Correction 6)
- **Objective:** Prove that manual modification of an audit record by a rogue database administrator is immediately detected by the integrity daemon.
- **Harness:** `scripts/test-audit-tamper-detection.ts`.
- **Test Scenarios:**
  1. Insert 50 sequential audit records into `public.audit_ledger`.
  2. Disable the trigger temporarily in a local test sandbox and modify the payload of record #25.
  3. Execute `verify_audit_ledger_integrity()`.
  * *Assertion:* The verification function returns `false`, identifying record #25 as corrupted (`record_hash != calculated_hash`), and flags downstream records #26–50 as invalidated.

### 2.6. Ingress Origin Shielding Bypass Penetration Suite
- **Objective:** Empirically verify that origin web servers on Vercel reject direct traffic, spoofed proxy headers, and unauthenticated alias access.
- **Harness:** `scripts/test-origin-shielding.ts`.
- **Test Scenarios:**
  1. *Direct `*.vercel.app` Deployment URL Access:* Send direct HTTP requests to deployment URL; assert rejection (HTTP 403) or canonical domain redirect.
  2. *Alternative Vercel Aliases & Previews:* Probe branch/preview URLs; assert deployment protection or origin secret enforcement.
  3. *Missing Proxy Header:* Send direct HTTP request lacking `x-ishti-proxy-secret`; assert immediate HTTP 403 rejection.
  4. *Spoofed Proxy Header from External IP:* Send request containing valid secret from an IP outside Cloudflare CIDRs; assert Vercel Firewall drops connection at network layer.
  5. *Secret Rotation Dual-Window:* Verify that rotating the secret using a dual-window environment configuration permits zero-downtime rollover.
  6. *Host-Header Manipulation:* Send request with forged `Host` header; assert middleware strictly validates against trusted domain allowlist.
  7. *Middleware Bypass on Static / Asset Routes:* Verify whether static asset or internal routes bypass middleware, confirming zero data route leaks.
  8. *Unexpected Network Paths:* Audit IPv6 vs IPv4 routing and internal peering boundaries.

### 2.7. Upstash Redis Empirical Latency Benchmark Harness
- **Objective:** Empirically measure real-world network latency and concurrency scaling between serverless execution contexts and Upstash Redis in AWS `ap-south-1` (Mumbai).
- **Harness:** `scripts/benchmark-redis-latency.ts`.
- **Benchmark Metrics & Assertions:**
  1. *Latency Distribution (10,000 operations):* Assert p50 <15ms, p95 <35ms, p99 <75ms under normal operation.
  2. *Cold vs. Warm Starts:* Quantify cold connection TLS setup latency vs persistent warm execution.
  3. *Concurrency Scaling:* Sustain concurrent loads of 100, 500, and 1,000 workers across serverless instances; assert zero connection pool dropouts.
  4. *Timeout & Error Handling:* Assert operations exceeding 150ms timeout abort cleanly without hanging serverless threads.
  5. *Fail-Closed Enforcement:* Sever connection to Redis; assert 100% of sensitive mutation routes strictly return HTTP 503 `RATE_LIMIT_SERVICE_UNAVAILABLE`.
  6. *Budget & Volume Verification:* Validate measured command volumes against tier budget assumptions (free tier vs launch tier).

---

## 3. Milestone M06 Acceptance Gates & Sign-Off Criteria

Before Milestone M06 can be accepted or merged into `main`, it must satisfy all five mandatory gates:

```
================================================================================
ISHTI Milestone M06 Acceptance Gate Verification Criteria
================================================================================

[ ] GATE 1: STATIC & TYPE INTEGRITY
    • Monorepo TypeScript compilation (`npm run typecheck`): 0 errors across all workspaces.
    • ESLint & Code Formatting: 0 lint errors, 0 warnings.

[ ] GATE 2: SECURITY REGRESSION SUITE
    • Automated Security Suite (`npm run test:security`): 100% pass (minimum 110+ tests).
    • Zero hardcoded secrets, API keys, or exposed test credentials.

[ ] GATE 3: CORE PERSISTENCE & ADVERSARIAL SUITE
    • Core M06 Verification Suite (`scripts/run-m06-tests.ts`): 100% pass.
    • Distributed rate limiting chaos tests pass (sensitive routes fail closed).
    • Empirical Redis latency benchmark meets SLA (p50 <15ms, p99 <75ms).
    • 8-point origin shielding bypass suite passes (0 direct access via `*.vercel.app` or spoofed proxy headers).
    • Server-mediated anonymous grievance intake penetration tests pass.
    • 15-point multi-copy privacy erasure and DEK shredding tests pass.
    • Merkle hash chain corruption detection tests pass.

[ ] GATE 4: REAL DATABASE RLS & CONCURRENCY VERIFICATION
    • Executed against isolated native PostgreSQL 18 container (port 54321).
    • Zero direct table access granted to anon role.
    • All 5 RLS penetration scenarios pass cleanly without data leakage.

[ ] GATE 5: ZERO-DOWNTIME MIGRATION VERIFICATION
    • Forward migrations execute cleanly on clean database.
    • Reverse migrations (`down/`) roll back schema-only additions cleanly without residue.
    • Nuanced rollback classification adhered to (zero destructive migrations; backup and restore verified before state-altering changes).
    • Idempotency verified: re-running migrations causes 0 errors.
================================================================================
```

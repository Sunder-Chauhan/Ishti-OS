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

### 2.4. Grievance Redressal IT Rules Disaggregated SLA & Classification Verification (Correction 2)
- **Objective:** Verify that grievance tickets correctly enforce human classification gates and disaggregated statutory deadlines vs internal operational targets based on classification under official consolidated IT Rules updated 10 February 2026 including the February 2026 corrigendum.
- **Harness:** `scripts/test-grievance-slas.ts`.
- **Test Scenarios:**
  1. *Intake Review Queue & Classification Gate:*
     * Submit ticket with intake claim `QUALIFYING_CONTENT_REMOVAL` via `submit_anonymous_grievance`.
     * *Assertion:* Ticket is created with `classification_status` = `'PENDING_CLASSIFICATION'`, `internal_slt_triage_deadline` = +30m, and all statutory deadline fields (`statutory_removal_deadline`, `statutory_expedited_removal_deadline`, `statutory_ack_deadline`, `statutory_disposal_deadline`) are strictly `NULL`.
  2. *Verified Rule 3(2)(b) Emergency Removal Determination:*
     * Execute `classify_and_bind_statutory_clock(ticketId, 'RULE_3_2_B_EMERGENCY_TAKEDOWN', officerId, notes)`.
     * *Assertion:* `statutory_removal_deadline` = **+2 Hours**; `statutory_ack_deadline` = `NULL`; `statutory_disposal_deadline` = `NULL`; `internal_slt_removal_deadline` = **+1 Hour**; `internal_slt_ack_deadline` = **+30 Minutes**; zero pause permitted.
  3. *Verified Proviso to Rule 3(2)(a)(i) Expedited Removal Determination:*
     * Execute `classify_and_bind_statutory_clock(ticketId, 'RULE_3_2_A_I_PROVISO_EXPEDITED_REMOVAL', officerId, notes)`.
     * *Assertion:* `statutory_ack_deadline` = **+24 Hours**; `statutory_expedited_removal_deadline` = **+36 Hours**; `statutory_disposal_deadline` = `NULL`; `internal_slt_ack_deadline` = **+6 Hours**; `internal_slt_removal_deadline` = **+12 Hours**; pause rules require counsel confirmation.
  4. *Verified Rule 3(1)(d) Court / Government Takedown Determination:*
     * Execute `classify_and_bind_statutory_clock(ticketId, 'RULE_3_1_D_COURT_GOVT_ORDER', officerId, notes)`.
     * *Assertion:* `statutory_removal_deadline` = **+3 Hours**; `statutory_ack_deadline` = `NULL` (no statutory ack obligation under 3(1)(d)); `statutory_disposal_deadline` = `NULL` (not a generic grievance disposal); `internal_slt_review_deadline` = **+30 Minutes**; `internal_slt_removal_deadline` = **+1 Hour**; zero pause permitted.
  5. *Verified Rule 3(2)(a)(i) Standard Intermediary Grievance:*
     * Execute `classify_and_bind_statutory_clock(ticketId, 'RULE_3_2_A_I_INTERMEDIARY_GRIEVANCE', officerId, notes)`.
     * *Assertion:* `statutory_ack_deadline` = **+24 Hours**; `statutory_disposal_deadline` = **+7 Days** (reflecting Feb 2026 amendment); `statutory_removal_deadline` = `NULL`; `statutory_expedited_removal_deadline` = `NULL`; `internal_slt_ack_deadline` = **+12 Hours**; `internal_slt_disposal_deadline` = **+48 Hours**; pause rules require counsel confirmation.
  6. *Voluntary Platform Complaint / Service Dispute:*
     * Execute `classify_and_bind_statutory_clock(ticketId, 'VOLUNTARY_FEEDBACK_NON_STATUTORY', officerId, notes)`.
     * *Assertion:* All statutory deadlines remain `NULL`; `internal_slt_ack_deadline` = +24 Hours; `internal_slt_disposal_deadline` = +72 Hours.

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

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

### 2.4. Grievance Redressal IT Rules Typed Clocks, Timestamp Provenance & Audit Integrity Verification (ADR-040)
- **Objective:** Verify that grievance intake preserves immutable receipt timestamps across parents, allegations, and evidence; handles multi-allegation and multi-URL decomposition; enforces human classification gates; binds independent typed statutory clocks strictly anchored to legally applicable triggering timestamps; separates raw bytes from sanitized JSONB; blocks event mutations; thwarts reference enumeration; and manages lawful redactions via signed tombstones.
- **Harness:** `scripts/test-grievance-slas.ts`.
- **The Eight Mandatory Test Scenarios:**
  1. *Scenario 1: Parent Case Received at 10:00, New Actionable Allegation Received at 11:30 (Late-Arriving Evidence & Clock Triggering)*
     - **Action:** A parent case is ingested at 10:00 (`case_received_at = 10:00`) as a general commercial dispute. At 11:30, the user submits supplemental evidence containing a specific URL and screenshot alleging non-consensual impersonation under Rule 3(2)(b) (`allegation_received_at = 11:30`, `evidence_received_at = 11:30`). A Compliance Officer reviews and classifies the claim at 11:45.
     - **Assertion:** The clock `RULE_3_2_B_EMERGENCY_REMOVAL` is bound with `statutory_triggered_at = 11:30` (the legally applicable triggering timestamp when the actionable allegation was received) and `applicable_deadline = 13:30` (exactly 11:30 + 2 hours). The platform is **NOT** penalized for the 90 minutes prior to receiving the allegation (which backdating to 10:00 would have done), nor granted an unlawful extension (which setting from classification at 11:45 would have done). Remaining operational buffer is 1 hour 45 minutes. Officer reasoning is preserved in `officer_legal_reasoning`.
  2. *Scenario 2: One URL Received Initially and Another Supplied Later (Multi-URL Staggered Ingestion)*
     - **Action:** Complainant submits URL A at 10:00 (`case_received_at = 10:00`, `evidence_received_at = 10:00`). At 11:15, complainant submits URL B via `add_supplemental_evidence_or_allegation()`.
     - **Assertion:** Two distinct records are created in `public.grievance_evidence` and `public.grievance_allegations`. URL A has `allegation_received_at = 10:00` and `provenance = 'INITIAL_SUBMISSION'`; URL B has `allegation_received_at = 11:15` and `provenance = 'SUPPLEMENTAL_SUBMISSION'`. Each allegation binds its own typed clock anchored strictly to its own triggering timestamp; URL B never silently inherits or resets URL A's clock.
  3. *Scenario 3: Supplemental Evidence Changes an Allegation's Classification (Re-Classification Audit Trail)*
     - **Action:** An allegation is initially classified as `VOLUNTARY_FEEDBACK_NON_STATUTORY` with an internal 72-hour operational SLT. At 11:30, supplemental evidence uploaded via `add_supplemental_evidence_or_allegation()` proves the target URL contains qualifying intimate imagery under Rule 3(2)(b). Compliance Officer re-classifies the allegation.
     - **Assertion:** The internal SLT clock transitions to `CANCELLED_RECLASSIFIED`. A new `RULE_3_2_B_EMERGENCY_REMOVAL` clock is created with `statutory_triggered_at = 11:30` and `applicable_deadline = 13:30`. Mandatory `officer_legal_reasoning` is recorded. The re-classification event is appended to `public.grievance_events` with hash chain continuity.
  4. *Scenario 4: Multiple Allegations with Different Triggering Timestamps Running Concurrently*
     - **Action:** A single parent case receives Allegation A (Rule 3(2)(a)(i) intermediary grievance received at 10:00; 24h ack deadline 10:00 + 24h, 7d disposal deadline 10:00 + 7d) and Allegation B (Rule 3(2)(b) emergency takedown received at 11:30; 2h deadline 13:30).
     - **Assertion:** Clocks run concurrently under the same parent case. Actioning or completing Allegation B at 12:15 sets Allegation B's clock to `COMPLIED`, while having zero side effects on Allegation A's active 24h ack or 7d disposal clocks.
  5. *Scenario 5: Sanitized JSONB Differing from Exact Original Request Bytes (Data Integrity)*
     - **Action:** Complainant submits a 12 KB payload containing raw JSON with malicious `<script>` tags, non-normalized Unicode, and trailing whitespace.
     - **Assertion:** Route Handler computes `raw_request_sha256 = SHA-256(raw_bytes)` of the exact incoming HTTP stream. Sanitized JSON is parsed and stored in `sanitized_payload_json`, while stripped tags and normalization are noted in `sanitization_metadata`. System asserts `raw_request_sha256` exactly matches raw bytes, while `sanitized_payload_json` contains stripped, safe DOM elements. Documentation and code never describe sanitized JSONB as the original raw submission.
  6. *Scenario 6: Unauthorized UPDATE/DELETE Attempts Against Grievance Events Blocked by Trigger (Audit Integrity)*
     - **Action:** An adversary or compromised application role attempts to issue SQL `UPDATE` or `DELETE` statements against `public.grievance_events`.
     - **Assertion:** Trigger `trg_grievance_events_immutable` executes `prevent_grievance_event_mutation()` and raises SQLSTATE `42501` exception. Modifying or deleting event rows is strictly blocked. Event hash chain verification confirms SHA-256 integrity across all records.
  7. *Scenario 7: Public Case-Reference Enumeration Attempts Mitigated (Security & Anti-Enumeration)*
     - **Action:** An attacker attempts sequential enumeration or brute-force scanning of case references (`ISHTI-CASE-2026-0001`, `ISHTI-CASE-2026-0002`).
     - **Assertion:** References are generated as unguessable CSPRNG Crockford Base32 tokens (`ISHTI-GRV-` + 16 chars, 80 bits entropy, e.g. `ISHTI-GRV-7M9K-2WX4-BQ8R-5TY1`). The public status endpoint (`GET /api/compliance/status`) enforces Layer 1 rate limits (5 req / 15 min per IP), requires secondary verification (public reference + verified complainant email + OTP), and returns generic uniform 404/403 responses without disclosing internal IDs or case existence.
  8. *Scenario 8: Lawful Retention & Deletion Processing via Signed Redaction Tombstones Without Falsifying Audit History*
     - **Action:** A court order or DPDP §12(3) erasure requires purging sensitive intimate imagery or PII from a closed grievance case while maintaining statutory audit integrity under IT Rules and CERT-In directions.
     - **Assertion:** The system does NOT delete or mutate historical rows in `public.grievance_events`. Instead, it appends a signed `REDACTION_TOMBSTONE` event referencing the lawful order, purges the underlying binary from quarantined storage, sets `public.grievance_evidence.retention_status = 'PURGED_LAWFUL_ORDER'`, and leaves the historical Merkle hash chain intact and mathematically valid.

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

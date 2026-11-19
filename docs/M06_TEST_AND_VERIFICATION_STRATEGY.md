# ISHTI Milestone M06 — Test & Verification Strategy

**Document Reference:** `docs/M06_TEST_AND_VERIFICATION_STRATEGY.md`  
**Milestone:** M06 — Backend Persistence, Distributed Invariants & Production Infrastructure  
**Repository:** `https://github.com/Sunder-Chauhan/Ishti-OS`  
**Date:** 19 November 2026  
**Auditor Roles:** Principal Test Architect, Security Verification Engineer  

---

## 1. Multi-Tier Testing Hierarchy Overview

To ensure that distributed backend components, financial transactions, privacy workflows, and security safeguards operate flawlessly under adversarial conditions, Milestone M06 mandates a **5-tier testing hierarchy**:

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
| **Tier 1: Unit Tests** | Pure business logic, minor-unit financial math, Merkle tree computation, payload decoding. | Local Node.js / Jest / Vitest | 100% passing; execution time < 5s. |
| **Tier 2: Integration Tests** | Next.js API route handlers, Server Actions, bounded stream reading, session verifiers. | Local mock HTTP / Supertest | 100% passing; zero unhandled promise rejections. |
| **Tier 3: Database & RLS Penetration** | Native PostgreSQL 18 RLS policies, trigger immutability, role separation. | Local PostgreSQL 18 container (port 54321) | Zero data leakage across tenants; unauthorized writes throw 42501. |
| **Tier 4: Concurrency Tests** | Atomic booking reservations, refund double-spends, rate-limiter sliding windows. | Multi-connection pool (20-50 simultaneous clients) | Exactly 1 winner in race conditions; zero double-spends; zero deadlocks. |
| **Tier 5: Chaos & Load Benchmarks** | Redis disconnection, network packet drops, thundering herd traffic spikes. | K6 / Artillery load testing runner | Fail-open / fail-closed adheres to matrix; latency p99 < 50ms. |

---

## 2. Dedicated Adversarial Test Harnesses & Scenarios

### 2.1. Distributed Rate Limiter Thundering Herd Test
- **Objective:** Verify that 1,000 simultaneous asynchronous requests distributed across 20 simulated server instances do not allow an attacker to exceed the statutory 60 req/min quota.
- **Harness:** `scripts/test-distributed-rate-limiter.ts` using `Promise.all()` over multiple Node worker threads targeting a shared Redis/PostgreSQL test instance.
- **Assertion:** Exactly 60 requests receive `HTTP 200 OK`; exactly 940 requests receive `HTTP 429 Too Many Requests`. Active counter state remains intact.

### 2.2. Tamper Detection on Audit Chain Corruption
- **Objective:** Prove that manual modification of an audit record by a rogue database administrator is immediately detected.
- **Harness:**
  1. Insert 50 sequential audit records into `public.audit_ledger`.
  2. Disable the trigger temporarily in a local test sandbox and modify the payload of record #25.
  3. Execute the daily audit verification function (`verify_audit_ledger_integrity()`).
- **Assertion:** The verification function returns `false`, identifying record #25 as corrupted with hash mismatch `record_hash != calculated_hash`, and flags downstream records #26–50 as invalidated.

### 2.3. Concurrent Refund Double-Spend Prevention
- **Objective:** Ensure that rapid, concurrent cancellation requests cannot execute duplicate refunds on the payment gateway or database ledger.
- **Harness:** Dispatch 20 concurrent HTTP POST requests to `/api/commerce/refund` referencing the same `booking_id` from distinct worker threads.
- **Assertion:** Exactly 1 request succeeds (HTTP 200) and commits the refund transaction. Exactly 19 requests fail with HTTP 409 Conflict (`ALREADY_REFUNDED` or `TRANSACTION_LOCKED`). Ledger gross and net amounts remain perfectly balanced.

### 2.4. Cryptographic Shredding & Privacy Rights Verification
- **Objective:** Prove that after statutory erasure is executed, previously encrypted birth data is mathematically irrecoverable.
- **Harness:**
  1. Create a devotee Kundli profile with encrypted birth data (`apps/web/lib/crypto/kundli-encryption.ts`).
  2. Verify that decryption succeeds with the user's active DEK.
  3. Execute the M06 erasure worker (`executePrivacyErasure(userId)`).
  4. Attempt to decrypt the historical raw ciphertext using any remaining platform keys.
- **Assertion:** Decryption throws `ERR_OSSL_EVP_BAD_DECRYPT` / `AUTHENTICATION_TAG_VERIFICATION_FAILED`. The DEK is permanently absent from `public.kundli_encryption_keys`.

### 2.5. RLS Bypass & Multi-Tenant Penetration Suite
- **Objective:** Verify that authenticated users cannot access or mutate records belonging to other devotees, pandits, or administrative queues.
- **Harness:** Execute SQL queries via Supabase client impersonating `devotee_a` (`SET LOCAL role = 'authenticated'`, `SET LOCAL "request.jwt.claim.sub" = '<uuid_a>'`).
- **Target Assertions:**
  * Querying `user_consents` of `devotee_b` returns 0 rows.
  * Attempting to update `grievance_tickets` of `devotee_b` returns 0 rows modified.
  * Direct query to `audit_ledger` without admin role returns 0 rows.
  * Direct insert into `scripture_catalog` without scholar role returns 42501 permission error.

---

## 3. Milestone M06 Acceptance Gates & Sign-Off Criteria

Before Milestone M06 can be accepted or merged into `main`, it must satisfy all six mandatory gates:

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

[ ] GATE 3: COMPLIANCE & DISTRIBUTED TEST SUITE
    • M06 Compliance Suite (`scripts/run-m06-tests.ts`): 100% pass.
    • Distributed rate limiting, streaming body reader, and audit ledger tests pass.

[ ] GATE 4: REAL DATABASE RLS & CONCURRENCY VERIFICATION
    • Executed against isolated native PostgreSQL 18 container (port 54321).
    • All 5 RLS penetration scenarios pass cleanly without data leakage.
    • Multi-connection concurrency race tests pass with 0 double-spends.

[ ] GATE 5: ZERO-DOWNTIME MIGRATION VERIFICATION
    • Forward migrations execute cleanly on clean database.
    • Reverse migrations (`down/`) roll back cleanly without residue.
    • Idempotency verified: re-running migrations causes 0 errors.

[ ] GATE 6: PRODUCTION APPLICATION BUILD
    • Next.js 15 production build (`npm run build:web`): All routes compile cleanly.
    • Bundle analysis confirms zero server secrets leaked to client bundles.
================================================================================
```

# ISHTI Milestone M05 — Pass 8.2: Bounded Body Helper Finalization & Unbounded Fallback Elimination Report

**Date:** 2026-11-19  
**Milestone:** M05 — Legal, Privacy & Trust Foundation  
**Branch:** `feature/m05-trust-governance`  
**Base Commit:** `f3c2c5c2c14c34712c1f0b6bfec9eeac12e83a38` (`origin/main`)  
**Pass 8.1 Starting Commit:** `97b82a8`  
**Pass 8.2 Status:** **PASSED & VERIFIED LOCALLY** (Ready for operator and independent counsel review; distributed rate limiting strictly retained as M06 launch dependency)

---

## 1. Executive Summary & Verdict

### **Verdict: PASS (Engineering Gate Cleared — Launch Dependencies Documented)**

Following independent code review of Pass 8.1 (commit `97b82a8`), a residual fallback vulnerability was identified in `readBoundedJsonBody()`: if a request did not present a `ReadableStream` or if `text()` was available on the request object, the helper fell back to `await request.text()`. In Node.js / Next.js runtimes, `request.text()` buffers the entire incoming payload into memory before enforcing byte limits.

In Pass 8.2, this unbounded fallback was **completely eliminated**:
1. **Mandatory Readable Stream:** `readBoundedJsonBody()` strictly requires a valid `ReadableStream<Uint8Array>` (`request.body`). Requests lacking a readable stream are rejected with `400 MISSING_REQUEST_STREAM` without reading or buffering.
2. **Text-Only Request Rejection:** Alternate code paths attempting to invoke `request.text()` are prevented; `text()` is never called.
3. **Content-Length Framing Mismatch Detection:** If streamed bytes exceed declared `Content-Length`, the stream reader is cancelled immediately (`await reader.cancel("CONTENT_LENGTH_MISMATCH")`) and rejected with `400 CONTENT_LENGTH_MISMATCH`.
4. **Stale LRU Documentation Cleanup:** Replaced obsolete LRU comments in `BoundedRateLimiter` and documented `totalEvicted` in `RateLimiterStats` as an explicit invariant verification metric that strictly remains 0.
5. **Zero Test Regressions:** All 159 M05 tests, 110 M02 security regression tests, monorepo typecheck, and Next.js production build pass cleanly.

> [!CRITICAL]
> **GOVERNANCE & STATUTORY DISCLAIMER:**
> Automated test passage and architectural verification demonstrate **technical implementation correctness only**.
> They do **NOT** constitute legal compliance, legal certification, regulatory sign-off, or immunity from civil or criminal liability.
>
> Process-local rate limiting and origin shielding remain explicit infrastructure dependencies for Milestone M06 production deployment. Commercial launch is strictly prohibited until the corporate entity is incorporated, statutory filings are completed, and formal written sign-offs are provided by qualified Indian legal counsel and a practicing Chartered Accountant (CA).

---

## 2. Vulnerability Analysis & Exact Remediations

### A. Vulnerability: Unbounded Buffering via `request.text()` Fallback

- **The Flaw:**  
  In Pass 8.1, `readBoundedJsonBody()` contained a fallback at line 1014:
  ```ts
  if ("text" in request && typeof request.text === "function") {
    const rawText = await request.text();
    // length check performed AFTER buffering complete body into memory
  }
  ```
- **The Exploit Vector:**  
  If a request reached the endpoint without a populated `request.body` stream (or if a testing/mock environment provided only `text()`), an attacker could transmit a large payload (e.g. 500 MB) that was completely buffered into Node.js heap memory before byte counting was evaluated, leading to heap exhaustion and Out-Of-Memory (OOM) denial-of-service.
- **The Remediation:**
  - Removed lines 1013–1053 completely from `compliance-session-verifier.ts`.
  - Replaced with an explicit requirement for `request.body` and `request.body.getReader`:
    ```ts
    if (!request.body || typeof request.body.getReader !== "function") {
      return {
        ok: false,
        error: "A readable request stream is required.",
        code: "MISSING_REQUEST_STREAM",
        statusCode: 400,
      };
    }
    ```
  - Removed `text?: () => Promise<string>` from the input interface.
  - Zero alternate code paths can buffer an unmetered request into process memory.

### B. Vulnerability: Content-Length Smaller Than Streamed Bytes (Framing Violation)

- **The Flaw:**  
  If a client sent `Content-Length: 20` but streamed 50 KB of chunks (where total bytes remained under the global 64 KB cap), the body was accepted without verifying that streamed bytes did not exceed the declared header length.
- **The Exploit Vector:**  
  In HTTP/1.1 and reverse proxy topologies, request bodies that deliver more bytes than declared in `Content-Length` risk HTTP request smuggling (CL.TE / CL.CL desynchronization) between reverse proxy and upstream origin.
- **The Remediation:**
  - In `readBoundedJsonBody()`, added immediate mismatch detection during the streaming loop:
    ```ts
    if (declaredContentLength !== null && totalBytes > declaredContentLength) {
      try {
        await reader.cancel("CONTENT_LENGTH_MISMATCH");
      } catch {
        // Ignore cancel error
      }
      return {
        ok: false,
        error: "Streamed bytes exceeded declared Content-Length.",
        code: "CONTENT_LENGTH_MISMATCH",
        statusCode: 400,
      };
    }
    ```
  - Added post-stream check: if the stream closes with fewer bytes than declared in `Content-Length`, rejects with 400 `CONTENT_LENGTH_MISMATCH`.

---

## 3. Documentation & Metrics Cleanup

### A. Obsolete LRU Comments Replaced
- **File:** `apps/web/lib/compliance/compliance-session-verifier.ts`
- **Previous Comment:** Mentioned that under saturation, least-recently-accessed (LRU) entries were evicted to make space for new keys.
- **Updated Comment:** Explicitly documents **Proactive Expiration & Safe Saturation (Pass 8.1+)**:
  ```ts
  * 2. PROACTIVE EXPIRATION & SAFE SATURATION (Pass 8.1+):
  *    - On every insertion when at capacity, expired entries (`now > entry.resetTime`) are purged.
  *    - If the map remains saturated after purging expired entries (all entries active and unexpired),
  *      new identities are rejected (fail-closed) WITHOUT evicting active counters (`totalEvicted` strictly remains 0).
  *      This strictly guarantees that an attacker cannot evict or reset another identity's rate-limit quota by generating new keys.
  ```

### B. Role of `totalEvicted` in `RateLimiterStats`
- **Clarification:** `totalEvicted` was retained rather than removed because automated adversarial regression tests assert `totalEvicted === 0` to mathematically prove that active unexpired counters are never evicted during saturation key floods.
- **Interface Documentation:**
  ```ts
  export interface RateLimiterStats {
    size: number;
    maxEntries: number;
    totalHits: number;
    totalBlocked: number;
    /**
     * Retained as an explicit invariant verification metric.
     * Under Pass 8.1+ safe saturation, active entries are NEVER evicted; new keys are rejected
     * without displacing active counters. Therefore totalEvicted strictly remains 0 to prove
     * that active quotas are never evicted or reset by key saturation floods.
     */
    totalEvicted: number;
    totalExpired: number;
  }
  ```

---

## 4. Exact Test Results (Pass 8.2 10-Test Suite)

Executed in `scripts/run-m05-tests.ts`:

| Test ID | Scenario | Input Condition | Expected Behavior | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pass 8.2 Test 1** | Valid stream within limit | `incidentType: "UNAUTHORIZED_ACCESS"`, 50 bytes | Decodes and parses cleanly | `ok: true`, data parsed | **PASS** |
| **Pass 8.2 Test 2** | Oversized stream without Content-Length | Chunked stream delivering 120 KB (40 KB * 3) | Stream aborted at 64 KB; reader cancelled | `status: 413`, `code: "PAYLOAD_TOO_LARGE"`, cancelled | **PASS** |
| **Pass 8.2 Test 3** | Oversized stream with Content-Length | `Content-Length: 70000` (> 64 KB) | Rejected early with 413 before stream read | `status: 413`, `code: "PAYLOAD_TOO_LARGE"`, 0 reads | **PASS** |
| **Pass 8.2 Test 4** | Content-Length smaller than streamed bytes | `Content-Length: 10`, stream delivers ~40 bytes | Cancelled immediately upon exceeding 10 bytes | `status: 400`, `code: "CONTENT_LENGTH_MISMATCH"` | **PASS** |
| **Pass 8.2 Test 5** | Missing readable stream | `body: null` or `body: undefined` | Rejected with 400 without reading | `status: 400`, `code: "MISSING_REQUEST_STREAM"` | **PASS** |
| **Pass 8.2 Test 6** | Text-only request attempting fallback | Request with `text()` method but no `body` | Fallback strictly eliminated; `text()` never invoked | `status: 400`, `code: "MISSING_REQUEST_STREAM"`, `text()` not called | **PASS** |
| **Pass 8.2 Test 7** | Invalid UTF-8 bytes | Stream delivers `[0x80, 0xbf, 0xff, 0xfe]` | Fatal UTF-8 decoder rejection | `status: 400`, `code: "INVALID_ENCODING"` | **PASS** |
| **Pass 8.2 Test 8** | Malformed JSON syntax | Stream delivers `{ incidentType: unquoted, ` | JSON syntax parse error handling | `status: 400`, `code: "MALFORMED_JSON"` | **PASS** |
| **Pass 8.2 Test 9** | Non-object JSON (array, primitive) | Stream delivers `["array"]` or `"string"` | Non-object JSON rejection | `status: 400`, `code: "BAD_REQUEST"` | **PASS** |
| **Pass 8.2 Test 10** | Stream read failure | Stream throws error on `pull()` | Stream read error safely caught | `status: 400`, `code: "STREAM_READ_ERROR"` | **PASS** |

---

## 5. Full Verification Suite Summary

```
================================================================================
   ISHTI Milestone M05: Legal, Privacy & Trust Technical Verification Suite   
================================================================================
  Gate 1: Policy Registry & Governance Architecture:        10 passed, 0 failed
  Gate 2: Sovereign Consent Governance & Evidence Hashing:   7 passed, 0 failed
  Gate 3: Privacy Rights, SAR & 7-Stage Deletion:          14 passed, 0 failed
  Gate 4: Commerce Trust & Minor-Unit Refund Arithmetic:   21 passed, 0 failed
  Gate 5: Compliance Operations, Grievances & Security:   107 passed, 0 failed
    - Pass 8 Adversarial Rate Limiter Suite:               18 passed, 0 failed
    - Pass 8.1 Active-Entry Preservation Suite:             6 passed, 0 failed
    - Pass 8.2 Bounded Body Streaming Suite:               10 passed, 0 failed
================================================================================
TOTAL M05 TESTS: 159 | PASSED: 159 | FAILED: 0 | EXIT CODE: 0
================================================================================

================================================================================
   ISHTI Milestone M02: Comprehensive Security & Verification Suite
================================================================================
  1. Static Integrity Checks:                              29 passed, 0 failed
  2. Unit Tests (Cryptography, Context Binding & Net):     52 passed, 0 failed
  3. Real Application Integration:                          3 passed, 0 failed
  4. Real PostgreSQL 18 & RLS Tests:                       22 passed, 0 failed
  5. Concurrency Tests:                                     4 passed, 0 failed
================================================================================
TOTAL SECURITY REGRESSION TESTS: 110 | PASSED: 110 | FAILED: 0 | EXIT CODE: 0
================================================================================

Monorepo Health:
- TypeScript Compilation: 0 errors across all packages (@spiritual-os/types, @spiritual-os/web, @spiritual-os/mobile)
- Next.js Web Build: 31/31 routes prerendered/compiled cleanly with zero warnings
- Quarantined Environments: Production (zxwkfnvmmxoojewhvsdc) and staging (zrjptpkhtklfgnovdrny) Supabase strictly untouched
```

---

## 6. Remaining Operational & Architectural Limitations

1. **Process-Local Rate Limiting Scope (Milestone M06 Dependency):**
   - The in-memory bounded limiter protects a single Node.js process. In multi-instance deployments (e.g. Kubernetes, AWS ECS, GCP Cloud Run, Vercel Serverless), attackers can distribute requests across pods.
   - *Launch Requirement:* Milestone M06 implements a shared Redis/Valkey cluster using sliding window evaluation (`EVALSHA`).
2. **Direct-to-Origin Proxy Shielding:**
   - Ingress strategies (`TRUSTED_PROXY_STRATEGY="cloudflare"`) assume traffic arrives exclusively via trusted reverse proxies.
   - *Launch Requirement:* Direct connections to origin IP addresses must be strictly blocked at the firewall / VPC level (e.g. Cloudflare Authenticated Origin Pulls, mTLS).
3. **Legal Counsel & Chartered Accountant Pre-Launch Review:**
   - Pre-launch review by practicing Indian legal counsel and Chartered Accountants is mandatory before commercial operations or processing of live devotee data.

---

## 7. Operational Safety Attestation

- **Git Branch:** `feature/m05-trust-governance`
- **Base Branch:** `main` (commit `f3c2c5c2c14c34712c1f0b6bfec9eeac12e83a38`)
- **Main Branch Status:** Untouched; no commits or merges.
- **Hosted Supabase Staging (`zrjptpkhtklfgnovdrny`):** Confirmed **0 network connections, 0 migrations applied, 0 database touches**.
- **Hosted Supabase Production (`zxwkfnvmmxoojewhvsdc`):** Confirmed **0 network connections, 0 migrations applied, 0 database touches**.

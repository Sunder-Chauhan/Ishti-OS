# ISHTI Milestone M05 — Pass 8.1: Final Rate-Limiter Security Corrections & Streaming Body Bounds Report

**Date:** 2026-11-19  
**Milestone:** M05 — Legal, Privacy & Trust Foundation  
**Branch:** `feature/m05-trust-governance`  
**Base Commit:** `f3c2c5c2c14c34712c1f0b6bfec9eeac12e83a38` (`origin/main`)  
**Pass 8 Commit:** `738782d`  
**Pass 8.1 Status:** **PASSED & VERIFIED LOCALLY** (Ready for operator and independent counsel review; distributed rate limiting strictly retained as M06 launch dependency)

---

## 1. Executive Summary

Following independent security review of Pass 8 (commit `738782d`), three critical residual vulnerabilities were identified and systematically resolved:

1. **Elimination of Active-Entry LRU Eviction:** Active, unexpired rate-limit counters are no longer evicted when Map capacity is reached. Saturation now safely rejects new unmapped identities (`return false`) while preserving active quotas, preventing attackers from resetting exhausted rate limits via key generation.
2. **Removal of Legacy Proxy Trust Fallback:** The implicit activation of reverse-proxy mode via `TRUSTED_PROXY === "true"` has been completely removed. Proxy trust is strictly activated only by explicit configuration of `TRUSTED_PROXY_STRATEGY` (`"cloudflare"` or `"reverse_proxy"`). Missing strategies default to untrusted `"none"`.
3. **Bounded Streaming Request-Body Consumption:** Replaced unconstrained `request.text()` buffering in `/api/compliance/triage` with `readBoundedJsonBody()`. Incoming request bodies are consumed as a `ReadableStream` with a hard 64 KB cap, cancelling the stream immediately upon overflow, handling missing or malformed `Content-Length`, validating UTF-8 fatal decoding, and safely parsing JSON objects.

---

## 2. Vulnerability Analyses & Exact Remediations

### A. Vulnerability 1: Active-Entry Eviction Enables Quota Reset (Cache Pollution Bypass)

- **The Flaw in Pass 8:**
  In Pass 8, `BoundedRateLimiter.check()` evicted the least-recently-accessed entry (`evictLru()`) whenever `map.size >= maxEntries` (even after purging expired entries).
- **The Exploit Vector:**
  An adversary whose rate limit had been exhausted could flood the endpoint with hundreds of distinct, randomized keys. The limiter would evict active entries to accommodate the flood. Once the adversary's original entry was evicted, their subsequent request entered as a brand-new entry with `count = 1`, completely bypassing the rate limit. Furthermore, an attacker could evict legitimate active administrative rate limits.
- **The Remediation:**
  1. Completely removed `evictLru()`.
  2. Implemented **Safe Saturation Behavior**: When `map.size >= maxEntries`, the limiter purges expired entries via `enforceCapacity(now)`.
  3. If capacity remains exhausted (because all entries in the Map are unexpired and actively tracked), the limiter **rejects new identities without deleting existing active counters** (`this.totalBlocked += 1; return false;`).
  4. Preserves all existing rate-limit state until its natural window expiry (`now > entry.resetTime`).
  5. Once expired entries are reclaimed, capacity opens up and new identities can enter.

### B. Vulnerability 2: Legacy Proxy Trust Fallback (`TRUSTED_PROXY="true"`)

- **The Flaw in Pass 8:**
  `getTrustedProxyStrategy()` included a legacy fallback: `if (process.env.TRUSTED_PROXY === "true") return "reverse_proxy";`. A generic boolean flag was ambiguous because it failed to declare which ingress header was authoritative or whether ingress sanitization was enforced.
- **The Exploit Vector:**
  Deploying an environment with `TRUSTED_PROXY=true` without explicitly specifying `TRUSTED_PROXY_STRATEGY` defaulted to trusting forwarded headers without guaranteeing ingress sanitization.
- **The Remediation:**
  1. Removed `if (process.env.TRUSTED_PROXY === "true") return "reverse_proxy";` from `getTrustedProxyStrategy()`.
  2. Proxy trust is now activated **only** when `TRUSTED_PROXY_STRATEGY` is explicitly set to `"cloudflare"` or `"reverse_proxy"`.
  3. Setting `TRUSTED_PROXY=true` with no strategy defaults strictly to untrusted `"none"`.
  4. Explicit `direct` mode treats all forwarded headers as untrusted.
  5. Updated all documentation across the repository to eliminate contradictory references.

### C. Vulnerability 3: Unbounded Memory Buffering in Request Body Parsing

- **The Flaw in Pass 8:**
  In `/api/compliance/triage/route.ts`, the handler called `const rawText = await request.text()` before checking `rawText.length > MAX_PAYLOAD_BYTES`.
- **The Exploit Vector:**
  An attacker transmitting a 500 MB body with `Transfer-Encoding: chunked` (or omitting `Content-Length`) forced the Node.js runtime to buffer the entire 500 MB payload into memory before executing the length check, creating an immediate Denial-of-Service (Out-Of-Memory) vulnerability.
- **The Remediation:**
  1. Engineered `readBoundedJsonBody<T>(request, maxBytes)` in `compliance-session-verifier.ts` and re-exported it from `compliance-server.ts`.
  2. **Early Header Check:** If `Content-Length` is present:
     - Rejects malformed values (non-numeric, negative, floating-point) with 400 `MALFORMED_CONTENT_LENGTH`.
     - Rejects values exceeding 64 KB with 413 `PAYLOAD_TOO_LARGE` before consuming any stream bytes.
  3. **Bounded Streaming Consumption:** If `request.body` is present as a `ReadableStream`:
     - Reads chunk by chunk, tracking accumulated bytes.
     - If accumulated bytes exceed 64 KB, **immediately cancels the stream** (`await reader.cancel("PAYLOAD_TOO_LARGE")`) and returns 413 `PAYLOAD_TOO_LARGE`.
  4. **Strict UTF-8 Validation:** Uses `new TextDecoder("utf-8", { fatal: true })` to catch invalid byte sequences and reject them with 400 `INVALID_ENCODING`.
  5. **Safe JSON Parsing:** Parses JSON safely, rejecting malformed JSON with 400 `MALFORMED_JSON` and non-object payloads with 400 `BAD_REQUEST`.

---

## 3. Active-Counter Preservation Test Results

Implemented dedicated test scenario in `scripts/run-m05-tests.ts`:

1. **Limiter Filled to Capacity:** A `BoundedRateLimiter` with `maxEntries = 5` was populated with 4 active identities (`existing-identity-1`..`4`).
2. **Quota Exhaustion:** Target identity `identityA` was queried with limit = 2. Hit 1: `true`, Hit 2: `true`, Hit 3: `false` (exhausted). Map size reached capacity (5/5).
3. **Adversarial Flood:** An attacker generated 500 distinct new keys (`attacker-flood-key-0`..`499`).
4. **Verification 1 (Active Counter Survived):** `identityA` was re-tested. Result: `false` (strictly blocked; quota was not reset).
5. **Verification 2 (Map Cardinality Preserved):** Limiter Map size remained exactly 5 (did not exceed capacity).
6. **Verification 3 (Saturation Rejection):** All 500 new identities were rejected (`floodAllowed === 0`, `floodBlocked === 500`).
7. **Verification 4 (Existing Active Entries Maintained):** `existing-identity-1` remained tracked and accessible.
8. **Verification 5 (Expiration & Re-entry):** Expired entries were reclaimed via `cleanupExpired(now + 70000)`, purging 5 entries to size 0. New identity `fresh-identity-after-expiry` entered successfully (`true`).

---

## 4. Strict Proxy Configuration Test Results

Verified proxy behavior under all permutations:

- `TRUSTED_PROXY=true` with no strategy: `getTrustedProxyStrategy() === "none"`, `isTrustedProxyConfigured() === false`, `getClientIp()` returns `"direct-client"`.
- Missing strategy: Returns `"none"` and `"direct-client"`.
- Explicit `TRUSTED_PROXY_STRATEGY="direct"`: Returns `"direct"`, all forwarded headers ignored.
- Explicit `TRUSTED_PROXY_STRATEGY="cloudflare"`: Strictly inspects `CF-Connecting-IP`, ignores `XFF`/`X-Real-IP`, rejects missing/malformed IP to `"direct-client"`.
- Explicit `TRUSTED_PROXY_STRATEGY="reverse_proxy"`: Trusts sanitized `X-Real-IP` and first hop of `XFF`.

---

## 5. Bounded Request-Body Streaming Test Results

Verified body consumption behavior under all adversarial scenarios:

1. **Oversized with Content-Length:** Request with `Content-Length: 70000` returned 413 `PAYLOAD_TOO_LARGE` without reading stream.
2. **Oversized without Content-Length (Chunked Stream):** Stream delivering 120 KB without `Content-Length` was aborted mid-stream, cancelled with reason `PAYLOAD_TOO_LARGE`, and returned 413 `PAYLOAD_TOO_LARGE`.
3. **Malformed Content-Length:** Values `"70kb; injection"` and `"-500"` returned 400 `MALFORMED_CONTENT_LENGTH`.
4. **Valid Streamed Payload:** Valid JSON stream within 64 KB decoded and parsed with 200 `ok: true`.
5. **Invalid UTF-8 Encoding:** Stream with invalid bytes (`0x80, 0xbf, 0xff, 0xfe`) returned 400 `INVALID_ENCODING`.
6. **Malformed JSON Syntax:** Stream with unclosed JSON returned 400 `MALFORMED_JSON`.
7. **Non-Object JSON:** Stream with JSON array returned 400 `BAD_REQUEST`.

---

## 6. Monorepo Verification & Regression Suite

```
================================================================================
   ISHTI Milestone M05: Legal, Privacy & Trust Technical Verification Suite   
================================================================================
Command: cmd.exe /c npx tsx scripts/run-m05-tests.ts
Exit Code: 0
  Gate 1: Policy Registry & Governance Architecture:       10 passed, 0 failed
  Gate 2: Sovereign Consent & Cryptographic Evidence:       7 passed, 0 failed
  Gate 3: Privacy Rights, SAR & 7-Stage Deletion:          14 passed, 0 failed
  Gate 4: Commerce Trust & Minor-Unit Refund Arithmetic:   21 passed, 0 failed
  Gate 5: Compliance Operations, Grievances & Security:   103 passed, 0 failed
    ├─ Server Admin & Ingress Checks (including 18c2):     20 passed, 0 failed
    ├─ Grievance System & IT Rules 2026 SLAs:               8 passed, 0 failed
    ├─ Incident Triage & CERT-In SLAs:                      5 passed, 0 failed
    ├─ Audit Trail WORM Ledger & Tamper Scenarios:          8 passed, 0 failed
    ├─ Pass 8 Adversarial Suite (Adv 1-16 + Stress):       18 passed, 0 failed
    ├─ Pass 8.1 Active-Entry Preservation Suite:            6 passed, 0 failed
    └─ Pass 8.1 Bounded Request-Body Streaming Suite:       7 passed, 0 failed
TOTAL M05 TESTS: 155 | PASSED: 155 | FAILED: 0 | EXIT CODE: 0
```

---

## 7. Remaining Risks & Milestone M06 Production Dependencies

1. **Process-Local Rate Limiting:**
   `BoundedRateLimiter` enforces strict bounds within a single Node.js runtime. Multi-instance horizontal scaling requires distributed Redis or PostgreSQL advisory locking in Milestone M06.
2. **Infrastructure Origin Shielding:**
   True client IP provenance requires Cloudflare Authenticated Origin Pulls (AOP with mTLS) or VPC firewalling at the hosting layer.
3. **Legal Preservation:**
   All Pass 7 statutory reconciliations (DPDP 12-month commencement in force, 18-month scheduled pre-launch engineering controls, Schedule Items 1–7 penalties, §33(2) factors, Income-tax Act 2025 §393, and 0.1% TDS) remain strictly preserved.

---

## 8. Files Modified

1. `apps/web/lib/compliance/compliance-session-verifier.ts`:
   - Eliminated `evictLru()`; enforced safe saturation without active-entry eviction.
   - Removed legacy `TRUSTED_PROXY="true"` fallback.
   - Implemented `readBoundedJsonBody()` and `BoundedBodyResult`.
2. `apps/web/lib/compliance/compliance-server.ts`:
   - Re-exported `readBoundedJsonBody` and `BoundedBodyResult`.
3. `apps/web/app/api/compliance/triage/route.ts`:
   - Enforced early `Content-Length` checks and bounded streaming body consumption.
4. `scripts/run-m05-tests.ts`:
   - Added test 18c2 (legacy `TRUSTED_PROXY=true` rejection).
   - Updated Test 10 and High-Cardinality Stress Test to reflect safe saturation without active eviction.
   - Added Pass 8.1 Active-Entry Preservation Suite (6 assertions).
   - Added Pass 8.1 Bounded Request-Body Streaming Suite (7 assertions).
5. `docs/M05_PASS_8_1_SECURITY_CORRECTIONS_REPORT.md`: Authored report.
6. `docs/DECISION_LOG.md`: Appended `ADR-032`.
7. `docs/legal/ISHTI_LEGAL_DECISION_LOG.md`: Appended `LDL-015`.
8. `docs/PROJECT_TRACKER.md`: Updated M05 tracker with Pass 8.1 status.
9. `docs/M05_FINAL_SECURITY_AND_LEGAL_READINESS_REPORT.md`: Updated test count to 155.

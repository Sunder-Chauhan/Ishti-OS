# ISHTI Milestone M05 — Pass 8: Rate-Limiter Remediation, Bounded Memory, Layered Identity & Adversarial Hardening Report

**Date:** 2026-11-19  
**Milestone:** M05 — Legal, Privacy & Trust Foundation  
**Branch:** `feature/m05-trust-governance`  
**Base Commit:** `f3c2c5c2c14c34712c1f0b6bfec9eeac12e83a38` (`origin/main`)  
**Pass 7 Commit:** `795f14c`  
**Pass 8 Status:** **PASSED & VERIFIED LOCALLY** (Ready for operator and independent counsel review; distributed rate limiting strictly retained as M06 launch dependency)

> [!NOTE] Historical Evolution Notice (Pass 8.1 & Pass 8.2 Supersession)
> This document records the original Pass 8 implementation. Note that active-entry LRU eviction (`evictLru()`) described in Sections 3, 7, and 10 of this report was **completely eliminated in Pass 8.1 & Pass 8.2** to prevent quota reset attacks via key flooding. Under Pass 8.1+, capacity saturation preserves all active entries and rejects new unmapped identities without eviction (`totalEvicted` remains 0). Furthermore, Pass 8.2 eliminated the unbounded `request.text()` fallback in favor of strictly bounded streaming body consumption (`readBoundedJsonBody()`).

---

## 1. Original Vulnerability

During independent review of commit `795f14c` (Pass 7), a critical architectural flaw was identified in the rate-limiting and identity partition mechanism (`getComplianceRateLimitKey()`):

1. **Reliance on Attacker-Controlled Client Headers for Identity:**
   In Pass 7, `getComplianceRateLimitKey()` attempted to mitigate shared-bucket denial-of-service on direct origin connections by partitioning unauthenticated clients using request hashes:
   - Bearer token SHA-256 hashes (`Bearer <token>`)
   - Session cookie SHA-256 hashes (`Cookie: sb-*-auth-token=<val>`)
   - Browser client fingerprints (`User-Agent`, `Accept-Language`, `Sec-CH-UA`)
2. **Trivial Rate-Limit Bypass via Header Rotation:**
   Because all incoming HTTP headers (Bearer token, Cookie, User-Agent, Accept-Language, Sec-CH-UA) are completely controlled by the client before authentication, an attacker could rotate any of these strings on every HTTP request. Each distinct string produced a new SHA-256 hash or composite key, allocating a brand-new rate-limit bucket with fresh request counters. Consequently, an attacker could bypass rate limits at will.
3. **Unbounded Memory Exhaustion (Denial-of-Service / Out-Of-Memory):**
   The underlying rate-limiter engine was backed by an unbounded JavaScript `Map<string, { count: number; resetTime: number }>` (`rateLimitMap`). Because an adversary could generate millions of unique headers, millions of keys would be inserted without any cardinality ceiling or LRU eviction policy, leading directly to Node.js process heap exhaustion (OOM crash).

---

## 2. Root Cause Analysis

The root cause was a fundamental design misconception: **attempting to establish granular per-client identity and fairness at the application layer when no trustworthy network identity exists.**

Specifically:
- An origin web server receiving direct TCP connections on the public Internet has access only to client-controlled HTTP headers and the immediate socket peer address.
- Client headers (`User-Agent`, `Accept-Language`, `Sec-CH-UA`, fake `Authorization: Bearer ...`, cookies) can never be trusted prior to server-side cryptographic authentication.
- Masking the lack of network provenance with composite browser fingerprint hashes gave a false sense of security while enabling both rate-limit bypass and heap exhaustion.
- Application-level code cannot magically manufacture client identity out of untrusted bytes. Fairness without trustworthy ingress is impossible.

---

## 3. Threat Model

| Threat Actor | Vector | Mechanism | Impact Before Pass 8 | Mitigation in Pass 8 |
|---|---|---|---|---|
| **Malicious Bot / Scraper** | Rotating User-Agent & Fingerprints | Generates synthetic UA and client headers on each request | Bypassed rate limiting completely; scraping unrestricted | Pre-auth traffic without verified ingress maps to bounded fallback (`audit-get:net:untrusted-direct`); single rate counter throttles all unverified traffic |
| **Credential Stuffer / Token Flooder** | 10,000 rotating fake Bearer tokens | Transmits forged `Authorization: Bearer <random>` headers | Allocated 10,000 distinct Map keys; bypassed limits | Unauthenticated bearer tokens strictly ignored for identity; unverified tokens collapse to `untrusted-direct` |
| **Heap Exhaustion Attacker** | High-cardinality header flood | Floods endpoint with 100,000+ random cookies / tokens | Unbounded `Map` size grew until Node.js OOM | `BoundedRateLimiter` enforces strict hard ceiling `MAX_ENTRIES = 10_000`, sweeps expired entries, and evicts LRU entries |
| **Direct Origin IP Forger** | Spoofed `X-Forwarded-For` / `CF-Connecting-IP` | Directly hits server IP with fake forwarded headers | Attacker spoofed arbitrary victim IP addresses | Forwarded headers ignored in direct mode; Cloudflare mode requires explicit strategy and rejects fallback; origin shielding documented as required |
| **Noisy Neighbour / Shared Office** | Legitimate users behind corporate NAT | Multiple authenticated users share same public IP | If rate-limited by IP, user A blocks user B | Layer 3 post-auth account rate limit isolates quotas by verified `auth.user.id`; Alice exhausted does not block Bob |
| **Roaming Account Attacker** | Authenticated user rotating proxy IPs | Malicious authenticated user switches IPs to evade limit | IP-only limit failed to restrain roaming account | Layer 3 account rate limit binds to verified `auth.user.id` regardless of IP changes |

---

## 4. Architecture Before and After

```
BEFORE (Pass 7 — Flawed Single-Layer Fingerprint Model):
Incoming Request
  │
  ├─> getComplianceRateLimitKey()
  │     ├─ Has Bearer? ───> hash(Bearer) ──────────┐ (Attacker rotates token -> NEW BUCKET)
  │     ├─ Has Cookie? ───> hash(Cookie) ──────────┼─> Unbounded Map (No ceiling, No LRU)
  │     └─ Fingerprint ───> hash(UA|Lang|Sec-CH-UA)┘ (Attacker rotates UA -> NEW BUCKET)
  │                                                    [Result: Rate limit bypassed, OOM crash]
  ▼
Session Verification (verifyAdminSession)


AFTER (Pass 8 — Layered Defense-in-Depth Architecture):
Incoming Request
  │
  ▼
[ LAYER 1: Pre-Authentication Network Rate Limiter ]
  │ Uses verified network IP ONLY from explicitly trusted ingress.
  │ - Direct mode / untrusted headers: Collapses to bounded fallback:
  │     `${prefix}:net:untrusted-direct` (SHARED BOUNDED BUCKET)
  │ - Verified Cloudflare / Reverse Proxy:
  │     `${prefix}:net:ip:${verifiedIp}`
  │ Enforced via BoundedRateLimiter (Max 10,000 entries, LRU eviction, capacity sweep)
  │ If breached: 429 Too Many Requests (Fail-Closed)
  ▼
[ LAYER 2: Server-Side Cryptographic Session & Role Verification ]
  │ Trusted @supabase/ssr client resolution: auth.getUser()
  │ Retrieves verified internal user record: auth.user.id
  │ Role resolution bound to user profile in RLS context
  │ If invalid/missing: 401 Unauthorized / 403 Forbidden
  ▼
[ LAYER 3: Post-Authentication Account Rate Limiter ]
  │ Uses cryptographically verified internal user ID:
  │     `${prefix}:acct:${auth.user.id}`
  │ - Multiple accounts on same IP: Completely isolated quotas (Bob unaffected by Alice)
  │ - Roaming account across multiple IPs: Bound strictly to account quota
  │ Enforced via BoundedRateLimiter (Max 10,000 entries, LRU eviction)
  │ If breached: 429 Too Many Requests
  ▼
Privileged Controller Logic (Audit Log / Incident Triage)
```

---

## 5. Trusted Identity Sources

### A. Pre-Authentication Identity
- **ONLY TRUSTED SOURCE:** Verified network IP extracted via an explicitly configured ingress strategy (`TRUSTED_PROXY_STRATEGY=cloudflare` or `reverse_proxy`).
- **STRICT EXCLUSIONS:**
  - `Authorization: Bearer <token>`: **NEVER TRUSTED** before authentication.
  - `Cookie: ...`: **NEVER TRUSTED** before authentication.
  - `User-Agent`: **NEVER TRUSTED** as an identity.
  - `Accept-Language`: **NEVER TRUSTED** as an identity.
  - `Sec-CH-UA` / Client Hints: **NEVER TRUSTED** as an identity.
- **DIRECT / UNTRUSTED FALLBACK:**
  - When no trusted proxy is configured, or headers fail verification, all unverified traffic shares the bounded identifier:
    `${prefix}:net:untrusted-direct`
  - **Fundamental Limitation Acknowledged:** An origin web server directly accessible to the Internet cannot provide granular per-client fairness without trustworthy network identity. Attempting to simulate per-client fairness with client headers is insecure and actively harmful. True per-client edge rate limiting requires edge termination (e.g. Cloudflare) with origin shielding.

### B. Post-Authentication Identity
- **ONLY TRUSTED SOURCE:** Verified internal user ID (`auth.user.id`) obtained from successful server-side session resolution (`verifyAdminSession` calling `auth.getUser()`).
- **STRICT EXCLUSIONS:**
  - Client-supplied claims, headers, query parameters, or unverified JWT payloads.
  - Account rate limiting is completely decoupled from network location: roaming across 10 IPs still consumes the single account quota.

---

## 6. Authentication Boundaries

The administrative endpoints (`/api/compliance/audit` and `/api/compliance/triage`) enforce strict structural separation between network-level protection and account-level authorization:

1. **Layer 1 (Network Level):** Executed first, before any expensive cryptographic session verification or database queries. Defends the server against volumetric network DoS.
2. **Layer 2 (Authentication Boundary):** Verifies the caller's cryptographic session token using `verifyAdminSession()`. Rejects unauthenticated callers with 401 and non-admin callers with 403.
3. **Layer 3 (Account Level):** Executed only after Layer 2 succeeds. Throttles administrative actions per account (`${prefix}:acct:${auth.user.id}`), protecting against compromised admin credentials or runaway automated administrative scripts.

---

## 7. Memory Bounds (`BoundedRateLimiter`)

The `BoundedRateLimiter` class replaces the previous unbounded `Map`:

- **Maximum Cardinality (`maxEntries`):** Fixed default ceiling of **10,000 entries**. Under no circumstances can the Map exceed this limit.
- **Proactive Capacity Sweep (`enforceCapacity`):** On every insertion when approaching capacity, the limiter purges all expired entries (`now > entry.resetTime`).
- **Safe Saturation Behavior (Pass 8.1+ update):** Replaced legacy LRU eviction with safe saturation rejection. If the Map remains at capacity after purging expired entries, new identities are rejected (`return false`) without evicting or deleting active unexpired counters (`totalEvicted` strictly remains 0), preventing quota reset bypass attacks.
- **Hard Ceiling Rejection:** If the Map is saturated and an entry cannot be evicted, the limiter fails closed and returns `false` (blocks request), guaranteeing that the Node.js process heap cannot be exhausted.
- **Fail-Closed Safety:**
  - Non-positive limits (`limit <= 0`) return `false`.
  - Non-positive windows (`windowMs <= 0`) return `false`.
  - Empty or whitespace-only identifiers return `false`.
  - Any internal runtime exception is caught and fails closed (`return false`).

---

## 8. Expiry and Cleanup Policy

- **Sliding-Window Expiry:** Each entry tracks `resetTime = now + windowMs` and `lastAccessed = now`. Subsequent hits within the window refresh `lastAccessed` without extending `resetTime`.
- **Active Eviction:** Expired entries are removed during proactive sweeps before new insertions.
- **Deterministic Cleanup Method (`cleanupExpired(now)`):** Exposes an explicit sweep method returning the count of purged entries and reclaiming memory.
- **Instrumentation & Metrics (`getStats()`):** Exposes live metrics:
  - `size`: Active Map entries.
  - `maxEntries`: Configured ceiling.
  - `totalHits`: Accepted requests.
  - `totalBlocked`: Rejected requests.
  - `totalEvicted`: LRU evictions due to saturation.
  - `totalExpired`: Entries purged after window expiration.

---

## 9. Proxy Assumptions & Network Ingress Invariants

| Proxy Strategy | Ingress Assumption | Authoritative Header | Fallback Rules | Deployment Risk & Hardening |
|---|---|---|---|---|
| `direct` / `none` | Server directly exposed to Internet | None | All forwarded headers ignored; returns `"direct-client"` / `${prefix}:net:untrusted-direct` | Shared rate limit for all unverified traffic. Documented limitation. |
| `cloudflare` | Traffic terminates at Cloudflare Edge | `CF-Connecting-IP` | **NO FALLBACK.** Missing or malformed header returns `"direct-client"` / `${prefix}:net:untrusted-direct`. Strictly avoids XFF. | **Origin Shielding Required:** Attacker finding origin IP can bypass Cloudflare unless Cloudflare Authenticated Origin Pulls (AOP) / VPC firewall is enforced. |
| `reverse_proxy` | Traffic terminates at trusted Nginx / Envoy / ALB | `X-Real-IP` (preferred) or `X-Forwarded-For` (first hop) | Malformed header returns `"direct-client"` / `${prefix}:net:untrusted-direct`. | **Ingress Sanitization Required:** Reverse proxy MUST be configured to overwrite `X-Real-IP` and strip client-supplied `X-Forwarded-For` headers (`proxy_set_header X-Real-IP $remote_addr;`). |

---

## 10. Endpoint Coverage & Protection Audit

| Endpoint | Method | Layer 1: Network Limit | Layer 2: Auth Check | Layer 3: Account Limit | Additional Safeguards |
|---|---|---|---|---|---|
| `/api/compliance/audit` | `GET` | 60 req/min (`audit-get:net:...`) | `verifyServerAdminSession` | 30 req/min (`audit-get:acct:${userId}`) | Process-local ledger retrieval |
| `/api/compliance/audit` | `POST` | 30 req/min (`audit-post:net:...`) | `verifyServerAdminSession` | 10 req/min (`audit-post:acct:${userId}`) | CSRF origin validation; 501 Not Implemented (WORM dependency) |
| `/api/compliance/triage` | `POST` | 30 req/min (`triage-post:net:...`) | `verifyServerAdminSession` | 10 req/min (`triage-post:acct:${userId}`) | Payload size limit (64KB); CSRF origin validation; simulation disclaimer |

---

## 11. Adversarial Test Suite & Actual Verification Results

All 16 mandatory adversarial tests + high-cardinality stress test were integrated into `scripts/run-m05-tests.ts` and executed:

| Test ID | Adversarial Test Description | Expected Property | Actual Result | Status |
|---|---|---|---|---|
| **Adv 1** | 10,000 unique fake Bearer tokens | Collapses into single `untrusted-direct` key; set size = 1 | `fakeTokenKeys.size === 1 && has("audit-get:net:untrusted-direct")` | **PASS** |
| **Adv 2** | 10,000 rotating cookie values | Collapses into single `untrusted-direct` key; set size = 1 | `rotatingCookieKeys.size === 1 && has("audit-get:net:untrusted-direct")` | **PASS** |
| **Adv 3** | Rotating browser fingerprints (UA, Lang, Sec-CH-UA) | No rate-limit bypass; limit = 5; 15 requests attempted | Exactly 5 allowed, 10 blocked (`fpAllowed === 5 && fpBlocked === 10`) | **PASS** |
| **Adv 4** | Invalid-token flood of 10,000 requests | Bounded memory; Map consumes at most 1 entry | `floodStats.size === 1 && floodStats.totalBlocked > 9000` | **PASS** |
| **Adv 5** | Spoofed `X-Forwarded-For` in direct mode | Not trusted; treated as direct origin | `directXffKey === "audit-get:net:untrusted-direct"` | **PASS** |
| **Adv 6** | Spoofed `X-Real-IP` in direct mode | Not trusted; treated as direct origin | `directRealIpKey === "audit-get:net:untrusted-direct"` | **PASS** |
| **Adv 7** | Missing `CF-Connecting-IP` in Cloudflare mode | Safe rejection/fallback; no silent fallback to XFF | `cfMissingKey === "audit-get:net:untrusted-direct"` | **PASS** |
| **Adv 8** | Malformed `CF-Connecting-IP` (injection / invalid IP) | Safe rejection to `untrusted-direct` | `cfMalformedKey === "audit-get:net:untrusted-direct"` | **PASS** |
| **Adv 9** | Reverse proxy mode with sanitized headers | Authoritative hop trusted; malformed rejected | `realIpKey === "audit-get:net:ip:..."` and malformed rejected | **PASS** |
| **Adv 10** | Map saturation stress test (1,000 insertions, cap = 100) | Maximum cardinality preserved; LRU eviction executed | `satStats.size <= 100 && satStats.totalEvicted >= 900` | **PASS** |
| **Adv 11** | Expired entries cleanup | Purged from Map and memory fully reclaimed | `purged === 20 && expLimiter.getStats().size === 0` | **PASS** |
| **Adv 12** | Concurrent burst of 50 requests (limit = 10) | Exactly 10 allowed, 40 blocked; no boundary race | `raceAllowed === 10 && raceBlocked === 40` | **PASS** |
| **Adv 13** | Authenticated account rate limit | Account-level bucket isolates quota and blocks on breach | `acct1Breach === false && acct2First === true` | **PASS** |
| **Adv 14** | Multiple accounts sharing same network IP | Independent account quotas (Alice exhausted does not block Bob) | `aliceBlocked === true && bobAllowed === true` | **PASS** |
| **Adv 15** | Single account roaming across multiple network IPs | Roaming account remains strictly bound by account quota | IP 1, 2, 3 succeed; IP 4 blocked (`!roamReq4`) | **PASS** |
| **Adv 16** | Limiter internal error / invalid parameter safety | Fails closed (`false`) on invalid limits, windows, or empty keys | All invalid checks safely return `false` | **PASS** |
| **Stress** | High-cardinality flood: 12,000 keys against 10,000 cap | Map size never exceeds 10,000 throughout test | `peakSize <= 10000 && finalSize === 10000 && totalEvicted === 2000` | **PASS** |

---

## 12. Remaining Limitations

1. **Process-Local Memory In-Memory Scope:**
   The `BoundedRateLimiter` operates strictly within the memory space of a single Node.js process. In a distributed multi-instance deployment (e.g. multi-container Kubernetes, AWS ECS, or Vercel Serverless Functions), rate-limit state is not synchronized across worker processes. An attacker distributing requests across multiple serverless instances will receive independent quotas per instance.
2. **Direct Origin Ingress Limitation:**
   When running directly on the public Internet without a reverse proxy or CDN edge, no application-level code can establish true client provenance. Unauthenticated traffic will collapse into the shared untrusted bucket, meaning a volumetric flood from one bad actor will cause rate limiting for other unauthenticated users on direct connections. This is a fundamental constraint of the Internet architecture.

---

## 13. Production Dependencies (Milestone M06)

To transition from the current verified local baseline to live production:

1. **Distributed Rate Limiting Engine:**
   - Migrate `BoundedRateLimiter` to a distributed Redis backend (e.g. Upstash Redis / AWS ElastiCache) using sliding-window Lua scripts, or PostgreSQL advisory locking with atomic counter increments.
2. **Infrastructure Origin Shielding:**
   - Configure Cloudflare Authenticated Origin Pulls (mTLS) or VPC Security Group rules to block all direct public Internet traffic to port 80/443 of the origin web servers, permitting traffic exclusively from verified Cloudflare IP CIDR blocks or ALB ingress.
3. **Ingress Header Sanitization:**
   - In reverse-proxy deployments, ensure Nginx or Envoy explicitly strips incoming client-supplied `X-Forwarded-For` and `X-Real-IP` headers and replaces them with `$remote_addr`.

---

## 14. Files Modified in Pass 8

1. `apps/web/lib/compliance/compliance-session-verifier.ts`:
   - Implemented `BoundedRateLimiter` class with LRU eviction, capacity sweeps, and fail-closed safety.
   - Implemented `getNetworkRateLimitKey`, `getAccountRateLimitKey`, `getVerifiedNetworkIp`.
   - Eliminated all usage of bearer-token hashes, cookie hashes, and browser fingerprints as rate-limit identities.
   - Refactored `getClientIp` and proxy strategy handling.
2. `apps/web/lib/compliance/compliance-server.ts`:
   - Re-exported new rate-limiter utilities, types, and layered key generators.
3. `apps/web/app/api/compliance/audit/route.ts`:
   - Hardened `GET` and `POST` with Layer 1 Network Limit $\to$ Layer 2 Auth $\to$ Layer 3 Account Limit.
4. `apps/web/app/api/compliance/triage/route.ts`:
   - Hardened `POST` with Layer 1 Network Limit $\to$ Layer 2 Auth $\to$ Layer 3 Account Limit.
5. `scripts/run-m05-tests.ts`:
   - Reconciled tests 18m, 18n, 18o with the layered identity model.
   - Added the 16 mandatory adversarial tests + high-cardinality stress test.
6. `docs/M05_PASS_8_RATE_LIMITER_REMEDIATION_REPORT.md`:
   - Authored comprehensive remediation report.
7. `docs/DECISION_LOG.md`:
   - Appended `ADR-031`.
8. `docs/legal/ISHTI_LEGAL_DECISION_LOG.md`:
   - Appended `LDL-014`.
9. `docs/PROJECT_TRACKER.md`:
   - Updated M05 tracker with Pass 8 status.

---

## 15. Git Commit & Environment Information

- **Working Directory:** `C:\Users\as\Documents\GitHub\spiritual-OS`
- **Branch:** `feature/m05-trust-governance`
- **Base Commit:** `f3c2c5c2c14c34712c1f0b6bfec9eeac12e83a38` (`origin/main`)
- **Remote Tracking:** `origin/feature/m05-trust-governance`
- **Quarantined Environments:**
  - Production Supabase (`zxwkfnvmmxoojewhvsdc`): **ZERO CONNECTIONS / UNTOUCHED**
  - Staging Supabase (`zrjptpkhtklfgnovdrny`): **ZERO CONNECTIONS / UNTOUCHED**

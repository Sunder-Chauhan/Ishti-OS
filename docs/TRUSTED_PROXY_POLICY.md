# ISHTI Trusted Proxy Provenance & Client IP Policy

**Classification:** Internal Engineering & Infrastructure Policy (Security Level 4)  
**Applicability:** ISHTI Web Application (`apps/web`), API Endpoints, Server Actions  
**Last Revised:** November 2026 (Milestone M02 — Reverse Proxy Audit)  
**Status:** Canonical Deployment Standard

---

## 1. Executive Summary & Threat Model

In modern web application architectures, the application server rarely interacts with clients directly. Instead, traffic routes through Content Delivery Networks (e.g., Cloudflare), Application Load Balancers (ALBs), or reverse proxies (e.g., NGINX).

These intermediaries typically forward client IP addresses via HTTP headers:
- `CF-Connecting-IP` (Cloudflare)
- `X-Forwarded-For` (De-facto proxy standard / RFC 7239 predecessor)
- `X-Real-IP` (NGINX / custom proxy configurations)

### The Direct Origin Bypass Vulnerability
If an application server trusts these headers blindly without verifying that the request actually arrived through the trusted intermediary, an attacker who identifies or accesses the origin server directly can execute severe spoofing attacks:

```bash
# Direct-origin attack spoofing Cloudflare and forwarded headers:
curl -H "CF-Connecting-IP: 198.51.100.22" \
     -H "CF-Ray: 7f8a9b0c-IAD" \
     -H "X-Forwarded-For: 203.0.113.195, 198.51.100.5" \
     https://origin-ip-or-direct-domain/api/early-access
```

### Why Hop Counting Alone Does Not Authenticate a Proxy
Hop counting (`parts.length - TRUSTED_PROXY_HOPS`) correctly navigates an `X-Forwarded-For` chain **only after** it has been established that the request arrived through the trusted proxy. 

If an attacker connects directly to the origin server, they control the entire `X-Forwarded-For` header. For example, if `TRUSTED_PROXY_HOPS=1`, an attacker can send:
```bash
curl -H "X-Forwarded-For: 1.1.1.1, 8.8.8.8" https://origin-server/
```
The application code would select `8.8.8.8`, falsely assuming `8.8.8.8` was appended by a trusted reverse proxy when no proxy was ever traversed. **Therefore, header parsing must never be conflated with proxy authentication.**

### Application Framework Boundary Limitation
Next.js server actions and route handlers evaluate incoming requests using the Next.js `headers()` API. Next.js does not expose the underlying Node.js TCP socket `remoteAddress` in server actions or standard route handlers.

Because the application runtime cannot directly inspect the TCP connecting peer IP, **the trust boundary MUST be enforced at the infrastructure layer or via an authenticated proxy-to-origin mechanism.** Application-level header parsing cannot magically verify network provenance without an infrastructure guarantee.

---

## 2. Deployment-Aware Trust Strategies

ISHTI implements a deployment-aware proxy trust policy controlled by `TRUSTED_PROXY_STRATEGY`:

| Strategy | Intended Environment | Header Inspected | Origin Provenance Authentication Requirement |
| :--- | :--- | :--- | :--- |
| `cloudflare` | Cloudflare Edge Termination (Production default) | `CF-Connecting-IP` | Custom Edge Secret (`CLOUDFLARE_EDGE_SECRET`) OR Network Isolation (`CLOUDFLARE_ORIGIN_PROTECTED=true`) |
| `reverse_proxy` | Internal NGINX, AWS ALB, Kubernetes Ingress | `X-Forwarded-For` / `X-Real-IP` | Proxy Shared Secret (`REVERSE_PROXY_SHARED_SECRET`) OR Network Isolation (`REVERSE_PROXY_ORIGIN_PROTECTED=true`) |
| `direct` / `none` | Local development, direct test harness | None (Ignored) | In dev: `127.0.0.1`. In prod: Fails closed (`null`) |

---

## 3. Strategy Specifications & Provenance Verification

### 3.1 Cloudflare Strategy (`TRUSTED_PROXY_STRATEGY=cloudflare`)

When deployed behind Cloudflare:
1. Cloudflare terminates external TLS connections, strips any client-provided `CF-Connecting-IP`, and inserts the authentic client IP.
2. In production (`NODE_ENV === "production"`), the application server **MUST authenticate origin provenance**:
   - **Method A (Shared Edge Secret):** Configure `CLOUDFLARE_EDGE_SECRET` in server environment variables. In Cloudflare Transform Rules (or Cloudflare Workers), inject a custom header `x-ishti-edge-secret: <secret>`. The application server validates this header against `CLOUDFLARE_EDGE_SECRET`. Any request lacking or mismatching this secret is rejected (`null`).
   - **Method B (Infrastructure Origin Protection):** When using Cloudflare Tunnel (`cloudflared`), AWS Security Group ingress restricted exclusively to published Cloudflare IP ranges, or mTLS Authenticated Origin Pulls, direct-origin ingress is impossible at the network layer. The operator explicitly sets `CLOUDFLARE_ORIGIN_PROTECTED=true`.
3. In verified environments, the server validates `net.isIP(cfIp)` and requires `CF-Ray`.
4. **Fail-Closed Default:** If neither `CLOUDFLARE_EDGE_SECRET` nor `CLOUDFLARE_ORIGIN_PROTECTED=true` is present in production, the application treats provenance as untrusted and returns `null`.

### 3.2 Reverse Proxy Strategy (`TRUSTED_PROXY_STRATEGY=reverse_proxy`)

When deployed behind an internal reverse proxy or load balancer (e.g., AWS ALB, NGINX):
1. **Provenance Authentication Requirement:**
   - **Method A (Shared Proxy Secret):** Configure `REVERSE_PROXY_SHARED_SECRET` in server environment variables. In the reverse proxy configuration (e.g. NGINX `proxy_set_header X-Ishti-Proxy-Secret "secret";`), inject `x-ishti-proxy-secret`. The application validates this header against `REVERSE_PROXY_SHARED_SECRET`. Any direct request without this secret is rejected (`null`).
   - **Method B (Infrastructure Network Isolation):** If the application server runs in a private subnet (AWS VPC / Kubernetes internal service) where inbound TCP traffic is firewall-restricted exclusively to the reverse proxy's private IP, direct public ingress is physically impossible. The operator explicitly sets `REVERSE_PROXY_ORIGIN_PROTECTED=true`.
2. **Fail-Closed Protection:** In production, if neither `REVERSE_PROXY_SHARED_SECRET` nor `REVERSE_PROXY_ORIGIN_PROTECTED=true` is established, the application rejects all forwarded headers (`null`). A direct attacker supplying fake `X-Forwarded-For` or `X-Real-IP` headers is rejected immediately.
3. **Right-to-Left Hop Resolution (After Provenance is Established):**
   - The authentic client IP as observed by the outermost trusted proxy is located at:
     $$\text{Target Index} = \text{parts.length} - \text{TRUSTED\_PROXY\_HOPS}$$
   - Example (`TRUSTED_PROXY_HOPS=1`):
     - Client sends: `X-Forwarded-For: 1.1.1.1` (spoofed)
     - ALB sees actual IP `203.0.113.50`, forwards: `X-Forwarded-For: 1.1.1.1, 203.0.113.50`
     - Target Index: $2 - 1 = 1 \rightarrow \text{"203.0.113.50"}$ (Authentic client IP).
4. **Chain Truncation Protection:** If the number of parts in `X-Forwarded-For` is fewer than `TRUSTED_PROXY_HOPS`, the request did not traverse the expected proxy topology. It is immediately rejected (`null`).
5. **X-Real-IP Option:** If `TRUST_X_REAL_IP=true`, the server checks `X-Real-IP` (validated via `net.isIP`). Requires valid proxy provenance as defined in Step 1.

### 3.3 Direct Origin Strategy (`TRUSTED_PROXY_STRATEGY=direct` or `none`)

When running in direct origin mode:
1. All forwarded headers (`CF-Connecting-IP`, `X-Real-IP`, `X-Forwarded-For`) are untrusted and completely ignored.
2. In non-production environments (`NODE_ENV !== "production"`), the server defaults to `"127.0.0.1"` to enable offline development and local automated testing.
3. In production (`NODE_ENV === "production"`), the server returns `null`. **The server NEVER silently substitutes `127.0.0.1` for an unknown production client.**

---

## 4. Rate-Limiting Identity Models & Caller Audit

All rate limiting in ISHTI is executed server-side via `checkRateLimit()`. Client code cannot directly invoke the PostgreSQL `check_rate_limit()` RPC function because execute permissions are revoked from `anon` and `authenticated` roles.

### Identity Models by Bucket:

| Bucket Key | Intended Identity Model | Identifier Source | Client Influence / Bypass Risk | Fail-Closed Config |
| :--- | :--- | :--- | :--- | :---: |
| `early_access` | **Anonymous Devotee Client IP** | Extracted via `extractClientIp(headers)`. Hashed via HMAC-SHA-256. | No client influence. No `identifierOverride` permitted. Untrusted provenance fails closed. | `true` |
| `auth_otp` | **Target Phone Number + Client IP** | Normalized phone number (E.164) and client IP. | Phone number validated server-side (`/^\+?[0-9]{10,15}$/`). Prevents victim SMS bombing and IP flooding. | `true` |
| `kundli_decrypt` | **Authenticated User ID (`auth.uid()`)** | Derived strictly server-side from verified JWT session token (`session.user.id`). | Cryptographically bound to Supabase auth session. Client cannot forge another user's ID. | `true` |
| `booking_request` | **Authenticated Devotee ID (`auth.uid()`)** | Derived strictly server-side from verified JWT session token (`session.user.id`). | Cryptographically bound to Supabase auth session. Client cannot forge another user's ID. | `true` |

### Identifier Override Security Rules:
- `identifierOverride` is an optional server-side argument to `checkRateLimit()`.
- It must only be supplied by server actions or route handlers using **verified server-side data** (such as `auth.uid()` from an authenticated Supabase session).
- `identifierOverride` is trimmed and validated; empty strings or whitespace fall back to IP extraction.
- Clients can never pass `identifierOverride` directly via request bodies, query parameters, or client headers.

---

## 5. Fail-Safe Defaults when Hosting Cannot Guarantee Origin Protection

If hosting infrastructure cannot guarantee network-level origin protection (e.g., origin IP is publicly reachable and proxy secrets cannot be configured):
1. Sensitive endpoints and rate limiters configured with `failClosed: true` will reject requests whose client provenance cannot be verified:
   - Rate limit check returns: `{ allowed: false, reason: "UNTRUSTED_PROXY_PROVENANCE", resetSeconds: 60 }`
   - Application actions return user-facing error: `UNTRUSTED_PROVENANCE`
2. This ensures that attackers cannot flood sensitive endpoints or poison distributed rate limiting buckets using forged IP addresses when edge security is degraded.

---

## 6. Configuration Reference

| Environment Variable | Allowed Values | Default | Purpose / Impact |
| :--- | :--- | :--- | :--- |
| `TRUSTED_PROXY_STRATEGY` | `cloudflare`, `reverse_proxy`, `direct`, `none` | Production: `cloudflare`<br>Dev: `none` | Selects active proxy trust model. |
| `CLOUDFLARE_EDGE_SECRET` | String ($\ge 32$ chars recommended) | `undefined` | Shared secret validated against `x-ishti-edge-secret` header. |
| `CLOUDFLARE_ORIGIN_PROTECTED` | `"true"`, `"false"` | `"false"` | Set to `"true"` ONLY when origin firewall / Cloudflare Tunnel blocks direct traffic. |
| `REVERSE_PROXY_SHARED_SECRET` | String ($\ge 32$ chars recommended) | `undefined` | Shared secret validated against `x-ishti-proxy-secret` header. |
| `REVERSE_PROXY_ORIGIN_PROTECTED`| `"true"`, `"false"` | `"false"` | Set to `"true"` ONLY when origin firewall / private subnet blocks direct traffic. |
| `TRUSTED_PROXY_HOPS` | Positive integer ($\ge 1$) | `1` | Number of trusted reverse proxy hops for `X-Forwarded-For` right-to-left parsing. |
| `TRUST_X_REAL_IP` | `"true"`, `"false"` | `"false"` | Enables extraction from `X-Real-IP` in reverse proxy mode (requires verified provenance). |
| `RATE_LIMIT_HMAC_SECRET` | 64-char Hex OR 32+ byte UTF-8 | `undefined` (required in prod) | Secret key for privacy-preserving HMAC-SHA-256 identifier hashing. |

> [!CAUTION]
> Never log, print, or commit shared secrets (`RATE_LIMIT_HMAC_SECRET`, `CLOUDFLARE_EDGE_SECRET`, `REVERSE_PROXY_SHARED_SECRET`). In all deployment scripts and CI logs, ensure secrets are injected as masked environment variables.

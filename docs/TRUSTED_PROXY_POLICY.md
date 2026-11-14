# ISHTI Trusted Proxy Provenance & Client IP Policy

**Classification:** Internal Engineering & Infrastructure Policy (Security Level 4)  
**Applicability:** ISHTI Web Application (`apps/web`), API Endpoints, Server Actions  
**Last Revised:** November 2026 (Milestone M02)  
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
     -H "X-Forwarded-For: 203.0.113.195" \
     https://origin-ip-or-direct-domain/api/early-access
```

### Why `CF-Ray` Alone Is Not Proof of Edge Origin
A common misconception is checking for the presence of the `CF-Ray` header to verify Cloudflare provenance. **This is insecure.** An attacker targeting an exposed origin can trivially generate and supply an arbitrary string as the `CF-Ray` header. Therefore, `CF-Ray` serves merely as a telemetry marker; it cannot authenticate provenance unless origin-level protection guarantees that direct ingress is physically impossible.

---

## 2. Deployment-Aware Trust Strategies

ISHTI implements a deployment-aware proxy trust policy controlled by `TRUSTED_PROXY_STRATEGY`:

| Strategy | Intended Environment | Header Inspected | Origin Verification Requirement |
| :--- | :--- | :--- | :--- |
| `cloudflare` | Cloudflare Edge Termination (Production default) | `CF-Connecting-IP` | Custom Edge Secret OR Infrastructure Origin Isolation |
| `reverse_proxy` | Internal NGINX, AWS ALB, Kubernetes Ingress | `X-Forwarded-For` / `X-Real-IP` | Right-to-Left Hop Counting (`TRUSTED_PROXY_HOPS`) |
| `direct` / `none` | Local development, direct test harness | None (Ignored) | In dev: `127.0.0.1`. In prod: Fails safe (`null`) |

---

## 3. Strategy Specifications & Provenance Verification

### 3.1 Cloudflare Strategy (`TRUSTED_PROXY_STRATEGY=cloudflare`)

When deployed behind Cloudflare:
1. Cloudflare terminates external TLS connections, strips any client-provided `CF-Connecting-IP`, and inserts the authentic client IP.
2. In production (`NODE_ENV === "production"`), the application server **MUST verify origin protection**:
   - **Method A (Shared Edge Secret):** Configure `CLOUDFLARE_EDGE_SECRET` in environment variables. In Cloudflare Transform Rules (or Cloudflare Workers), inject a custom header `x-ishti-edge-secret: <secret>`. The application server validates this header against `CLOUDFLARE_EDGE_SECRET`. Any request lacking or mismatching this secret is rejected (`null`).
   - **Method B (Infrastructure Origin Protection):** When using Cloudflare Tunnel (`cloudflared`), AWS Security Group ingress restricted exclusively to published Cloudflare IP ranges, or mTLS Authenticated Origin Pulls, direct-origin ingress is impossible at the network layer. The operator explicitly sets `CLOUDFLARE_ORIGIN_PROTECTED=true`.
3. In verified environments, the server validates `net.isIP(cfIp)` and requires `CF-Ray`.
4. **Fail-Closed Default:** If neither `CLOUDFLARE_EDGE_SECRET` nor `CLOUDFLARE_ORIGIN_PROTECTED=true` is present in production, the application treats provenance as untrusted and returns `null`.

### 3.2 Reverse Proxy Strategy (`TRUSTED_PROXY_STRATEGY=reverse_proxy`)

When deployed behind an internal reverse proxy or load balancer (e.g., AWS ALB, NGINX):
1. **X-Forwarded-For Right-to-Left Hop Resolution:**
   - In standard reverse proxy topology, each intermediary appends the IP address from which it received the request to the right of the `X-Forwarded-For` header.
   - The leftmost IP in `X-Forwarded-For` is client-controlled and may be spoofed arbitrarily.
   - The authentic client IP as observed by the outermost trusted proxy is located at:
     $$\text{Target Index} = \text{parts.length} - \text{TRUSTED\_PROXY\_HOPS}$$
   - Example (`TRUSTED_PROXY_HOPS=1`):
     - Client sends: `X-Forwarded-For: 1.1.1.1` (spoofed)
     - ALB sees actual IP `203.0.113.50`, forwards: `X-Forwarded-For: 1.1.1.1, 203.0.113.50`
     - Index: $2 - 1 = 1 \rightarrow \text{"203.0.113.50"}$ (Authentic client IP).
2. **Chain Truncation Protection:** If the number of parts in `X-Forwarded-For` is fewer than `TRUSTED_PROXY_HOPS`, the request did not traverse the expected proxy topology. It is immediately rejected (`null`).
3. **X-Real-IP Option:** If `TRUST_X_REAL_IP=true`, the server checks `X-Real-IP` (validated via `net.isIP`). This is suitable for NGINX configurations using `proxy_set_header X-Real-IP $remote_addr;`.

### 3.3 Direct Origin Strategy (`TRUSTED_PROXY_STRATEGY=direct` or `none`)

When running in direct origin mode:
1. All forwarded headers (`CF-Connecting-IP`, `X-Real-IP`, `X-Forwarded-For`) are untrusted and completely ignored.
2. In non-production environments (`NODE_ENV !== "production"`), the server defaults to `"127.0.0.1"` to enable offline development and local automated testing.
3. In production (`NODE_ENV === "production"`), the server returns `null`. **The server NEVER silently substitutes `127.0.0.1` for an unknown production client.**

---

## 4. Fail-Safe Defaults when Hosting Cannot Guarantee Origin Protection

If an infrastructure provider or hosting setup cannot guarantee network-level origin protection (e.g., origin IP is public and edge secrets cannot be injected):
1. Sensitive endpoints and rate limiters configured with `failClosed: true` (e.g., Early Access registration, OTP generation, Kundli decryption, booking requests) will reject requests whose client provenance cannot be verified:
   - Rate limit check returns: `{ allowed: false, reason: "UNTRUSTED_PROXY_PROVENANCE", resetSeconds: 60 }`
   - Application actions return user-facing error: `UNTRUSTED_PROVENANCE`
2. This ensures that attackers cannot flood sensitive endpoints or poison distributed rate limiting buckets using forged IP addresses when edge security is degraded.

---

## 5. Configuration Reference

| Environment Variable | Allowed Values | Default | Purpose / Impact |
| :--- | :--- | :--- | :--- |
| `TRUSTED_PROXY_STRATEGY` | `cloudflare`, `reverse_proxy`, `direct`, `none` | Production: `cloudflare`<br>Dev: `none` | Selects proxy trust model. |
| `CLOUDFLARE_EDGE_SECRET` | String ($\ge 32$ chars recommended) | `undefined` | Shared secret validated against `x-ishti-edge-secret` header. |
| `CLOUDFLARE_ORIGIN_PROTECTED` | `"true"`, `"false"` | `"false"` | Set to `"true"` ONLY when origin firewall / Cloudflare Tunnel blocks direct traffic. |
| `TRUSTED_PROXY_HOPS` | Positive integer ($\ge 1$) | `1` | Number of trusted reverse proxy hops for `X-Forwarded-For` right-to-left parsing. |
| `TRUST_X_REAL_IP` | `"true"`, `"false"` | `"false"` | Enables extraction from `X-Real-IP` in reverse proxy mode. |
| `RATE_LIMIT_HMAC_SECRET` | 64-char Hex OR 32+ byte UTF-8 | `undefined` (required in prod) | Secret key for privacy-preserving HMAC-SHA-256 identifier hashing. |

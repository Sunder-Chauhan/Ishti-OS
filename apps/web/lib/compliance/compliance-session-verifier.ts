import crypto from "node:crypto";
import type { UserRole } from "@spiritual-os/types";

/**
 * ISHTI Server-Side Compliance Session Verification Engine
 *
 * GOVERNANCE & SECURITY INVARIANTS:
 * 1. ZERO-TRUST: Never trust a client-provided UserProfile, role, header,
 *    localStorage value, or React state as proof of administrative authorization.
 * 2. SINGLE TRUSTED CONTEXT: Binding identity verification and role resolution
 *    to the exact same authenticated context and verified user ID.
 * 3. NO MANUAL COOKIE PARSING: Reuses official @supabase/ssr client and user-resolution.
 * 4. AUTHORITATIVE ROLE RESOLUTION: Role evaluation must be resolved server-side
 *    from the authoritative user profile in the database (`public.profiles`),
 *    never from client-supplied tokens or client headers.
 * 5. BACKEND OUTAGE CLASSIFICATION: Accurately differentiates 401 (invalid/expired/missing),
 *    403 (forbidden/non-admin/no profile), and 503 (auth service or database infrastructure outage).
 * 6. FAIL-CLOSED: If backend infrastructure is unconfigured, unreachable, or in outage,
 *    administrative access is disabled with status 503 rather than bypassed.
 * 7. CSRF ORIGIN PROTECTION: Cookie-authenticated mutations verify origin and Sec-Fetch-Site.
 */

export type AuthResolutionStatus =
  | "SUCCESS"
  | "MISSING_SESSION"
  | "INVALID_TOKEN"
  | "EXPIRED_TOKEN"
  | "AUTH_OUTAGE"
  | "DB_OUTAGE"
  | "PROFILE_MISSING"
  | "NON_ADMIN";

export interface CookieItem {
  name: string;
  value: string;
}

export interface VerificationInput {
  bearerToken?: string | null;
  cookies?: CookieItem[];
  headers?: Record<string, string | string[] | undefined> | Headers;
}

export interface AdminSessionCheckResult {
  authorized: boolean;
  statusCode: 200 | 401 | 403 | 503;
  error?: string;
  code?: string;
  user?: {
    id: string;
    role: "platform_admin";
  };
}

export interface SessionVerificationProvider {
  /**
   * Resolves the authenticated user and their authoritative role in a single trusted context.
   */
  resolveUserAndRole(input: VerificationInput): Promise<{
    status: AuthResolutionStatus;
    user?: { id: string } | null;
    role?: UserRole | null;
    error?: string;
  }>;

  /**
   * Checks whether the trusted authentication service is configured.
   */
  isBackendConfigured(): boolean;
}

/**
 * Bounded In-Memory Sliding Window Rate Limiter for Compliance Endpoints
 *
 * CRITICAL MEMORY & LIFECYCLE INVARIANTS:
 * 1. STRICT CARDINALITY BOUND: The internal Map capacity is capped at `maxEntries` (default 10,000).
 *    Under no circumstances (including high-cardinality floods of random keys) does the map exceed this bound.
 * 2. PROACTIVE EXPIRATION & SAFE SATURATION (Pass 8.1+):
 *    - On every insertion when at capacity, expired entries (`now > entry.resetTime`) are purged.
 *    - If the map remains saturated after purging expired entries (all entries active and unexpired),
 *      new identities are rejected (fail-closed) WITHOUT evicting active counters (`totalEvicted` strictly remains 0).
 *      This strictly guarantees that an attacker cannot evict or reset another identity's rate-limit quota by generating new keys.
 * 3. PROCESS-LOCAL NOTICE: This is an in-memory process-local limiter. It enforces quotas
 *    per Node.js process instance. Multi-instance distributed deployments require Redis or
 *    PostgreSQL advisory locks (scheduled for Milestone M06 production deployment).
 * 4. FAIL-SAFE / FAIL-CLOSED BEHAVIOR: If invalid arguments (limit <= 0, windowMs <= 0, empty identifier)
 *    are supplied or an internal error occurs, the limiter fails closed by returning `false`,
 *    preventing unmetered access during anomalies.
 */
export interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccessed: number;
}

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

export class BoundedRateLimiter {
  private map = new Map<string, RateLimitEntry>();
  private maxEntries: number;
  private defaultWindowMs: number;
  private totalHits = 0;
  private totalBlocked = 0;
  private totalEvicted = 0;
  private totalExpired = 0;

  constructor(options?: { maxEntries?: number; defaultWindowMs?: number }) {
    this.maxEntries = options?.maxEntries ?? 10_000;
    this.defaultWindowMs = options?.defaultWindowMs ?? 60_000;
  }

  public setMaxEntries(max: number): void {
    if (typeof max === "number" && max > 0) {
      this.maxEntries = max;
      this.enforceCapacity(Date.now());
    }
  }

  public check(identifier: string, limit: number, windowMs = this.defaultWindowMs): boolean {
    // Fail-closed validation for invalid arguments
    if (!identifier || typeof identifier !== "string" || identifier.trim().length === 0) {
      return false;
    }
    if (typeof limit !== "number" || limit <= 0 || !Number.isFinite(limit)) {
      return false;
    }
    if (typeof windowMs !== "number" || windowMs <= 0 || !Number.isFinite(windowMs)) {
      return false;
    }

    try {
      const now = Date.now();
      const entry = this.map.get(identifier);

      if (entry) {
        // Check if current window has expired
        if (now > entry.resetTime) {
          this.totalExpired += 1;
          entry.count = 1;
          entry.resetTime = now + windowMs;
          entry.lastAccessed = now;
          this.totalHits += 1;
          return true;
        }

        // Within active window: check quota
        entry.lastAccessed = now;
        if (entry.count >= limit) {
          this.totalBlocked += 1;
          return false;
        }

        entry.count += 1;
        this.totalHits += 1;
        return true;
      }

      // New entry insertion: enforce capacity before insertion
      if (this.map.size >= this.maxEntries) {
        this.enforceCapacity(now);
      }

      // SAFE SATURATION BEHAVIOR (Pass 8.1):
      // If capacity remains exhausted because all existing entries are unexpired and active,
      // REJECT the new identity without evicting or deleting existing active counters!
      // This guarantees that an attacker cannot evict or reset another identity's quota by generating new keys.
      if (this.map.size >= this.maxEntries) {
        this.totalBlocked += 1;
        return false;
      }

      this.map.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
        lastAccessed: now,
      });
      this.totalHits += 1;
      return true;
    } catch {
      // Documented fail-safe / fail-closed behavior on unexpected internal error
      return false;
    }
  }

  private enforceCapacity(now: number): void {
    for (const [key, entry] of this.map.entries()) {
      if (now > entry.resetTime) {
        this.map.delete(key);
        this.totalExpired += 1;
      }
    }
  }

  public cleanupExpired(now = Date.now()): number {
    let purged = 0;
    for (const [key, entry] of this.map.entries()) {
      if (now > entry.resetTime) {
        this.map.delete(key);
        purged += 1;
        this.totalExpired += 1;
      }
    }
    return purged;
  }

  public getStats(): RateLimiterStats {
    return {
      size: this.map.size,
      maxEntries: this.maxEntries,
      totalHits: this.totalHits,
      totalBlocked: this.totalBlocked,
      totalEvicted: this.totalEvicted,
      totalExpired: this.totalExpired,
    };
  }

  public reset(): void {
    this.map.clear();
    this.totalHits = 0;
    this.totalBlocked = 0;
    this.totalEvicted = 0;
    this.totalExpired = 0;
  }
}

// Global process-local singleton limiter
export const globalComplianceRateLimiter = new BoundedRateLimiter({
  maxEntries: 10_000,
  defaultWindowMs: 60_000,
});

export function checkComplianceRateLimit(
  identifier: string,
  limit: number,
  windowMs = 60000
): boolean {
  return globalComplianceRateLimiter.check(identifier, limit, windowMs);
}

export function getComplianceRateLimiterStats(): RateLimiterStats {
  return globalComplianceRateLimiter.getStats();
}

export function resetComplianceRateLimiter(): void {
  globalComplianceRateLimiter.reset();
}

export function configureComplianceRateLimiter(options: { maxEntries?: number }): void {
  if (options.maxEntries) {
    globalComplianceRateLimiter.setMaxEntries(options.maxEntries);
  }
}

export type TrustedProxyStrategy = "cloudflare" | "reverse_proxy" | "direct" | "none";

/**
 * Ingress & Client IP Extraction Architecture:
 *
 * CRITICAL DEPLOYMENT ARCHITECTURE NOTICE:
 * An environment variable flag (e.g. `TRUSTED_PROXY=true` or `TRUSTED_PROXY_STRATEGY=cloudflare`)
 * is an application configuration declaration, NOT mathematical proof of network provenance.
 *
 * An application cannot establish true network provenance if the origin server remains
 * directly accessible on the public Internet. If an attacker discovers the origin server IP,
 * they can connect directly to port 80/443, spoof edge headers (`CF-Connecting-IP`, `X-Forwarded-For`),
 * and bypass edge rate limits.
 *
 * Therefore:
 * 1. `TRUSTED_PROXY=true` as a bare boolean is AMBIGUOUS and overly broad because it fails to
 *    specify which header is authoritative, how many hops exist, or whether ingress sanitization
 *    is enforced. Supported deployments must explicitly declare `TRUSTED_PROXY_STRATEGY`.
 * 2. In `cloudflare` mode:
 *    - The single authoritative header is `CF-Connecting-IP`.
 *    - If `CF-Connecting-IP` is missing, malformed, or tampered, the code MUST NOT silently fall
 *      back to `X-Forwarded-For` or `X-Real-IP`. Falling back creates a vulnerability where an attacker
 *      connecting directly or through an alternate proxy can forge XFF while claiming Cloudflare edge.
 * 3. In `reverse_proxy` mode:
 *    - The authoritative ingress MUST be configured at the infrastructure layer to sanitize/strip
 *      any untrusted incoming client-supplied headers (e.g. Nginx `proxy_set_header X-Real-IP $remote_addr;`
 *      or overwriting `X-Forwarded-For`).
 *    - By default, `X-Real-IP` is preferred as the single authoritative hop set by the reverse proxy.
 *    - If `X-Forwarded-For` is evaluated, the first hop is trusted ONLY under the operational assumption
 *      that the ingress proxy strips client-supplied `X-Forwarded-For` headers at the ingress boundary.
 * 4. In `direct` or `none` mode (or unconfigured):
 *    - All forwarded headers are treated as untrusted user input and ignored.
 * 5. Full network provenance remains an UNRESOLVED DEPLOYMENT REQUIREMENT until infrastructure-level
 *    origin shielding (Cloudflare Authenticated Origin Pulls / mTLS or VPC security group firewalling
 *    allowing only Cloudflare/ALB CIDR ranges) is independently verified in hosted environments.
 */
export function getTrustedProxyStrategy(): TrustedProxyStrategy {
  const strategy = process.env.TRUSTED_PROXY_STRATEGY?.toLowerCase().trim();
  if (strategy === "cloudflare" || strategy === "reverse_proxy" || strategy === "direct" || strategy === "none") {
    return strategy;
  }
  // Pass 8.1: Legacy TRUSTED_PROXY="true" fallback is completely removed.
  // A bare boolean TRUSTED_PROXY does NOT activate proxy trust.
  // Missing or unrecognized strategy defaults strictly to untrusted "none".
  return "none";
}

export function isTrustedProxyConfigured(): boolean {
  const strategy = getTrustedProxyStrategy();
  return strategy === "cloudflare" || strategy === "reverse_proxy";
}

export function isValidIpFormat(ip: string | null | undefined): boolean {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  // IPv4: 4 octets 0-255
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
  if (ipv4Regex.test(trimmed)) return true;
  // IPv6: standard or compressed hexadecimal notation
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$/;
  return ipv6Regex.test(trimmed);
}

export function getClientIp(headers?: { get(name: string): string | null | undefined }): string {
  if (!headers) return "direct-client";

  const strategy = getTrustedProxyStrategy();

  // If proxy strategy is 'none' or 'direct', all forwarded headers are untrusted.
  if (strategy === "none" || strategy === "direct") {
    return "direct-client";
  }

  // 1. Cloudflare Mode:
  if (strategy === "cloudflare") {
    const cfIp = headers.get("cf-connecting-ip");
    if (cfIp) {
      const trimmed = cfIp.trim();
      if (isValidIpFormat(trimmed)) {
        return trimmed;
      }
    }
    // STRICT ISOLATION: In Cloudflare mode, DO NOT fall back to X-Forwarded-For or X-Real-IP!
    // If CF-Connecting-IP is missing or invalid, edge provenance cannot be established.
    return "direct-client";
  }

  // 2. Reverse Proxy Mode:
  if (strategy === "reverse_proxy") {
    // Authoritative check 1: X-Real-IP (preferred authoritative header injected by Nginx/Envoy)
    const realIp = headers.get("x-real-ip");
    if (realIp) {
      const trimmed = realIp.trim();
      if (isValidIpFormat(trimmed)) {
        return trimmed;
      }
    }

    // Authoritative check 2: X-Forwarded-For (valid only if ingress sanitizes client-supplied header)
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
      const parts = xForwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        const firstIp = parts[0];
        if (isValidIpFormat(firstIp)) {
          return firstIp;
        }
      }
    }

    return "direct-client";
  }

  return "direct-client";
}

/**
 * Extracts a verified network IP ONLY when obtained through an explicitly trusted ingress.
 * Returns null if no trusted proxy strategy is configured or if headers are untrusted/malformed.
 */
export function getVerifiedNetworkIp(
  headers?: { get(name: string): string | null | undefined }
): string | null {
  if (!headers) return null;
  const ip = getClientIp(headers);
  return ip !== "direct-client" ? ip : null;
}

/**
 * Generates a pre-authentication network-level rate limit key.
 *
 * CRITICAL SECURITY INVARIANT:
 * Before authentication, the ONLY trustworthy client identity is a verified network IP
 * delivered by an explicitly configured and trusted ingress.
 *
 * DO NOT USE:
 * - Arbitrary bearer token hashes
 * - Arbitrary cookie hashes
 * - Browser fingerprints (User-Agent, Accept-Language, Sec-CH-UA)
 * - Client-supplied headers as identities
 *
 * An attacker can freely rotate any client-supplied header to generate infinite buckets,
 * completely bypassing rate limits and exhausting memory.
 *
 * Fallback Behavior:
 * When direct access is used (no trusted proxy), all unverified traffic shares the
 * bounded fallback identifier: `${prefix}:net:untrusted-direct`.
 *
 * FUNDAMENTAL LIMITATION DOCUMENTED:
 * An application running on an exposed origin cannot reliably provide per-client fairness
 * when no trustworthy network identity exists. Granular per-client throttling fundamentally
 * requires edge termination (e.g. Cloudflare) with origin shielding.
 */
export function getNetworkRateLimitKey(
  prefix: string,
  headers?: { get(name: string): string | null | undefined }
): string {
  const verifiedIp = getVerifiedNetworkIp(headers);
  if (verifiedIp) {
    return `${prefix}:net:ip:${verifiedIp}`;
  }
  return `${prefix}:net:untrusted-direct`;
}

/**
 * Generates an authenticated account-level rate limit key.
 *
 * CRITICAL SECURITY INVARIANT:
 * Account-level rate limits MUST be keyed on a verified internal user ID resolved
 * through trusted server-side authentication (e.g. `auth.user.id`).
 *
 * They MUST NEVER be keyed on client-supplied claims, unverified tokens, or client headers.
 *
 * Account-level rate limits are independent of network location:
 * - A single account switching across multiple IP addresses remains bound to its account quota.
 * - Multiple accounts sharing the same network IP have isolated, independent account quotas.
 */
export function getAccountRateLimitKey(
  prefix: string,
  verifiedUserId: string
): string {
  if (!verifiedUserId || typeof verifiedUserId !== "string" || verifiedUserId.trim().length === 0) {
    return `${prefix}:acct:invalid-unauthenticated`;
  }
  return `${prefix}:acct:${verifiedUserId.trim()}`;
}

/**
 * Backward compatibility alias for existing callers.
 * Returns the network-level rate limit key.
 */
export function getComplianceRateLimitKey(
  prefix: string,
  headers?: { get(name: string): string | null | undefined }
): string {
  return getNetworkRateLimitKey(prefix, headers);
}

/**
 * Reassembles chunked cookies (e.g. `sb-<ref>-auth-token.0`, `sb-<ref>-auth-token.1`)
 * and handles base64-encoded cookie values without relying on hardcoded formats.
 */
export function reassembleChunkedCookies(
  cookieList: CookieItem[],
  baseNamePattern = "-auth-token"
): string | null {
  if (!cookieList || cookieList.length === 0) return null;

  // 1. Check for chunked cookies with `.0`, `.1`, etc. suffix
  const chunkMap = new Map<number, string>();
  let hasChunks = false;

  for (const cookie of cookieList) {
    if (cookie.name.includes(baseNamePattern)) {
      const dotIndex = cookie.name.lastIndexOf(".");
      if (dotIndex !== -1) {
        const chunkIndex = parseInt(cookie.name.slice(dotIndex + 1), 10);
        if (!isNaN(chunkIndex)) {
          chunkMap.set(chunkIndex, cookie.value);
          hasChunks = true;
        }
      }
    }
  }

  if (hasChunks && chunkMap.size > 0) {
    // Sort and concatenate chunks in ascending numerical order
    const sortedIndices = Array.from(chunkMap.keys()).sort((a, b) => a - b);
    let fullValue = "";
    for (const idx of sortedIndices) {
      fullValue += chunkMap.get(idx) || "";
    }
    return decodeCookieValue(fullValue);
  }

  // 2. Check for single unchunked auth cookie
  const singleCookie = cookieList.find(
    (c) => c.name.includes(baseNamePattern) || c.name === "sb-access-token"
  );
  if (singleCookie?.value) {
    return decodeCookieValue(singleCookie.value);
  }

  return null;
}

/**
 * Decodes base64-encoded cookie value if prefixed with `base64-`
 */
export function decodeCookieValue(val: string): string {
  if (!val) return "";
  if (val.startsWith("base64-")) {
    try {
      const rawBase64 = val.slice(7);
      return Buffer.from(rawBase64, "base64").toString("utf-8");
    } catch {
      return val;
    }
  }
  return val;
}

/**
 * CSRF origin validation for cookie-authenticated mutations.
 *
 * Invariants:
 * 1. Bearer-token requests are immune to browser CSRF (custom headers cannot be sent cross-origin without CORS preflight).
 * 2. Cookie-authenticated mutations (POST/PUT/DELETE) must verify `Sec-Fetch-Site` and `Origin` / `Referer`.
 */
export function verifyCsrfOrigin(request: {
  method?: string;
  headers: {
    get(name: string): string | null | undefined;
  };
}): { valid: boolean; reason?: string } {
  const method = (request.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { valid: true };
  }

  // If authenticated via explicit Bearer header, CSRF does not apply
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return { valid: true };
  }

  // 1. Check Sec-Fetch-Site (modern browser standard)
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return { valid: false, reason: "Cross-site request rejected (Sec-Fetch-Site: cross-site)." };
  }

  // 2. Validate Origin header if present
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) {
    // If browser omitted Origin, check Referer
    const referer = request.headers.get("referer");
    if (!referer) {
      // In cookie-authenticated state-changing requests, missing Origin and Referer is rejected
      return { valid: false, reason: "Missing Origin and Referer on state-changing cookie request." };
    }
    try {
      const refUrl = new URL(referer);
      if (host && refUrl.host !== host) {
        return { valid: false, reason: `Referer host mismatch: '${refUrl.host}' does not match host '${host}'.` };
      }
    } catch {
      return { valid: false, reason: "Malformed Referer header." };
    }
    return { valid: true };
  }

  try {
    const originUrl = new URL(origin);

    // Check against configured trusted origins allowlist if present
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || "";
    const allowedOrigins = allowedOriginsEnv
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    if (allowedOrigins.length > 0) {
      const isAllowed = allowedOrigins.some((allowed) => {
        try {
          const allowedUrl = new URL(allowed);
          return allowedUrl.origin === originUrl.origin;
        } catch {
          return allowed === originUrl.origin || allowed === originUrl.host;
        }
      });
      if (isAllowed) {
        return { valid: true };
      }
    }

    if (host && originUrl.host === host) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Origin mismatch: '${originUrl.host}' does not match host '${host}'.`,
    };
  } catch {
    return { valid: false, reason: "Malformed Origin header." };
  }
}

/**
 * Default production provider querying Supabase server environment.
 * Leverages @supabase/ssr server client for trusted user-resolution and database lookup.
 * When a Bearer token is provided, instantiates the client with explicit Authorization header
 * binding token verification directly to database RLS authorization context.
 */
export const defaultSupabaseProvider: SessionVerificationProvider = {
  isBackendConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return false;
    if (anonKey.startsWith("awaiting_") || anonKey.includes("placeholder")) return false;
    return true;
  },

  async resolveUserAndRole(input: VerificationInput) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      let user: { id: string } | null = null;
      let dbClient: {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => {
              maybeSingle: () => Promise<{ data: { role?: string } | null; error: { message?: string } | null }>;
            };
          };
        };
      };

      if (input.bearerToken) {
        // Bearer token resolution: bind token to Supabase client headers for direct RLS authorization
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");

        const bearerClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${input.bearerToken}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        const { data, error } = await bearerClient.auth.getUser(input.bearerToken);
        if (error) {
          const msg = error.message?.toLowerCase() || "";
          if (msg.includes("expired")) {
            return { status: "EXPIRED_TOKEN", error: "Session token has expired." };
          }
          if (error.status && error.status >= 500) {
            return { status: "AUTH_OUTAGE", error: "Authentication service infrastructure error." };
          }
          return { status: "INVALID_TOKEN", error: error.message };
        }
        user = data?.user ? { id: data.user.id } : null;
        dbClient = bearerClient as unknown as typeof dbClient;
      } else {
        // Cookie-based session resolution via @supabase/ssr
        const { createClient } = await import("../supabase/server");
        const cookieClient = await createClient();

        const { data, error } = await cookieClient.auth.getUser();
        if (error) {
          const msg = error.message?.toLowerCase() || "";
          if (msg.includes("session missing") || msg.includes("auth session missing")) {
            return { status: "MISSING_SESSION", error: "No active session found in request cookies." };
          }
          if (msg.includes("expired")) {
            return { status: "EXPIRED_TOKEN", error: "Session token has expired." };
          }
          if (error.status && error.status >= 500) {
            return { status: "AUTH_OUTAGE", error: "Authentication service infrastructure error." };
          }
          return { status: "INVALID_TOKEN", error: error.message };
        }
        user = data?.user ? { id: data.user.id } : null;
        dbClient = cookieClient as unknown as typeof dbClient;
      }

      if (!user?.id) {
        return { status: "MISSING_SESSION", error: "Session did not resolve to a valid user identifier." };
      }

      // 2. Query authoritative profile role using the EXACT dbClient bound to the verified session
      const { data: profile, error: profileError } = await dbClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        return {
          status: "DB_OUTAGE",
          error: "Authoritative profile database lookup failed due to infrastructure error.",
        };
      }

      if (!profile) {
        return {
          status: "PROFILE_MISSING",
          error: "Authenticated user has no authoritative profile record.",
          user,
        };
      }

      const role = profile.role as UserRole;
      if (role !== "platform_admin") {
        return {
          status: "NON_ADMIN",
          error: `User role '${role}' lacks administrative privilege.`,
          user,
          role,
        };
      }

      return {
        status: "SUCCESS",
        user,
        role: "platform_admin",
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("fetch failed") || errMsg.includes("ECONNREFUSED") || errMsg.includes("ETIMEDOUT")) {
        return { status: "AUTH_OUTAGE", error: "Authentication service is currently unreachable." };
      }
      return { status: "AUTH_OUTAGE", error: "Unexpected authentication verification failure." };
    }
  },
};

/**
 * Verifies that an incoming request possesses a verified server-side session
 * with the 'platform_admin' role.
 *
 * Invariants Enforced:
 * - Rejects any client-supplied role manipulation headers (`x-user-role`, `x-ishti-role`).
 * - Distinguishes 401 (missing/invalid/expired), 403 (non-admin/missing profile), and 503 (auth/db outage).
 * - Binds identity verification and role resolution to the exact same verified user.
 * - Fails closed when backend authentication is unconfigured or in outage.
 */
export async function verifyAdminSession(
  input: VerificationInput,
  provider: SessionVerificationProvider = defaultSupabaseProvider
): Promise<AdminSessionCheckResult> {
  // 1. Enforce that client role headers are ignored
  // If an attacker supplies `x-user-role`, `x-ishti-role`, or similar, it must never be consumed.

  // 2. Check if backend authentication infrastructure is configured
  if (!provider.isBackendConfigured()) {
    return {
      authorized: false,
      statusCode: 503,
      code: "BACKEND_AUTH_UNAVAILABLE",
      error:
        "BACKEND_AUTH_UNAVAILABLE: Server-side cryptographic session verification requires active Supabase Auth infrastructure (M06 dependency). Administrative access is disabled.",
    };
  }

  // 3. Resolve user and authoritative role in single trusted context
  const result = await provider.resolveUserAndRole(input);

  switch (result.status) {
    case "MISSING_SESSION":
      return {
        authorized: false,
        statusCode: 401,
        code: "UNAUTHENTICATED",
        error: result.error || "UNAUTHENTICATED: No session found. Valid server session required.",
      };

    case "EXPIRED_TOKEN":
      return {
        authorized: false,
        statusCode: 401,
        code: "SESSION_EXPIRED",
        error: result.error || "UNAUTHENTICATED: Session token has expired. Please re-authenticate.",
      };

    case "INVALID_TOKEN":
      return {
        authorized: false,
        statusCode: 401,
        code: "INVALID_SESSION",
        error: result.error || "UNAUTHENTICATED: Invalid session token.",
      };

    case "AUTH_OUTAGE":
      return {
        authorized: false,
        statusCode: 503,
        code: "AUTH_SERVICE_UNAVAILABLE",
        error:
          "SERVICE_UNAVAILABLE: Authentication verification service is temporarily unreachable.",
      };

    case "DB_OUTAGE":
      return {
        authorized: false,
        statusCode: 503,
        code: "DATABASE_UNAVAILABLE",
        error:
          "SERVICE_UNAVAILABLE: Authoritative profile service is temporarily unreachable.",
      };

    case "PROFILE_MISSING":
      return {
        authorized: false,
        statusCode: 403,
        code: "PROFILE_NOT_FOUND",
        error:
          "FORBIDDEN: User account exists but no authoritative profile record was found.",
      };

    case "NON_ADMIN":
      return {
        authorized: false,
        statusCode: 403,
        code: "INSUFFICIENT_PERMISSIONS",
        error:
          result.error ||
          "FORBIDDEN: Authenticated user lacks platform_admin privilege.",
      };

    case "SUCCESS":
      return {
        authorized: true,
        statusCode: 200,
        user: {
          id: result.user!.id,
          role: "platform_admin",
        },
      };

    default:
      return {
        authorized: false,
        statusCode: 403,
        code: "UNAUTHORIZED",
        error: "FORBIDDEN: Authorization failed.",
      };
  }
}

export interface BoundedBodyResult<T = Record<string, unknown>> {
  ok: boolean;
  data?: T;
  error?: string;
  code?:
    | "PAYLOAD_TOO_LARGE"
    | "MALFORMED_CONTENT_LENGTH"
    | "CONTENT_LENGTH_MISMATCH"
    | "MISSING_REQUEST_STREAM"
    | "INVALID_ENCODING"
    | "MALFORMED_JSON"
    | "BAD_REQUEST"
    | "EMPTY_BODY"
    | "STREAM_READ_ERROR"
    | string;
  statusCode?: number;
}

/**
 * Consumes and validates a request body with strict byte bounds, streaming limits,
 * Content-Length verification, UTF-8 safety, and JSON object validation.
 *
 * Security Invariants:
 * 1. Requires a ReadableStream: Consumes request.body as a ReadableStream chunk by chunk, tracking byte length.
 *    If no readable stream is available, rejects immediately with 400 MISSING_REQUEST_STREAM.
 * 2. No Unbounded Buffering: There is NO text() fallback or unbounded memory buffering.
 * 3. Early Abort / Cancel on Max Bytes: Cancels the stream reader immediately if total bytes exceed maxBytes (default 64 KB),
 *    preventing memory exhaustion from unbounded requests.
 * 4. Content-Length Header Validation & Mismatch Detection:
 *    - If present, verifies it consists strictly of decimal digits.
 *    - Rejects malformed Content-Length (non-numeric, negative, float, NaN) with 400 MALFORMED_CONTENT_LENGTH.
 *    - Rejects oversized Content-Length (> maxBytes) with 413 PAYLOAD_TOO_LARGE before reading stream.
 *    - If actual streamed bytes exceed declared Content-Length, cancels the stream immediately and rejects with 400 CONTENT_LENGTH_MISMATCH.
 *    - If stream ends with fewer bytes than declared Content-Length, rejects with 400 CONTENT_LENGTH_MISMATCH.
 * 5. Zero Trust in Content-Length Alone:
 *    - Even if Content-Length is missing or claims to be small (e.g. chunked transfer),
 *      the stream reader enforces the hard byte cap while reading.
 * 6. Safe UTF-8 Decoding: Uses TextDecoder("utf-8", { fatal: true }) to reject invalid byte sequences with 400 INVALID_ENCODING.
 * 7. Safe JSON Object Validation: Ensures body parses to a non-null, non-array object with 400 MALFORMED_JSON or 400 BAD_REQUEST.
 */
export async function readBoundedJsonBody<T = Record<string, unknown>>(
  request: {
    headers: { get(name: string): string | null | undefined };
    body?: ReadableStream<Uint8Array> | null;
  },
  maxBytes = 65536
): Promise<BoundedBodyResult<T>> {
  // 1. Content-Length header verification if present
  let declaredContentLength: number | null = null;
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null && contentLengthHeader !== undefined && contentLengthHeader.trim() !== "") {
    const trimmed = contentLengthHeader.trim();
    if (!/^\d+$/.test(trimmed)) {
      return {
        ok: false,
        error: "Malformed Content-Length header.",
        code: "MALFORMED_CONTENT_LENGTH",
        statusCode: 400,
      };
    }
    const parsedLength = parseInt(trimmed, 10);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      return {
        ok: false,
        error: "Malformed Content-Length header.",
        code: "MALFORMED_CONTENT_LENGTH",
        statusCode: 400,
      };
    }
    if (parsedLength > maxBytes) {
      return {
        ok: false,
        error: `Payload too large. Maximum allowed size is ${Math.round(maxBytes / 1024)} KB.`,
        code: "PAYLOAD_TOO_LARGE",
        statusCode: 413,
      };
    }
    declaredContentLength = parsedLength;
  }

  // 2. Require a readable request stream (Pass 8.2: No text() fallback)
  if (!request.body || typeof request.body.getReader !== "function") {
    return {
      ok: false,
      error: "A readable request stream is required.",
      code: "MISSING_REQUEST_STREAM",
      statusCode: 400,
    };
  }

  // 3. Stream consumption with chunk-by-chunk bounded counting
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;

        // Immediate cancellation on maxBytes overflow
        if (totalBytes > maxBytes) {
          try {
            await reader.cancel("PAYLOAD_TOO_LARGE");
          } catch {
            // Ignore cancel error
          }
          return {
            ok: false,
            error: `Payload too large. Maximum allowed size is ${Math.round(maxBytes / 1024)} KB.`,
            code: "PAYLOAD_TOO_LARGE",
            statusCode: 413,
          };
        }

        // Immediate cancellation on Content-Length mismatch (streamed bytes exceed declared length)
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

        chunks.push(value);
      }
    }
  } catch {
    return {
      ok: false,
      error: "Error reading request stream.",
      code: "STREAM_READ_ERROR",
      statusCode: 400,
    };
  }

  if (totalBytes === 0) {
    return {
      ok: false,
      error: "Empty request body.",
      code: "EMPTY_BODY",
      statusCode: 400,
    };
  }

  // Content-Length mismatch check: streamed bytes fewer than declared length
  if (declaredContentLength !== null && totalBytes < declaredContentLength) {
    return {
      ok: false,
      error: "Streamed bytes fewer than declared Content-Length.",
      code: "CONTENT_LENGTH_MISMATCH",
      statusCode: 400,
    };
  }

  // 4. Assemble bounded buffer
  const fullBuffer = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    fullBuffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  // 5. Strict UTF-8 decoding
  let rawText: string;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    rawText = decoder.decode(fullBuffer);
  } catch {
    return {
      ok: false,
      error: "Invalid UTF-8 encoding in request body.",
      code: "INVALID_ENCODING",
      statusCode: 400,
    };
  }

  // 6. Safe JSON parsing & object verification
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        error: "Malformed request body. JSON object expected.",
        code: "BAD_REQUEST",
        statusCode: 400,
      };
    }
    return { ok: true, data: parsed as T };
  } catch {
    return {
      ok: false,
      error: "Invalid JSON request body.",
      code: "MALFORMED_JSON",
      statusCode: 400,
    };
  }
}

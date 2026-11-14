import "server-only";

/**
 * ISHTI Distributed Rate Limiting & Abuse Prevention Service
 *
 * Security Architecture:
 * - Server-only execution: strictly prevented from entering client/mobile bundles.
 * - Distributed storage via PostgreSQL atomic RPC function `check_rate_limit()`.
 * - 64-bit advisory transaction locking prevents concurrent limit overruns while substantially
 *   reducing hash collision probabilities compared to 32-bit hashtext.
 * - Server-controlled allowlist of buckets and quotas (clients cannot dictate limits).
 * - HMAC-SHA-256 for privacy-preserving identifier hashing with validated 32-byte server secret.
 * - Deployment-aware trusted proxy verification policy (Cloudflare edge termination vs reverse proxy vs direct origin).
 * - Strict Node.js net-backed IP address validation.
 * - Safe fail-closed behavior for sensitive endpoints when provenance cannot be established.
 * - Internal service_role execution: anonymous and authenticated clients cannot call RPC directly.
 */

import crypto from "node:crypto";
import net from "node:net";
import { createAdminClient } from "../supabase/admin";

export const RATE_LIMIT_CONFIGS = {
  early_access: {
    bucket: "early_access",
    maxRequests: 5,
    windowSeconds: 600, // 5 requests per 10 minutes
    failClosed: true,
  },
  auth_otp: {
    bucket: "auth_otp",
    maxRequests: 3,
    windowSeconds: 300, // 3 requests per 5 minutes
    failClosed: true,
  },
  kundli_decrypt: {
    bucket: "kundli_decrypt",
    maxRequests: 10,
    windowSeconds: 60, // 10 requests per minute
    failClosed: true,
  },
  booking_request: {
    bucket: "booking_request",
    maxRequests: 5,
    windowSeconds: 300, // 5 requests per 5 minutes
    failClosed: true,
  },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMIT_CONFIGS;

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetSeconds?: number;
  reason?: string;
}

export type TrustedProxyStrategy = "cloudflare" | "reverse_proxy" | "direct" | "none";

export interface ExtractClientIpOptions {
  strategy?: TrustedProxyStrategy;
  trustedHops?: number;
  edgeSecret?: string;
  originProtected?: boolean;
  trustRealIp?: boolean;
}

/**
 * Validates whether a given string is a syntactically valid IPv4 or IPv6 address.
 * Uses official Node.js net.isIP standard library implementation (C++ backed).
 */
export function isValidIp(ip: string | null | undefined): boolean {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  return net.isIP(trimmed) !== 0;
}

/**
 * Determines the active trusted proxy strategy based on deployment environment.
 * Hierarchy:
 * 1. Explicit TRUSTED_PROXY_STRATEGY env ('cloudflare' | 'reverse_proxy' | 'direct' | 'none')
 * 2. In production: defaults to 'cloudflare' (standard production edge topology)
 * 3. In non-production: defaults to 'none' (direct origin / local testing)
 */
export function getTrustedProxyStrategy(): TrustedProxyStrategy {
  const envStrategy = process.env.TRUSTED_PROXY_STRATEGY?.toLowerCase().trim();
  if (
    envStrategy === "cloudflare" ||
    envStrategy === "reverse_proxy" ||
    envStrategy === "direct" ||
    envStrategy === "none"
  ) {
    return envStrategy;
  }
  if (process.env.NODE_ENV === "production") {
    return "cloudflare";
  }
  return "none";
}

/**
 * Extracts client IP following a deployment-aware trusted proxy policy.
 *
 * Infrastructure Topology & Header Overwrites:
 * - 'cloudflare': Edge proxy terminates requests. Cloudflare strips client-supplied cf-connecting-ip
 *   and injects the authentic client IP.
 *   CRITICAL SECURITY REQUIREMENT:
 *   cf-ray alone is NOT proof of Cloudflare origin because direct-origin attackers can supply any cf-ray.
 *   In production, Cloudflare headers are only trusted if:
 *   a) CLOUDFLARE_EDGE_SECRET is configured and matches incoming x-ishti-edge-secret (or x-origin-secret), OR
 *   b) CLOUDFLARE_ORIGIN_PROTECTED is explicitly 'true' (infrastructure firewall/tunnel/mTLS blocks direct ingress).
 * - 'reverse_proxy': Internal reverse proxy (NGINX / AWS ALB / Kubernetes Ingress).
 *   Evaluates x-real-ip (if TRUST_X_REAL_IP=true) or counts hops from the right in x-forwarded-for
 *   using TRUSTED_PROXY_HOPS (default 1). If chain has fewer hops or hop is malformed, returns null.
 * - 'direct' / 'none': Direct origin connections (local dev, test runner, private internal networks).
 *   ALL forwarded headers (cf-connecting-ip, x-real-ip, x-forwarded-for) are considered UNTRUSTED
 *   and ignored to prevent origin header spoofing attacks.
 *
 * In production:
 * - If trusted proxy provenance cannot be established, returns null (does NOT silently group under 127.0.0.1).
 */
export function extractClientIp(
  headers: { get(name: string): string | null },
  forcedStrategyOrOptions?: TrustedProxyStrategy | ExtractClientIpOptions,
  explicitOptions?: ExtractClientIpOptions
): string | null {
  let strategy: TrustedProxyStrategy;
  let options: ExtractClientIpOptions | undefined;

  if (typeof forcedStrategyOrOptions === "string") {
    strategy = forcedStrategyOrOptions;
    options = explicitOptions;
  } else if (typeof forcedStrategyOrOptions === "object" && forcedStrategyOrOptions !== null) {
    options = forcedStrategyOrOptions;
    strategy = options.strategy || getTrustedProxyStrategy();
  } else {
    options = explicitOptions;
    strategy = getTrustedProxyStrategy();
  }

  if (strategy === "cloudflare") {
    const cfIp = headers.get("cf-connecting-ip");
    const cfRay = headers.get("cf-ray");

    // Require valid cf-connecting-ip
    if (!cfIp || !isValidIp(cfIp)) {
      return null;
    }

    // In production, we MUST verify origin protection.
    // cf-ray alone is not proof of Cloudflare edge origin because direct-origin attackers can supply cf-ray.
    if (process.env.NODE_ENV === "production") {
      const edgeSecret = options?.edgeSecret ?? process.env.CLOUDFLARE_EDGE_SECRET;
      const isOriginProtected =
        options?.originProtected !== undefined
          ? options.originProtected
          : process.env.CLOUDFLARE_ORIGIN_PROTECTED === "true";

      if (edgeSecret) {
        const incomingSecret =
          headers.get("x-ishti-edge-secret") ||
          headers.get("x-origin-secret");
        if (!incomingSecret || incomingSecret !== edgeSecret) {
          return null;
        }
      } else if (!isOriginProtected) {
        // Neither edge secret nor infrastructure origin protection is established.
        // Direct origin requests cannot be safely distinguished from edge requests.
        return null;
      }

      if (!cfRay) {
        return null;
      }
    }

    return cfIp.trim();
  }

  if (strategy === "reverse_proxy") {
    // 1. Check x-real-ip set by trusted reverse proxy if explicitly trusted
    const trustRealIp =
      options?.trustRealIp !== undefined
        ? options.trustRealIp
        : process.env.TRUST_X_REAL_IP === "true";

    if (trustRealIp) {
      const realIp = headers.get("x-real-ip");
      if (realIp && isValidIp(realIp)) {
        return realIp.trim();
      }
    }

    // 2. Parse x-forwarded-for from right to left based on trusted proxy hops
    const xForwardedFor = headers.get("x-forwarded-for");
    if (!xForwardedFor) {
      return null;
    }

    const parts = xForwardedFor
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const trustedHops =
      options?.trustedHops !== undefined
        ? options.trustedHops
        : parseInt(process.env.TRUSTED_PROXY_HOPS || "1", 10) || 1;

    if (trustedHops < 1 || parts.length < trustedHops) {
      // Chain has fewer hops than trusted proxies -> client provenance cannot be established
      return null;
    }

    // Right-to-left index: the client IP as observed by the outermost trusted proxy
    const clientHopIndex = parts.length - trustedHops;
    const clientHop = parts[clientHopIndex];

    if (!clientHop || !isValidIp(clientHop)) {
      return null;
    }

    return clientHop;
  }

  // Strategy 'none' or 'direct': Direct origin access
  // Do NOT trust any forwarded headers sent by client.
  if (process.env.NODE_ENV !== "production") {
    return "127.0.0.1"; // Safe developer loopback for local offline development
  }

  // In production with direct strategy, forwarded headers cannot establish provenance
  // Never silently substitute 127.0.0.1 in production!
  return null;
}

/**
 * Retrieves and validates the HMAC secret key for privacy-preserving IP hashing.
 *
 * Encoding Specifications:
 * - Hex-encoded: 64 hexadecimal characters representing 32 bytes (256 bits).
 * - Raw UTF-8: Minimum 32 bytes (Buffer.byteLength(secret, 'utf8') >= 32).
 *
 * Security Requirements:
 * - Minimum byte length: 32 bytes. Secrets under 32 bytes are strictly rejected.
 * - Production: Missing or invalid secrets throw fast. Development fallback secrets
 *   are NEVER permitted in production.
 */
export function getRateLimitHmacSecret(): string {
  const customSecret = process.env.RATE_LIMIT_HMAC_SECRET?.trim();

  if (customSecret) {
    const isHex = /^[0-9a-fA-F]{64}$/.test(customSecret);
    const byteLength = isHex ? 32 : Buffer.byteLength(customSecret, "utf8");

    if (byteLength < 32) {
      throw new Error(
        `CRITICAL SECURITY CONFIGURATION ERROR: RATE_LIMIT_HMAC_SECRET must be at least 32 bytes (got ${byteLength} bytes).`
      );
    }

    return customSecret;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    const serviceKeyBytes = Buffer.byteLength(serviceKey, "utf8");
    if (serviceKeyBytes >= 32) {
      return crypto.createHmac("sha256", "ishti-rate-limit-salt-v1").update(serviceKey).digest("hex");
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: A valid 32-byte RATE_LIMIT_HMAC_SECRET (or 32+ byte SUPABASE_SERVICE_ROLE_KEY) is required in production. Server startup halted."
    );
  }

  // Development & test fallback only (never reachable in production)
  return "ishti-development-rate-limit-hmac-secret-32b-deterministic";
}

/**
 * Computes an HMAC-SHA-256 hash of the client identifier (e.g. IP).
 * Never stores or transmits raw client IP addresses.
 */
export function hashIdentifier(identifier: string, secret?: string): string {
  if (!identifier || typeof identifier !== "string") {
    throw new Error("Cannot hash an invalid or empty identifier.");
  }
  const hmacKey = secret || getRateLimitHmacSecret();
  return crypto.createHmac("sha256", hmacKey).update(identifier.trim()).digest("hex");
}

/**
 * Evaluates rate limit against the distributed PostgreSQL atomic sliding window.
 * Uses 64-bit advisory locks for concurrency safety and honors configurable fail-closed settings.
 */
export async function checkRateLimit(
  headers: { get(name: string): string | null },
  bucketKey: RateLimitBucket,
  identifierOverride?: string
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[bucketKey];
  if (!config) {
    throw new Error(`Unknown rate limit bucket: ${bucketKey}`);
  }

  let rawIdentifier: string | null = identifierOverride || null;

  if (!rawIdentifier) {
    const extracted = extractClientIp(headers);
    if (!extracted) {
      // In production, NEVER silently substitute 127.0.0.1 for an unknown/untrusted client.
      // Fail closed immediately if provenance cannot be established.
      if (process.env.NODE_ENV === "production" || config.failClosed) {
        return {
          allowed: false,
          reason: "UNTRUSTED_PROXY_PROVENANCE",
          resetSeconds: 60,
        };
      }
      rawIdentifier = "127.0.0.1";
    } else {
      rawIdentifier = extracted;
    }
  }

  if (!rawIdentifier) {
    return {
      allowed: false,
      reason: "UNTRUSTED_PROXY_PROVENANCE",
      resetSeconds: 60,
    };
  }

  const identifierHash = hashIdentifier(rawIdentifier);

  try {
    const supabase = createAdminClient();

    // Call atomic PostgreSQL rate limit function via service_role
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: config.bucket,
      p_identifier_hash: identifierHash,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });

    if (error) {
      console.error(`[RateLimiter] Database rate check error (${error.code}): ${error.message}`);
      if (config.failClosed) {
        return {
          allowed: false,
          reason: "RATE_LIMIT_SERVICE_UNAVAILABLE",
          resetSeconds: 60,
        };
      }
      return { allowed: true };
    }

    const isAllowed = Boolean(data);
    return {
      allowed: isAllowed,
      resetSeconds: isAllowed ? undefined : config.windowSeconds,
      reason: isAllowed ? undefined : "RATE_LIMIT_EXCEEDED",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[RateLimiter] Unexpected error during rate check: ${message}`);
    if (config.failClosed) {
      return {
        allowed: false,
        reason: "RATE_LIMIT_SERVICE_UNAVAILABLE",
        resetSeconds: 60,
      };
    }
    return { allowed: true };
  }
}

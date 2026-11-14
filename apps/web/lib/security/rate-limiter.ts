import "server-only";

/**
 * ISHTI Distributed Rate Limiting & Abuse Prevention Service
 *
 * Security Architecture:
 * - Server-only execution: strictly prevented from entering client/mobile bundles.
 * - Distributed storage via PostgreSQL atomic RPC function `check_rate_limit()`.
 * - Advisory transaction locking prevents race conditions and concurrent limit overruns.
 * - Server-controlled allowlist of buckets and quotas (clients cannot choose arbitrary limits).
 * - HMAC-SHA-256 for privacy-preserving identifier hashing with server secret.
 * - Trusted proxy policy: validates IPv4/IPv6 format, rejects malformed/injected values.
 * - Configurable fail-closed behavior for sensitive submission endpoints (early access, auth).
 * - Internal service_role execution: anonymous and authenticated clients cannot call RPC directly.
 */

import crypto from "node:crypto";
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

/**
 * Validates whether a given string is a syntactically valid IPv4 or IPv6 address.
 * Prevents header injection and malformed proxy values.
 */
export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  if (trimmed.length < 3 || trimmed.length > 45) return false;

  // Strict IPv4 validation
  const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(trimmed)) return true;

  // Strict IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:)+:([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(trimmed);
}

/**
 * Extracts client IP following a trusted proxy policy.
 * Evaluates standard reverse proxy headers in priority order, rejecting malformed IPs.
 */
export function extractClientIp(headers: { get(name: string): string | null }): string {
  // 1. Cloudflare connecting IP (Edge termination)
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp)) {
    return cfIp.trim();
  }

  // 2. Real-IP header from trusted reverse proxy
  const realIp = headers.get("x-real-ip");
  if (realIp && isValidIp(realIp)) {
    return realIp.trim();
  }

  // 3. X-Forwarded-For chain: extract the originating client IP (first valid IP)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const parts = xForwardedFor.split(",").map((p) => p.trim());
    for (const part of parts) {
      if (isValidIp(part)) {
        return part;
      }
    }
  }

  // 4. Default safe fallback for local/untrusted connections
  return "127.0.0.1";
}

/**
 * Retrieves the HMAC secret key for privacy-preserving IP hashing.
 * In production, strictly requires RATE_LIMIT_HMAC_SECRET or SUPABASE_SERVICE_ROLE_KEY.
 */
export function getRateLimitHmacSecret(): string {
  const customSecret = process.env.RATE_LIMIT_HMAC_SECRET;
  if (customSecret && customSecret.length >= 16) {
    return customSecret;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return crypto.createHmac("sha256", "ishti-rate-limit-salt-v1").update(serviceKey).digest("hex");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: RATE_LIMIT_HMAC_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured in production."
    );
  }

  return "ishti-development-rate-limit-hmac-secret-32b";
}

/**
 * Computes an HMAC-SHA-256 hash of the client identifier (e.g. IP).
 * Never stores or transmits raw client IP addresses.
 */
export function hashIdentifier(identifier: string, secret?: string): string {
  const hmacKey = secret || getRateLimitHmacSecret();
  return crypto.createHmac("sha256", hmacKey).update(identifier.trim()).digest("hex");
}

/**
 * Evaluates rate limit against the distributed PostgreSQL atomic sliding window.
 * Uses advisory locks for concurrency safety and honors configurable fail-closed settings.
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

  const rawIdentifier = identifierOverride || extractClientIp(headers);
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

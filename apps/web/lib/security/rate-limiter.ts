/**
 * ISHTI Distributed Rate Limiting & Abuse Prevention Service
 *
 * Security Architecture:
 * - Distributed storage via PostgreSQL atomic RPC function `check_rate_limit()`.
 * - Operates reliably across serverless instances and geographically distributed workers.
 * - Dynamic cryptographic salt derivation (no hardcoded production secrets).
 * - Sanitized proxy IP resolution supporting standard X-Forwarded-For headers.
 * - Graceful failure fallback: rate limiter errors do not take down critical availability.
 */

import crypto from "node:crypto";
import { createAdminClient } from "../supabase/admin";

export interface RateLimitConfig {
  bucket: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetSeconds?: number;
}

/**
 * Derives a dynamic, server-side salt for privacy-preserving IP hashing.
 * Avoids storing raw IP addresses while preventing rainbow-table precomputations.
 */
function getPrivacySalt(): string {
  if (process.env.RATE_LIMIT_SALT) {
    return process.env.RATE_LIMIT_SALT;
  }
  // Derive dynamic salt from service role key if available
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (secret) {
    return crypto.createHmac("sha256", "ishti-salt-key").update(secret).digest("hex").slice(0, 32);
  }
  // Fallback for isolated development/test
  return "ishti-dev-salt-ephemeral";
}

/**
 * Extracts the true client IP from request headers, accounting for proxies.
 */
export function extractClientIp(headers: { get(name: string): string | null }): string {
  // Check standard forwarded headers
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    // Pick the first non-empty IP
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp?.trim()) {
    return xRealIp.trim();
  }

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) {
    return cfConnectingIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Hashes client IP with dynamic salt using SHA-256 for privacy preservation.
 */
export function hashClientIp(ip: string): string {
  const salt = getPrivacySalt();
  return crypto.createHash("sha256").update(`${salt}:${ip.trim()}`).digest("hex");
}

/**
 * Evaluates whether an incoming request exceeds the distributed rate limit.
 * Falls back safely if the database is unreachable or table is unmigrated.
 */
export async function checkDistributedRateLimit(
  headers: { get(name: string): string | null },
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const clientIp = extractClientIp(headers);
  const identifierHash = hashClientIp(clientIp);

  try {
    const supabase = createAdminClient();

    // Call atomic PostgreSQL rate limit function
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: config.bucket,
      p_identifier_hash: identifierHash,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });

    if (error) {
      // If table/function is not yet deployed, log warning and allow with caution
      console.warn(`[RateLimiter] Database rate check failed (${error.code}): ${error.message}. Failing open.`);
      return { allowed: true };
    }

    return { allowed: Boolean(data) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[RateLimiter] Unexpected rate check error: ${message}. Failing open for availability.`);
    return { allowed: true };
  }
}

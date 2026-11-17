import "server-only";

import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import {
  verifyAdminSession,
  type AdminSessionCheckResult,
  type SessionVerificationProvider,
  defaultSupabaseProvider,
} from "./compliance-session-verifier";

export type { AdminSessionCheckResult, SessionVerificationProvider };

/**
 * Extracts the session token from an incoming Next.js request or server cookie store.
 * Checks:
 * 1. Authorization: Bearer <token>
 * 2. Supabase auth cookies: `sb-access-token`, `sb-<ref>-auth-token`
 */
async function extractSessionToken(request?: Request | NextRequest): Promise<string | null> {
  // 1. Check Authorization header if request is provided
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token) return token;
    }
  }

  // 2. Check cookies from NextRequest
  if (request && "cookies" in request && typeof request.cookies?.get === "function") {
    const nextReq = request as NextRequest;
    const cookie =
      nextReq.cookies.get("sb-access-token") ||
      nextReq.cookies.getAll().find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
    if (cookie?.value) {
      // In Supabase SSR, cookie value may be a JSON array string `["<access_token>", "<refresh_token>"]`
      try {
        const parsed = JSON.parse(cookie.value);
        if (Array.isArray(parsed) && typeof parsed[0] === "string") {
          return parsed[0];
        }
      } catch {
        return cookie.value;
      }
      return cookie.value;
    }
  }

  // 3. Check server cookies via next/headers
  try {
    const cookieStore = await cookies();
    const cookie =
      cookieStore.get("sb-access-token") ||
      cookieStore.getAll().find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
    if (cookie?.value) {
      try {
        const parsed = JSON.parse(cookie.value);
        if (Array.isArray(parsed) && typeof parsed[0] === "string") {
          return parsed[0];
        }
      } catch {
        return cookie.value;
      }
      return cookie.value;
    }
  } catch {
    // cookies() unavailable outside Next.js request lifecycle
  }

  return null;
}

/**
 * Server-only authorization function: retrieves and verifies the authenticated
 * session using the trusted server-side authentication mechanism.
 *
 * Invariants:
 * - Does NOT accept a client-provided UserProfile, role, or React state.
 * - Resolves the session strictly from verified cookies / Bearer tokens.
 * - Resolves the role strictly from authoritative database records.
 * - When backend auth is unconfigured/offline, disables administrative access (503).
 */
export async function verifyServerAdminSession(
  request?: Request | NextRequest,
  customProvider?: SessionVerificationProvider
): Promise<AdminSessionCheckResult> {
  const token = await extractSessionToken(request);
  const provider = customProvider || defaultSupabaseProvider;
  return verifyAdminSession(token, provider, request?.headers);
}

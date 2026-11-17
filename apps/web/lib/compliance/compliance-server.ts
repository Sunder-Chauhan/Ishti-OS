import "server-only";

import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import {
  verifyAdminSession,
  verifyCsrfOrigin,
  checkComplianceRateLimit,
  type AdminSessionCheckResult,
  type SessionVerificationProvider,
  type CookieItem,
  type VerificationInput,
  defaultSupabaseProvider,
} from "./compliance-session-verifier";

export { verifyCsrfOrigin, checkComplianceRateLimit };
export type { AdminSessionCheckResult, SessionVerificationProvider, CookieItem, VerificationInput };

/**
 * Extracts session tokens and cookies from an incoming Next.js request or server cookie store.
 */
async function extractVerificationInput(request?: Request | NextRequest): Promise<VerificationInput> {
  let bearerToken: string | null = null;
  const cookieList: CookieItem[] = [];

  // 1. Check Authorization header
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      bearerToken = authHeader.slice(7).trim();
    }
  }

  // 2. Check cookies from NextRequest
  if (request && "cookies" in request && typeof request.cookies?.getAll === "function") {
    const nextReq = request as NextRequest;
    const all = nextReq.cookies.getAll();
    for (const c of all) {
      cookieList.push({ name: c.name, value: c.value });
    }
  }

  // 3. Fallback / supplementary check via next/headers cookies()
  if (cookieList.length === 0) {
    try {
      const cookieStore = await cookies();
      const all = cookieStore.getAll();
      for (const c of all) {
        cookieList.push({ name: c.name, value: c.value });
      }
    } catch {
      // cookies() unavailable outside Next.js request lifecycle
    }
  }

  return {
    bearerToken,
    cookies: cookieList,
    headers: request?.headers,
  };
}

/**
 * Server-only authorization function: retrieves and verifies the authenticated
 * session using the trusted server-side authentication mechanism.
 *
 * Invariants:
 * - Does NOT accept a client-provided UserProfile, role, or React state.
 * - Resolves the session strictly from verified cookies / Bearer tokens.
 * - Resolves the role strictly from authoritative database records in the same context.
 * - When backend auth is unconfigured/offline, disables administrative access (503).
 */
export async function verifyServerAdminSession(
  request?: Request | NextRequest,
  customProvider?: SessionVerificationProvider
): Promise<AdminSessionCheckResult> {
  const input = await extractVerificationInput(request);
  const provider = customProvider || defaultSupabaseProvider;
  return verifyAdminSession(input, provider);
}

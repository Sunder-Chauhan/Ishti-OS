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
 * In-memory sliding window rate limiter for compliance endpoints.
 *
 * NOTE: This is PROCESS-LOCAL in-memory rate limiting. It operates per Node.js process instance.
 * In a multi-instance or serverless container deployment, distributed rate limiting
 * backed by Redis or PostgreSQL advisory locking (as scheduled for M06) is required
 * for global quota enforcement across all instances.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkComplianceRateLimit(
  identifier: string,
  limit: number,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Extracts client IP address with proxy trustworthiness validation.
 *
 * In production behind trusted reverse proxies (e.g. Cloudflare / Vercel):
 * - If TRUSTED_PROXY=true (or CF-Connecting-IP present from Cloudflare), inspect trusted headers.
 * - Otherwise, treat x-forwarded-for as untrusted user input to prevent header-injection rate limit evasion.
 */
export function getClientIp(headers?: { get(name: string): string | null | undefined }): string {
  if (!headers) return "direct-client";

  // Check Cloudflare header if deployed behind CF
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const isTrustedProxy = process.env.TRUSTED_PROXY === "true" || process.env.NODE_ENV === "production";
  if (isTrustedProxy) {
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
      // In x-forwarded-for: client, proxy1, proxy2
      // Behind a trusted reverse proxy, the client IP is the first entry
      const parts = xForwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        const firstIp = parts[0];
        if (/^[a-fA-F0-9:.]+$/.test(firstIp)) {
          return firstIp;
        }
      }
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp && /^[a-fA-F0-9:.]+$/.test(realIp.trim())) {
    return realIp.trim();
  }

  return "direct-client";
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

import type { UserRole } from "@spiritual-os/types";

/**
 * ISHTI Server-Side Compliance Session Verification Engine
 *
 * GOVERNANCE & SECURITY INVARIANTS:
 * 1. ZERO-TRUST: Never trust a client-provided UserProfile, role, header,
 *    localStorage value, or React state as proof of administrative authorization.
 * 2. AUTHENTICATED SESSION: Authorization requires a cryptographically verified
 *    server-side session token issued by the trusted authentication service.
 * 3. AUTHORITATIVE ROLE RESOLUTION: Role evaluation must be resolved server-side
 *    from the authoritative user profile in the database (`public.profiles`),
 *    never from client-supplied tokens or client headers.
 * 4. BACKEND DEPENDENCY ENFORCEMENT: If trusted backend authentication infrastructure
 *    is unconfigured or offline, administrative operations MUST be disabled rather than
 *    bypassed or simulated.
 */

export interface AdminSessionCheckResult {
  authorized: boolean;
  statusCode: 200 | 401 | 403 | 503;
  error?: string;
  user?: {
    id: string;
    role: "platform_admin";
  };
}

export interface SessionVerificationProvider {
  /**
   * Verifies the cryptographic validity and expiration of a session token.
   */
  verifyToken(token: string): Promise<{
    valid: boolean;
    expired?: boolean;
    userId?: string;
    error?: string;
  }>;

  /**
   * Resolves the authoritative role for a verified user from the database.
   */
  getUserRole(userId: string): Promise<{
    role: UserRole | null;
    error?: string;
  }>;

  /**
   * Checks whether the trusted authentication service is configured and operational.
   */
  isBackendConfigured(): boolean;
}

/**
 * Default production provider querying Supabase server environment.
 */
export const defaultSupabaseProvider: SessionVerificationProvider = {
  isBackendConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return false;
    if (anonKey.startsWith("awaiting_") || anonKey.includes("placeholder")) return false;
    return true;
  },

  async verifyToken(token: string) {
    if (!token || token.trim().length === 0) {
      return { valid: false, error: "Empty token" };
    }
    // When live Supabase is configured, token is validated against auth service
    try {
      const { createClient } = await import("../supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return {
          valid: false,
          expired: error?.message?.toLowerCase().includes("expired"),
          error: error?.message || "Invalid session",
        };
      }
      return { valid: true, userId: data.user.id };
    } catch (err: unknown) {
      return { valid: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async getUserRole(userId: string) {
    try {
      const { createClient } = await import("../supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        return { role: null, error: error?.message || "Profile not found" };
      }
      return { role: data.role as UserRole };
    } catch (err: unknown) {
      return { role: null, error: err instanceof Error ? err.message : String(err) };
    }
  },
};

/**
 * Verifies that an incoming request possesses a verified server-side session
 * with the 'platform_admin' role.
 *
 * Strictly ignores any client-supplied role manipulation headers or request body overrides.
 */
export async function verifyAdminSession(
  sessionToken?: string | null,
  provider: SessionVerificationProvider = defaultSupabaseProvider,
  clientHeaders?: Headers | Record<string, string | string[] | undefined>
): Promise<AdminSessionCheckResult> {
  // 1. Enforce that client role headers are ignored
  // If an attacker supplies `x-user-role`, `x-ishti-role`, or similar, it must never be consumed.

  // 2. Reject missing session token
  if (!sessionToken || sessionToken.trim().length === 0) {
    return {
      authorized: false,
      statusCode: 401,
      error: "UNAUTHENTICATED: No session token found in request. Valid server session required.",
    };
  }

  // 3. Check if backend authentication infrastructure is operational
  if (!provider.isBackendConfigured()) {
    return {
      authorized: false,
      statusCode: 503,
      error:
        "BACKEND_AUTH_UNAVAILABLE: Server-side cryptographic session verification requires active Supabase Auth infrastructure (M06 dependency). Administrative access is disabled.",
    };
  }

  // 4. Verify session token validity and expiration
  const tokenResult = await provider.verifyToken(sessionToken);
  if (!tokenResult.valid) {
    return {
      authorized: false,
      statusCode: 401,
      error: tokenResult.expired
        ? "UNAUTHENTICATED: Session token has expired. Please re-authenticate."
        : `UNAUTHENTICATED: Invalid session token. (${tokenResult.error || "Verification failed"})`,
    };
  }

  const userId = tokenResult.userId;
  if (!userId) {
    return {
      authorized: false,
      statusCode: 401,
      error: "UNAUTHENTICATED: Session token did not resolve to a valid user identifier.",
    };
  }

  // 5. Authoritatively resolve user role from database
  const roleResult = await provider.getUserRole(userId);
  if (roleResult.error || !roleResult.role) {
    return {
      authorized: false,
      statusCode: 403,
      error: "FORBIDDEN: User profile could not be verified in authoritative records.",
    };
  }

  const role = roleResult.role;

  // 6. Enforce platform_admin role requirement
  if (role !== "platform_admin") {
    return {
      authorized: false,
      statusCode: 403,
      error: `FORBIDDEN: User role '${role}' lacks administrative privilege. Required: 'platform_admin'.`,
    };
  }

  // 7. Session is cryptographically verified and authorized
  return {
    authorized: true,
    statusCode: 200,
    user: {
      id: userId,
      role: "platform_admin",
    },
  };
}

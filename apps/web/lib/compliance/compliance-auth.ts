import type { UserProfile } from "@spiritual-os/types";

/**
 * Server-Side Compliance & Administrative Authorization Guard
 *
 * Security Invariants:
 * - Enforces zero-trust role verification: requires verified 'platform_admin' role.
 * - Ordinary authenticated devotees ('devotee'), content scholars, and expert pandits are strictly denied.
 * - Anonymous and unauthenticated callers are strictly denied.
 * - Client-side state overrides are completely prohibited.
 */

export interface AuthorizationCheckResult {
  authorized: boolean;
  statusCode: 200 | 401 | 403;
  reason?: string;
}

export function verifyServerAdminAuthorization(
  user: UserProfile | null
): AuthorizationCheckResult {
  if (!user || !user.id) {
    return {
      authorized: false,
      statusCode: 401,
      reason: "UNAUTHENTICATED: Valid session required for administrative operations.",
    };
  }

  if (user.role !== "platform_admin") {
    return {
      authorized: false,
      statusCode: 403,
      reason: `FORBIDDEN: User role '${user.role}' lacks administrative privilege. Required: 'platform_admin'.`,
    };
  }

  return {
    authorized: true,
    statusCode: 200,
  };
}

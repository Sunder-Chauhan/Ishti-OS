/**
 * ISHTI Trusted Role Assignment & RBAC Governance
 *
 * Security Architecture:
 * - Direct profile updates to `role` and `is_verified` are blocked by database triggers.
 * - Role elevations MUST be performed via the server-side `assign_user_role` function.
 * - Every role modification records an immutable audit entry in `public.role_assignment_audit`.
 * - Ordinary authenticated devotees cannot elevate themselves or others.
 */

import { createAdminClient } from "../supabase/admin";
import { createClient as createServerClient } from "../supabase/server";
import type { UserRole } from "@spiritual-os/types";

export interface AssignRoleRequest {
  targetUserId: string;
  newRole: UserRole;
  reason: string;
}

export interface AssignRoleResult {
  success: boolean;
  message: string;
}

/**
 * Assigns a role to a user via server-side administrative authority.
 * Can be executed by:
 * 1. An authenticated platform administrator (via session cookies).
 * 2. An automated internal system process (via Service Role client).
 */
export async function assignUserRoleServer(
  request: AssignRoleRequest,
  useAdminClient: boolean = false
): Promise<AssignRoleResult> {
  const { targetUserId, newRole, reason } = request;

  if (!targetUserId || !newRole || !reason) {
    return {
      success: false,
      message: "Target user ID, new role, and justification reason are all required.",
    };
  }

  if (reason.trim().length < 5) {
    return {
      success: false,
      message: "Role assignment requires a detailed justification (minimum 5 characters).",
    };
  }

  try {
    // Choose appropriate client based on execution context
    const supabase = useAdminClient ? createAdminClient() : await createServerClient();

    const { error } = await supabase.rpc("assign_user_role", {
      p_user_id: targetUserId,
      p_new_role: newRole,
      p_reason: reason.trim(),
    });

    if (error) {
      return {
        success: false,
        message: error.message || "Failed to assign role.",
      };
    }

    return {
      success: true,
      message: `Role '${newRole}' successfully assigned to user ${targetUserId}.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message,
    };
  }
}

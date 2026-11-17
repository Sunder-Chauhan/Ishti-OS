/**
 * ISHTI Presentation Layer Separation
 * Enforces strict boundaries between:
 * 1. Public UI: Human-readable, calm, accessible, private
 * 2. Internal Administration: Diagnostics, service health, audit tools
 * 3. Developer Environment: Sandboxes, mocks, debug logs, technical traces
 */

import type { UserProfile } from "@spiritual-os/types";

/**
 * Returns true only when running in a genuine local development runtime.
 * Never relies on client-only checks or localhost hostnames alone.
 */
export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Returns true if the user possesses an authorized administrative role.
 */
export function isAdminUser(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return user.role === "platform_admin";
}

/**
 * Returns true if technical diagnostics may be displayed (authorized admin or local dev).
 */
export function canViewTechnicalDiagnostics(user?: UserProfile | null): boolean {
  if (isDevelopmentEnvironment()) return true;
  return isAdminUser(user);
}

/**
 * Sanitizes internal database UUIDs or system identifiers for public presentation.
 * Returns a devotee-friendly membership reference rather than a raw database primary key.
 */
export function formatDevoteePublicReference(userId: string): string {
  if (!userId) return "";
  // Show clean 8-character sanctuary hash prefix (e.g. ISHTI-7C6E5DC1)
  const clean = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const shortCode = clean.slice(0, 8);
  return `ISHTI-${shortCode}`;
}

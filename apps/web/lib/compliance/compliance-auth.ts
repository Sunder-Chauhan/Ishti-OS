/**
 * Re-exports compliance session verification engine.
 * Notice: Authorization requires a verified server-side session token.
 * Client-provided UserProfiles or roles are NEVER trusted.
 */
export {
  verifyAdminSession,
  type AdminSessionCheckResult,
  type SessionVerificationProvider,
  defaultSupabaseProvider,
} from "./compliance-session-verifier";

/**
 * Re-exports compliance session verification engine.
 * Notice: Authorization requires a verified server-side session token.
 * Client-provided UserProfiles or roles are NEVER trusted.
 */
export {
  verifyAdminSession,
  reassembleChunkedCookies,
  decodeCookieValue,
  type AdminSessionCheckResult,
  type SessionVerificationProvider,
  type VerificationInput,
  type AuthResolutionStatus,
  type CookieItem,
  defaultSupabaseProvider,
} from "./compliance-session-verifier";

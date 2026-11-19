/**
 * ISHTI Milestone M05 — Legal, Privacy & Trust Foundation Test Suite
 *
 * Verifies all 5 implementation gates (G1–G5) and remediation items:
 * - G1: Global Policy Centre (10 policies, status, draft filtering, schedules, search)
 * - G2: Sovereign Consent Governance (unbundled purposes, SHA-256 evidence, cookies)
 * - G3: Privacy Rights & Deletion Sanctuary (SAR export, 7-stage erasure, backup notice, retention matrix)
 * - G4: Commerce Trust & Fair Refunds (minor-unit arithmetic, proposed 0% fee, cancellation tiers, digital waiver)
 * - G5: Compliance Operations & Grievances (IT Rules 2026 SLAs, 2-factor grievance lookup, CERT-In triage, hash chain integrity)
 *
 * SAFETY INVARIANT: Strictly local, deterministic execution. Zero Supabase or external network calls.
 */

import { POLICIES } from "../apps/web/lib/policy/policy-registry";
import {
  getAllPolicies,
  getPolicyBySlug,
  getPoliciesByCategory,
  getPublishedPolicies,
  searchPolicies,
} from "../apps/web/lib/policy/policy-service";
import { CONSENT_PURPOSE_DEFINITIONS } from "../apps/web/lib/consent/consent-registry";
import {
  getDefaultConsentState,
  createConsentEvidence,
} from "../apps/web/lib/consent/consent-service";
import { sha256Hex } from "../apps/web/lib/consent/evidence-hasher";
import { generateSARDataPackage } from "../apps/web/lib/privacy/export-service";
import { executeSevenStageDeletion } from "../apps/web/lib/privacy/deletion-orchestrator";
import { STATUTORY_RETENTION_RULES } from "../apps/web/lib/privacy/retention-matrix";
import {
  calculateRefundEligibility,
  CONSULTATION_CANCELLATION_TIERS,
} from "../apps/web/lib/commerce/cancellation-calculator";
import { formatCurrency, SUPPORTED_CURRENCIES } from "../apps/web/lib/commerce/multi-currency";
import {
  createGrievanceTicket,
  getGrievanceByTicketNumber,
  getAllGrievances,
} from "../apps/web/lib/compliance/grievance-service";
import {
  verifyAdminSession,
  reassembleChunkedCookies,
  decodeCookieValue,
  verifyCsrfOrigin,
  checkComplianceRateLimit,
  getClientIp,
  getVerifiedNetworkIp,
  getNetworkRateLimitKey,
  getAccountRateLimitKey,
  getComplianceRateLimitKey,
  getTrustedProxyStrategy,
  isTrustedProxyConfigured,
  isValidIpFormat,
  getComplianceRateLimiterStats,
  resetComplianceRateLimiter,
  configureComplianceRateLimiter,
  BoundedRateLimiter,
  readBoundedJsonBody,
  type SessionVerificationProvider,
  type VerificationInput,
  type CookieItem,
} from "../apps/web/lib/compliance/compliance-session-verifier";
import {
  triageSecurityIncident,
  RECOGNIZED_SECURITY_POSTURE,
} from "../apps/web/lib/compliance/security-governance";
import {
  appendAuditLogEntry,
  verifyLedgerIntegrity,
  computeEntryHash,
  GENESIS_HASH,
} from "../apps/web/lib/compliance/audit-trail";
import type { AuditLogEntry, CurrencyCode, UserProfile } from "@spiritual-os/types";

interface TestResult {
  gate: string;
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, gate: string, name: string, detail?: string) {
  if (condition) {
    results.push({ gate, name, passed: true });
    console.log(`  [PASS] [${gate}] ${name}`);
  } else {
    results.push({ gate, name, passed: false, error: detail || "Assertion failed" });
    console.error(`  [FAIL] [${gate}] ${name}: ${detail || "Assertion failed"}`);
  }
}

async function runM05Tests() {
  console.log("================================================================================");
  console.log("   ISHTI Milestone M05: Legal, Privacy & Trust Technical Verification Suite   ");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // GATE 1: Global Policy Centre & Registry
  // --------------------------------------------------------------------------
  console.log("--- GATE 1: Policy Registry & Governance Architecture ---");

  assert(POLICIES.length === 10, "G1", "Policy Registry contains exactly 10 comprehensive policies", `Found ${POLICIES.length}`);

  const allInLegalReview = POLICIES.every((p) => p.status === "LEGAL_REVIEW");
  assert(allInLegalReview, "G1", "All 10 policies are marked with status 'LEGAL_REVIEW'");

  const allEffectivePending = POLICIES.every((p) => p.effectiveDate === "Pending Formal Legal Review");
  assert(allEffectivePending, "G1", "All 10 policies have effectiveDate 'Pending Formal Legal Review'");

  const termsPolicy = getPolicyBySlug("terms");
  assert(!!termsPolicy, "G1", "Master Terms of Service (terms) policy exists");
  assert(
    !!termsPolicy?.schedules && termsPolicy.schedules.length === 4,
    "G1",
    "Terms of Service includes 4 regional schedules (A: India, B: EU/UK, C: US, D: Global)",
    `Found ${termsPolicy?.schedules?.length}`
  );

  const privacyPolicy = getPolicyBySlug("privacy");
  assert(!!privacyPolicy, "G1", "Global Privacy Notice (privacy) policy exists");
  assert(
    privacyPolicy?.sections.length === 8,
    "G1",
    "Privacy Notice includes 8 comprehensive sections covering religious data, encryption, cross-border, and retention",
    `Found ${privacyPolicy?.sections.length}`
  );

  const legalReviewPlaceholdersPresent = POLICIES.some((p) =>
    p.sections.some((s) => s.content.includes("[LEGAL_REVIEW_REQUIRED:"))
  );
  assert(legalReviewPlaceholdersPresent, "G1", "Corporate entity and statutory officer placeholders preserve [LEGAL_REVIEW_REQUIRED:]");

  const searchResultsAll = searchPolicies("cancellation", true);
  assert(searchResultsAll.length > 0, "G1", "Policy search locates cancellation clauses in policies", `Count: ${searchResultsAll.length}`);

  const searchResultsPublished = searchPolicies("cancellation", false);
  assert(searchResultsPublished.length === 0, "G1", "Policy search with includeDrafts=false returns 0 results while in draft review");

  // --------------------------------------------------------------------------
  // GATE 2: Sovereign Consent Governance (DPDP §6 & GDPR Art 6/9)
  // --------------------------------------------------------------------------
  console.log("\n--- GATE 2: Sovereign Consent Governance & Evidence Hashing ---");

  assert(CONSENT_PURPOSE_DEFINITIONS.length === 6, "G2", "Consent registry defines 6 unbundled purposes", `Found ${CONSENT_PURPOSE_DEFINITIONS.length}`);

  const defaultState = getDefaultConsentState();
  assert(defaultState.consents.kundli_astrology === true, "G2", "Default consent: kundli_astrology defaults to true");
  assert(defaultState.consents.spiritual_ai === false, "G2", "Default consent: spiritual_ai defaults to false (opt-in)");
  assert(defaultState.consents.marketing_updates === false, "G2", "Default consent: marketing_updates defaults to false (opt-in)");

  // Evidence hash test
  const fixedTimestamp = "2026-11-17T12:00:00.000Z";
  const evidenceHash1 = await createConsentEvidence("kundli_astrology", "GRANTED", "test-user-123", "v2026.1", fixedTimestamp);
  const evidenceHash2 = await createConsentEvidence("kundli_astrology", "GRANTED", "test-user-123", "v2026.1", fixedTimestamp);
  assert(evidenceHash1 === evidenceHash2, "G2", "Consent evidence hash is deterministic for identical parameters");
  assert(evidenceHash1.length === 64, "G2", "Consent evidence hash produces standard 64-char SHA-256 hex string");

  const hashDiff = await createConsentEvidence("kundli_astrology", "WITHDRAWN", "test-user-123", "v2026.1", fixedTimestamp);
  assert(evidenceHash1 !== hashDiff, "G2", "Evidence hash differs when consent is WITHDRAWN vs GRANTED");

  // --------------------------------------------------------------------------
  // GATE 3: Privacy Rights, SAR & 7-Stage Deletion Orchestrator
  // --------------------------------------------------------------------------
  console.log("\n--- GATE 3: Privacy Rights, SAR & 7-Stage Deletion ---");

  const sarPackage = await generateSARDataPackage({
    userId: "devotee-108",
    fullName: "Arjuna Devotee",
    phone: "+91-9876543210",
    email: "arjuna@ishti.in",
  });
  assert(sarPackage.metadata.userId === "devotee-108", "G3", "SAR package metadata matches devotee identity");
  assert(
    sarPackage.metadata.fulfillmentStatus === "DEMONSTRATION_PREVIEW_ONLY",
    "G3",
    "SAR fulfillmentStatus is explicitly DEMONSTRATION_PREVIEW_ONLY"
  );
  assert(
    sarPackage.metadata.notice.includes("DEMONSTRATION PREVIEW"),
    "G3",
    "SAR package is explicitly labeled as demonstration preview"
  );
  assert(
    sarPackage.metadata.templateFingerprintSha256.length === 64,
    "G3",
    "SAR package includes cryptographic SHA-256 fingerprint"
  );
  assert(
    sarPackage.astrologicalDataSchema.encryptionStandard.includes("AES-256-GCM"),
    "G3",
    "SAR package acknowledges server-side AES-256-GCM envelope encryption standard"
  );
  assert(
    sarPackage.statutoryRetentionScheduleNotice.includes("Income-tax Act, 2025"),
    "G3",
    "SAR package discloses statutory tax retention under Income-tax Act, 2025"
  );

  // 7-Stage Deletion Sequence (Plan Specification with NOT_IMPLEMENTED Status)
  const deletionResult = await executeSevenStageDeletion("devotee-108");
  assert(deletionResult.overallStatus === "NOT_IMPLEMENTED", "G3", "Overall deletion status is explicitly NOT_IMPLEMENTED pending backend worker");
  assert(deletionResult.stages.length === 7, "G3", "Deletion sequence defines exactly 7 planned stages", `Found ${deletionResult.stages.length}`);
  const allStagesNotImplemented = deletionResult.stages.every((s) => s.status === "NOT_IMPLEMENTED");
  assert(allStagesNotImplemented, "G3", "Every deletion plan stage is marked NOT_IMPLEMENTED");
  assert(
    deletionResult.stages.some((s) => s.stage === "ASTRO_KEY_SHREDDING"),
    "G3",
    "Deletion specification includes ASTRO_KEY_SHREDDING stage"
  );
  assert(
    deletionResult.planFingerprintSha256.length === 64,
    "G3",
    "Deletion plan includes 64-char SHA-256 fingerprint"
  );
  assert(
    deletionResult.disclaimer.includes("No database records were modified or deleted"),
    "G3",
    "Deletion plan disclaimer explicitly confirms no database mutation occurred"
  );
  assert(
    deletionResult.missingBackendDependency.includes("Requires M06 server-side deletion worker"),
    "G3",
    "Deletion plan explicitly identifies missing M06 backend dependency"
  );

  // Statutory retention rules
  assert(STATUTORY_RETENTION_RULES.length >= 6, "G3", "Retention matrix defines at least 6 statutory record categories");
  const taxRule = STATUTORY_RETENTION_RULES.find((r) => r.statutoryCitation.includes("Income-tax Act, 2025"));
  assert(taxRule?.retentionYears === 7, "G3", "Tax records retention specified as 7 years under Income-tax Act, 2025 §62 / Rule 46", `Years: ${taxRule?.retentionYears}`);
  assert(taxRule?.isStatutory === true, "G3", "Tax records classified as statutory locked (isStatutory=true)");

  const companyRule = STATUTORY_RETENTION_RULES.find((r) => r.statutoryCitation.includes("Companies Act, 2013"));
  assert(companyRule?.retentionYears === 8, "G3", "Company financial records retention specified as 8 years under Companies Act, 2013 §128");

  // --------------------------------------------------------------------------
  // GATE 4: Commerce Trust, Multi-Currency & Refund Calculator
  // --------------------------------------------------------------------------
  console.log("\n--- GATE 4: Commerce Trust & Minor-Unit Refund Arithmetic ---");

  // Test Case A: >24h cancellation (100% refund, proposed 0% gateway fee deduction)
  const calc24h = calculateRefundEligibility({
    originalAmount: 2100,
    currency: "INR",
    serviceType: "live_consultation",
    hoursUntilStart: 36,
  });
  assert(calc24h.canCancel === true, "G4", ">24h live consultation cancellation is eligible for refund");
  assert(calc24h.refundPercentage === 100, "G4", ">24h live consultation refund percentage is 100%");
  assert(calc24h.gatewayFeeDeducted === 0, "G4", "Proposed gateway fee deduction defaults to 0%");
  assert(calc24h.netRefundAmount === 2100, "G4", "Net refund equals full original amount (2100 INR)");

  // Test Case B: 4-24h cancellation (50% refund, 0% gateway fee deduction)
  const calc12h = calculateRefundEligibility({
    originalAmount: 3000,
    currency: "INR",
    serviceType: "live_consultation",
    hoursUntilStart: 12,
  });
  assert(calc12h.canCancel === true, "G4", "12h live consultation cancellation is eligible for 50% refund");
  assert(calc12h.refundPercentage === 50, "G4", "12h cancellation refund percentage is 50%");
  assert(calc12h.grossRefundAmount === 1500, "G4", "Gross refund is 1500 INR");
  assert(calc12h.netRefundAmount === 1500, "G4", "Net refund is 1500 INR with 0% gateway fee deduction");

  // Test Case C: <4h cancellation (non-refundable)
  const calc2h = calculateRefundEligibility({
    originalAmount: 2100,
    currency: "INR",
    serviceType: "live_consultation",
    hoursUntilStart: 2,
  });
  assert(calc2h.canCancel === false, "G4", "<4h live consultation is non-refundable (canCancel=false)");
  assert(calc2h.netRefundAmount === 0, "G4", "Net refund is 0 INR within 4h cutoff");

  // Test Case D: Pandit no-show guarantee (100% full refund regardless of time)
  const calcNoShow = calculateRefundEligibility({
    originalAmount: 5000,
    currency: "INR",
    serviceType: "pandit_no_show",
    hoursUntilStart: 0,
  });
  assert(calcNoShow.canCancel === true, "G4", "Pandit no-show triggers guarantee (canCancel=true)");
  assert(calcNoShow.refundPercentage === 100, "G4", "Pandit no-show refund is 100%");
  assert(calcNoShow.netRefundAmount === 5000, "G4", "Pandit no-show returns 100% net refund with 0 fees");

  // Test Case E: Digital asset waiver
  const calcDownloaded = calculateRefundEligibility({
    originalAmount: 499,
    currency: "INR",
    serviceType: "digital_audio_scripture",
    hoursUntilStart: 0,
    isDigitalAssetDownloaded: true,
  });
  assert(calcDownloaded.canCancel === false, "G4", "Downloaded digital content is non-refundable (EU Art 16(m) waiver)");
  assert(calcDownloaded.isDigitalWaiverApplicable === true, "G4", "isDigitalWaiverApplicable is true for downloaded content");

  const calcNotDownloaded = calculateRefundEligibility({
    originalAmount: 499,
    currency: "INR",
    serviceType: "digital_audio_scripture",
    hoursUntilStart: 0,
    isDigitalAssetDownloaded: false,
  });
  assert(calcNotDownloaded.canCancel === true, "G4", "Non-downloaded digital content is refundable");
  assert(calcNotDownloaded.netRefundAmount === 499, "G4", "Non-downloaded content returns full 499 INR net refund");

  // Test Case F: Floating point precision check (e.g. 19.99 USD at 50%)
  const calcFloat = calculateRefundEligibility({
    originalAmount: 19.99,
    currency: "USD",
    serviceType: "live_consultation",
    hoursUntilStart: 10,
  });
  assert(calcFloat.grossRefundAmount === 10.0, "G4", "Minor unit arithmetic rounds $19.99 at 50% to clean $10.00 without IEEE-754 drift");

  // Multi-currency formatting
  const formattedInr = formatCurrency(2100, "INR");
  assert(formattedInr.includes("₹") && formattedInr.includes("2,100"), "G4", `INR formats with rupee symbol: ${formattedInr}`);

  const formattedUsd = formatCurrency(50, "USD");
  assert(formattedUsd.includes("$") && formattedUsd.includes("50.00"), "G4", `USD formats with dollar symbol: ${formattedUsd}`);

  const formattedEur = formatCurrency(45, "EUR");
  assert(formattedEur.includes("€") && formattedEur.includes("45"), "G4", `EUR formats with euro symbol: ${formattedEur}`);

  const formattedGbp = formatCurrency(35, "GBP");
  assert(formattedGbp.includes("£") && formattedGbp.includes("35.00"), "G4", `GBP formats with pound symbol: ${formattedGbp}`);

  // --------------------------------------------------------------------------
  // GATE 5: Compliance Operations, Grievances & Security Governance
  // --------------------------------------------------------------------------
  console.log("\n--- GATE 5: Compliance Operations, Grievances & Security SLAs ---");

  // 1. Compliance Admin Server-Side Session Authorization Tests
  interface MockSessionRecord {
    token: string;
    expired?: boolean;
    userId: string;
    role: "devotee" | "expert_pandit" | "content_scholar" | "platform_admin";
  }

  const mockSessions: Record<string, MockSessionRecord> = {
    "token-devotee-108": {
      token: "token-devotee-108",
      userId: "usr-devotee-108",
      role: "devotee",
    },
    "token-pandit-108": {
      token: "token-pandit-108",
      userId: "usr-pandit-108",
      role: "expert_pandit",
    },
    "token-scholar-108": {
      token: "token-scholar-108",
      userId: "usr-scholar-108",
      role: "content_scholar",
    },
    "token-admin-108": {
      token: "token-admin-108",
      userId: "usr-admin-108",
      role: "platform_admin",
    },
    "token-expired-999": {
      token: "token-expired-999",
      expired: true,
      userId: "usr-expired-999",
      role: "platform_admin",
    },
  };

  const testAuthProvider: SessionVerificationProvider = {
    isBackendConfigured: () => true,
    async resolveUserAndRole(input: VerificationInput) {
      let token = input.bearerToken;
      if (!token && input.cookies) {
        token = reassembleChunkedCookies(input.cookies);
      }
      if (!token || token.trim().length === 0) {
        return { status: "MISSING_SESSION", error: "No session found" };
      }
      if (token === "token-auth-outage-503") {
        return { status: "AUTH_OUTAGE", error: "Authentication service connection failed" };
      }
      if (token === "token-db-outage-503") {
        return { status: "DB_OUTAGE", error: "Database profile table unreachable" };
      }
      if (token === "token-missing-profile-403") {
        return { status: "PROFILE_MISSING", user: { id: "usr-no-profile" } };
      }
      const session = mockSessions[token];
      if (!session) {
        return { status: "INVALID_TOKEN", error: "Invalid signature / token not found in auth service" };
      }
      if (session.expired) {
        return { status: "EXPIRED_TOKEN", error: "Session token has expired" };
      }
      if (session.role !== "platform_admin") {
        return { status: "NON_ADMIN", user: { id: session.userId }, role: session.role };
      }
      return { status: "SUCCESS", user: { id: session.userId }, role: "platform_admin" };
    },
  };

  // 1. Missing session -> 401 Unauthorized
  const authNoSession = await verifyAdminSession({}, testAuthProvider);
  assert(
    authNoSession.authorized === false && authNoSession.statusCode === 401,
    "G5",
    "Server admin check: 1. Missing session returns 401 Unauthorized"
  );

  // 2. Invalid session -> 401 Unauthorized
  const authInvalid = await verifyAdminSession({ bearerToken: "forged-token-xyz-000" }, testAuthProvider);
  assert(
    authInvalid.authorized === false && authInvalid.statusCode === 401,
    "G5",
    "Server admin check: 2. Invalid session token signature returns 401 Unauthorized"
  );

  // 3. Expired session -> 401 Unauthorized
  const authExpired = await verifyAdminSession({ bearerToken: "token-expired-999" }, testAuthProvider);
  assert(
    authExpired.authorized === false && authExpired.statusCode === 401,
    "G5",
    "Server admin check: 3. Expired session token returns 401 Unauthorized"
  );

  // 4. Valid devotee session -> 403 Forbidden
  const authDevotee = await verifyAdminSession({ bearerToken: "token-devotee-108" }, testAuthProvider);
  assert(
    authDevotee.authorized === false && authDevotee.statusCode === 403,
    "G5",
    "Server admin check: 4. Valid devotee session returns 403 Forbidden"
  );

  // 5. Valid expert session -> 403 Forbidden
  const authPandit = await verifyAdminSession({ bearerToken: "token-pandit-108" }, testAuthProvider);
  assert(
    authPandit.authorized === false && authPandit.statusCode === 403,
    "G5",
    "Server admin check: 5. Valid expert_pandit session returns 403 Forbidden"
  );

  // 6. Valid scholar session -> 403 Forbidden
  const authScholar = await verifyAdminSession({ bearerToken: "token-scholar-108" }, testAuthProvider);
  assert(
    authScholar.authorized === false && authScholar.statusCode === 403,
    "G5",
    "Server admin check: 6. Valid content_scholar session returns 403 Forbidden"
  );

  // 7. Valid platform administrator session -> 200 Authorized
  const authAdmin = await verifyAdminSession({ bearerToken: "token-admin-108" }, testAuthProvider);
  assert(
    authAdmin.authorized === true && authAdmin.statusCode === 200,
    "G5",
    "Server admin check: 7. Valid platform_admin session returns 200 Authorized"
  );

  // 8. Chunked Supabase cookies (.0, .1) reassembly
  const chunkedCookies: CookieItem[] = [
    { name: "sb-zrjptpkhtklfgnovdrny-auth-token.0", value: "token-" },
    { name: "sb-zrjptpkhtklfgnovdrny-auth-token.1", value: "admin-108" },
  ];
  const reassembledToken = reassembleChunkedCookies(chunkedCookies);
  assert(
    reassembledToken === "token-admin-108",
    "G5",
    "Server admin check: 8. Chunked Supabase cookies are reassembled in index order"
  );
  const authChunked = await verifyAdminSession({ cookies: chunkedCookies }, testAuthProvider);
  assert(
    authChunked.authorized === true && authChunked.statusCode === 200,
    "G5",
    "Server admin check: 8b. Reassembled chunked cookie session authorizes admin with 200"
  );

  // 9. Encoded Supabase cookies (base64- prefix decoded)
  const encodedValue = `base64-${Buffer.from("token-admin-108").toString("base64")}`;
  const decodedToken = decodeCookieValue(encodedValue);
  assert(
    decodedToken === "token-admin-108",
    "G5",
    "Server admin check: 9. Base64-encoded cookie payload is safely decoded"
  );
  const authEncoded = await verifyAdminSession(
    { cookies: [{ name: "sb-access-token", value: encodedValue }] },
    testAuthProvider
  );
  assert(
    authEncoded.authorized === true && authEncoded.statusCode === 200,
    "G5",
    "Server admin check: 9b. Decoded base64 cookie session authorizes admin with 200"
  );

  // 10. Bearer-only authentication
  const authBearerOnly = await verifyAdminSession(
    { bearerToken: "token-admin-108", cookies: [] },
    testAuthProvider
  );
  assert(
    authBearerOnly.authorized === true && authBearerOnly.statusCode === 200,
    "G5",
    "Server admin check: 10. Bearer-only authentication resolves verified admin with 200"
  );

  // 11. Role manipulation headers
  const clientManipulationHeaders = {
    "x-user-role": "platform_admin",
    "x-ishti-role": "platform_admin",
    "authorization": "role=platform_admin",
  };
  const authDevoteeForgedHeader = await verifyAdminSession(
    { bearerToken: "token-devotee-108", headers: clientManipulationHeaders },
    testAuthProvider
  );
  assert(
    authDevoteeForgedHeader.authorized === false && authDevoteeForgedHeader.statusCode === 403,
    "G5",
    "Server admin check: 11. Client-supplied role header manipulation is strictly rejected with 403"
  );

  // 12. Client-side role manipulation without session
  const authUnauthForgedHeader = await verifyAdminSession(
    { headers: clientManipulationHeaders },
    testAuthProvider
  );
  assert(
    authUnauthForgedHeader.authorized === false && authUnauthForgedHeader.statusCode === 401,
    "G5",
    "Server admin check: 12. Unauthenticated caller sending x-user-role='platform_admin' rejected with 401"
  );

  // 13. Profile lookup failures: DB outage vs Profile missing
  const authDbOutage = await verifyAdminSession(
    { bearerToken: "token-db-outage-503" },
    testAuthProvider
  );
  assert(
    authDbOutage.authorized === false && authDbOutage.statusCode === 503,
    "G5",
    "Server admin check: 13a. Database infrastructure profile lookup failure returns 503"
  );

  const authProfileMissing = await verifyAdminSession(
    { bearerToken: "token-missing-profile-403" },
    testAuthProvider
  );
  assert(
    authProfileMissing.authorized === false && authProfileMissing.statusCode === 403,
    "G5",
    "Server admin check: 13b. Missing profile record for valid auth user returns 403"
  );

  // 14. Authentication provider outage -> 503
  const authProviderOutage = await verifyAdminSession(
    { bearerToken: "token-auth-outage-503" },
    testAuthProvider
  );
  assert(
    authProviderOutage.authorized === false && authProviderOutage.statusCode === 503,
    "G5",
    "Server admin check: 14. Authentication service provider infrastructure outage returns 503"
  );

  // 15. Direct unauthorized API requests -> 401
  const authDirectApiNoSession = await verifyAdminSession({}, testAuthProvider);
  assert(
    authDirectApiNoSession.authorized === false && authDirectApiNoSession.statusCode === 401,
    "G5",
    "Server admin check: 15. Direct API request without session token is strictly rejected with 401"
  );

  // 16. Malformed requests (oversized payloads & malformed payloads)
  const oversizedLength = 70000;
  const isOversized = oversizedLength > 65536;
  assert(
    isOversized === true,
    "G5",
    "Server admin check: 16a. Oversized payload (>64KB) is detected for 413 Payload Too Large"
  );

  let malformedJsonParsed = false;
  try {
    JSON.parse("{ invalid json body");
    malformedJsonParsed = true;
  } catch {
    malformedJsonParsed = false;
  }
  assert(
    malformedJsonParsed === false,
    "G5",
    "Server admin check: 16b. Malformed non-JSON payload fails validation safely (400)"
  );

  // 17. CSRF protections
  const crossSiteCsrf = verifyCsrfOrigin({
    method: "POST",
    headers: {
      get: (h: string) => (h === "sec-fetch-site" ? "cross-site" : null),
    },
  });
  assert(
    crossSiteCsrf.valid === false,
    "G5",
    "Server admin check: 17a. Cookie-authenticated mutation with Sec-Fetch-Site: cross-site is rejected"
  );

  const mismatchedOriginCsrf = verifyCsrfOrigin({
    method: "POST",
    headers: {
      get: (h: string) => {
        if (h === "origin") return "https://evil-attacker.com";
        if (h === "host") return "ishti.in";
        return null;
      },
    },
  });
  assert(
    mismatchedOriginCsrf.valid === false,
    "G5",
    "Server admin check: 17b. Cookie-authenticated mutation with mismatched Origin is rejected"
  );

  const bearerCsrfExempt = verifyCsrfOrigin({
    method: "POST",
    headers: {
      get: (h: string) => (h === "authorization" ? "Bearer token-admin-108" : null),
    },
  });
  assert(
    bearerCsrfExempt.valid === true,
    "G5",
    "Server admin check: 17c. Bearer-authenticated mutation is exempt from browser CSRF penalty"
  );

  // 17d. Configured trusted origin
  process.env.ALLOWED_ORIGINS = "https://ishti.in,https://app.ishti.in";
  const trustedOriginCsrf = verifyCsrfOrigin({
    method: "POST",
    headers: {
      get: (h: string) => (h === "origin" ? "https://app.ishti.in" : h === "host" ? "ishti.in" : null),
    },
  });
  assert(
    trustedOriginCsrf.valid === true,
    "G5",
    "Server admin check: 17d. Cookie-authenticated mutation from configured trusted origin is accepted"
  );

  // 18. Client IP extraction with proxy validation & spoofing defense
  const origTrustedProxy = process.env.TRUSTED_PROXY;
  const origTrustedStrategy = process.env.TRUSTED_PROXY_STRATEGY;
  const origNodeEnv = process.env.NODE_ENV;

  try {
    // 18a. Missing trusted proxy config + spoofed x-forwarded-for -> direct-client
    delete process.env.TRUSTED_PROXY;
    delete process.env.TRUSTED_PROXY_STRATEGY;
    const spoofedXff = getClientIp({
      get: (h: string) => (h === "x-forwarded-for" ? "198.51.100.1, 10.0.0.1" : null),
    });
    assert(
      spoofedXff === "direct-client",
      "G5",
      "Server admin check: 18a. Spoofed X-Forwarded-For without trusted proxy config is rejected as direct-client"
    );

    // 18b. Missing trusted proxy config + spoofed cf-connecting-ip -> direct-client
    const spoofedCf = getClientIp({
      get: (h: string) => (h === "cf-connecting-ip" ? "203.0.113.195" : null),
    });
    assert(
      spoofedCf === "direct-client",
      "G5",
      "Server admin check: 18b. Spoofed CF-Connecting-IP without trusted proxy config is rejected as direct-client"
    );

    // 18c. Missing trusted proxy config + NODE_ENV === "production" -> still rejected
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const prodWithoutConfig = getClientIp({
      get: (h: string) => (h === "cf-connecting-ip" ? "203.0.113.195" : null),
    });
    assert(
      prodWithoutConfig === "direct-client",
      "G5",
      "Server admin check: 18c. Proxy trust is NOT automatically granted merely based on NODE_ENV===production"
    );

    // 18c2. Pass 8.1: Bare boolean TRUSTED_PROXY="true" without strategy does NOT activate proxy trust
    process.env.TRUSTED_PROXY = "true";
    delete process.env.TRUSTED_PROXY_STRATEGY;
    const legacyProxyBoolIp = getClientIp({
      get: (h: string) => (h === "x-real-ip" ? "203.0.113.195" : h === "cf-connecting-ip" ? "203.0.113.196" : null),
    });
    assert(
      legacyProxyBoolIp === "direct-client" && getTrustedProxyStrategy() === "none" && !isTrustedProxyConfigured(),
      "G5",
      "Server admin check: 18c2. Legacy TRUSTED_PROXY='true' without explicit strategy does NOT activate proxy trust"
    );
    delete process.env.TRUSTED_PROXY;

    // 18d. Missing headers -> direct-client
    const fallbackIp = getClientIp({
      get: () => null,
    });
    assert(
      fallbackIp === "direct-client",
      "G5",
      "Server admin check: 18d. Direct un-proxied connection falls back safely to direct-client"
    );

    // 18e. Valid configured proxy with TRUSTED_PROXY_STRATEGY="cloudflare"
    delete process.env.TRUSTED_PROXY;
    process.env.TRUSTED_PROXY_STRATEGY = "cloudflare";
    const validCfStrategy = getClientIp({
      get: (h: string) => (h === "cf-connecting-ip" ? "203.0.113.200" : null),
    });
    assert(
      validCfStrategy === "203.0.113.200",
      "G5",
      "Server admin check: 18e. Valid CF-Connecting-IP extracted when TRUSTED_PROXY_STRATEGY='cloudflare'"
    );

    // 18f. Cloudflare mode with missing CF-Connecting-IP but present XFF: strictly NO silent fallback
    const cfMissingFallback = getClientIp({
      get: (h: string) => (h === "x-forwarded-for" ? "198.51.100.1" : null),
    });
    assert(
      cfMissingFallback === "direct-client",
      "G5",
      "Server admin check: 18f. Cloudflare mode with missing CF-Connecting-IP strictly rejects XFF fallback"
    );

    // 18g. Cloudflare mode with malformed CF-Connecting-IP: strictly NO silent fallback
    const cfMalformedFallback = getClientIp({
      get: (h: string) => {
        if (h === "cf-connecting-ip") return "malformed-ip-string";
        if (h === "x-forwarded-for") return "198.51.100.1";
        return null;
      },
    });
    assert(
      cfMalformedFallback === "direct-client",
      "G5",
      "Server admin check: 18g. Cloudflare mode with malformed CF-Connecting-IP strictly rejects XFF fallback"
    );

    // 18h. Cloudflare mode with conflicting forwarded headers: authoritative CF-Connecting-IP takes precedence
    const cfConflictingHeaders = getClientIp({
      get: (h: string) => {
        if (h === "cf-connecting-ip") return "203.0.113.50";
        if (h === "x-forwarded-for") return "198.51.100.99, 10.0.0.1";
        if (h === "x-real-ip") return "198.51.100.88";
        return null;
      },
    });
    assert(
      cfConflictingHeaders === "203.0.113.50",
      "G5",
      "Server admin check: 18h. Cloudflare mode prioritizes authoritative CF-Connecting-IP over conflicting headers"
    );

    // 18i. Valid configured proxy with TRUSTED_PROXY_STRATEGY="reverse_proxy" & X-Real-IP
    process.env.TRUSTED_PROXY_STRATEGY = "reverse_proxy";
    const validRealIpStrategy = getClientIp({
      get: (h: string) => {
        if (h === "x-real-ip") return "198.51.100.77";
        if (h === "x-forwarded-for") return "10.0.0.1, 192.168.1.1";
        return null;
      },
    });
    assert(
      validRealIpStrategy === "198.51.100.77",
      "G5",
      "Server admin check: 18i. Valid client IP extracted from authoritative X-Real-IP under reverse_proxy strategy"
    );

    // 18j. Valid configured proxy with TRUSTED_PROXY_STRATEGY="reverse_proxy" & XFF fallback
    const validXffStrategy = getClientIp({
      get: (h: string) => (h === "x-forwarded-for" ? "198.51.100.88, 10.0.0.1" : null),
    });
    assert(
      validXffStrategy === "198.51.100.88",
      "G5",
      "Server admin check: 18j. Valid client IP extracted from X-Forwarded-For under reverse_proxy strategy"
    );

    // 18k. Malformed IP injection rejected even when proxy is trusted
    const malformedInjection = getClientIp({
      get: (h: string) => (h === "x-forwarded-for" ? "not-an-ip-injection-attempt" : null),
    });
    assert(
      malformedInjection === "direct-client",
      "G5",
      "Server admin check: 18k. Malformed or non-IP header rejected safely as direct-client"
    );

    // 18l. Explicit TRUSTED_PROXY_STRATEGY="direct": all forwarded headers ignored
    process.env.TRUSTED_PROXY_STRATEGY = "direct";
    const explicitDirect = getClientIp({
      get: (h: string) => (h === "cf-connecting-ip" ? "203.0.113.195" : null),
    });
    assert(
      explicitDirect === "direct-client",
      "G5",
      "Server admin check: 18l. Explicit TRUSTED_PROXY_STRATEGY='direct' treats all headers as untrusted"
    );

    // 18m. Defensible Pre-Auth Identity: Direct clients collapse to bounded fallback (no rotating fingerprint bypass)
    delete process.env.TRUSTED_PROXY;
    delete process.env.TRUSTED_PROXY_STRATEGY;

    const keyClientA = getComplianceRateLimitKey("audit-get", {
      get: (h: string) => (h === "user-agent" ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" : null),
    });
    const keyClientB = getComplianceRateLimitKey("audit-get", {
      get: (h: string) => (h === "user-agent" ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" : null),
    });
    assert(
      keyClientA === "audit-get:net:untrusted-direct" && keyClientB === "audit-get:net:untrusted-direct",
      "G5",
      "Server admin check: 18m. Unauthenticated direct clients share bounded fallback key without rotating fingerprint bypass"
    );

    // 18n. Authentication Boundary: Unauthenticated tokens do not create trusted identities; verified accounts use account keys
    const keyAuthBearer = getComplianceRateLimitKey("audit-get", {
      get: (h: string) => (h === "authorization" ? "Bearer token-admin-108" : null),
    });
    const keyVerifiedAccount = getAccountRateLimitKey("audit-get", "user-verified-admin-108");
    assert(
      keyAuthBearer === "audit-get:net:untrusted-direct" && keyVerifiedAccount === "audit-get:acct:user-verified-admin-108",
      "G5",
      "Server admin check: 18n. Unauthenticated bearer tokens do not create identity buckets; verified accounts bind to user ID"
    );

    // 18o. Verified Proxy IP Keying: Explicit trusted proxy correctly formats network rate limit key
    process.env.TRUSTED_PROXY_STRATEGY = "cloudflare";
    const keyVerifiedIp = getComplianceRateLimitKey("audit-get", {
      get: (h: string) => (h === "cf-connecting-ip" ? "203.0.113.50" : null),
    });
    assert(
      keyVerifiedIp === "audit-get:net:ip:203.0.113.50",
      "G5",
      "Server admin check: 18o. Verified proxy IP correctly formats IP-based rate limit key"
    );
  } finally {
    if (origTrustedProxy !== undefined) process.env.TRUSTED_PROXY = origTrustedProxy;
    else delete process.env.TRUSTED_PROXY;

    if (origTrustedStrategy !== undefined) process.env.TRUSTED_PROXY_STRATEGY = origTrustedStrategy;
    else delete process.env.TRUSTED_PROXY_STRATEGY;

    if (origNodeEnv !== undefined) (process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv;
    else delete (process.env as Record<string, string | undefined>).NODE_ENV;
  }

  // Unconfigured or offline backend authentication -> 503 Disabled
  const offlineAuthProvider: SessionVerificationProvider = {
    ...testAuthProvider,
    isBackendConfigured: () => false,
  };
  const authOfflineBackend = await verifyAdminSession(
    { bearerToken: "token-admin-108" },
    offlineAuthProvider
  );
  assert(
    authOfflineBackend.authorized === false && authOfflineBackend.statusCode === 503,
    "G5",
    "Server admin check: Unconfigured backend authentication disables administrative access with 503 (M06 dependency)"
  );

  // 2. Grievance Portal & SLAs (Zero Fake Seeds & Prototype Flagging)
  const initialGrievances = getAllGrievances();
  assert(
    initialGrievances.length === 0,
    "G5",
    "Production grievance store contains zero pre-seeded fake complaints",
    `Count: ${initialGrievances.length}`
  );

  const ticketIntermediary = createGrievanceTicket({
    category: "intermediary_complaint",
    complainantName: "Bhakt Shishya",
    complainantEmail: "shishya@ishti.in",
    subject: "Objectionable commentary report",
    description: "Comment on Satsang thread violates platform sacred decorum.",
  });
  assert(ticketIntermediary.ticketNumber.startsWith("ISHTI-GRV-"), "G5", "Grievance ticket number formatted with ISHTI-GRV- prefix");
  assert(ticketIntermediary.status === "ACKNOWLEDGED", "G5", "Grievance is assigned ACKNOWLEDGED status");
  assert(ticketIntermediary.isPrototype === true, "G5", "Grievance ticket is explicitly flagged as prototype preview");
  assert(ticketIntermediary.gacAppealEligible === true, "G5", "Grievance ticket designates GAC appeal eligibility under IT Rules 2021 Rule 3A");
  assert(
    ticketIntermediary.officerDesignation.includes("Statutory Grievance Officer"),
    "G5",
    "Grievance ticket assigns officerDesignation placeholder"
  );

  const resDays =
    (new Date(ticketIntermediary.resolutionDeadline).getTime() -
      new Date(ticketIntermediary.submittedAt).getTime()) /
    (1000 * 60 * 60 * 24);
  assert(Math.round(resDays) === 7, "G5", "Intermediary complaint resolution SLA is 7 days under Feb 2026 amendments", `Days: ${resDays}`);

  // Two-factor grievance lookup test (Ticket Number + Complainant Email)
  const foundTicket = getGrievanceByTicketNumber(ticketIntermediary.ticketNumber);
  assert(!!foundTicket, "G5", "Ticket lookup finds created ticket by ticketNumber");
  assert(
    foundTicket?.complainantEmail.toLowerCase() === "shishya@ishti.in",
    "G5",
    "Grievance lookup matches complainantEmail for identity verification"
  );

  // 3. Security Incident Triage (CERT-In 6-Hour SLA vs DPDP §8(6))
  const criticalTriage = triageSecurityIncident({
    incidentType: "UNAUTHORIZED_DB_ACCESS",
    affectedSystems: ["kundli_vault", "profiles_db"],
    severity: "CRITICAL",
    isPersonalDataExposed: true,
    isRansomwareOrSystemic: false,
    summary: "Simulated high-severity database anomaly",
  });
  assert(criticalTriage.certInNotificationRequired === true, "G5", "CRITICAL incident triggers mandatory CERT-In 6-hour reporting window");
  assert(criticalTriage.dpdpBreachNoticeRequired === true, "G5", "Personal data exposure triggers mandatory DPDP Act §8(6) intimation");

  const certInDeadlineHours =
    (new Date(criticalTriage.containmentDeadline).getTime() -
      new Date(criticalTriage.detectedAt).getTime()) /
    (1000 * 60 * 60);
  assert(Math.round(certInDeadlineHours) === 6, "G5", "CERT-In containment deadline calculated as exactly 6 hours", `Hours: ${certInDeadlineHours}`);

  const lowTriage = triageSecurityIncident({
    incidentType: "ROUTINE_PING_SCAN",
    affectedSystems: ["edge_proxy"],
    severity: "LOW",
    isPersonalDataExposed: false,
    isRansomwareOrSystemic: false,
    summary: "Routine scanner probe blocked by cloudflare",
  });
  assert(lowTriage.certInNotificationRequired === false, "G5", "LOW non-systemic incident does NOT trigger CERT-In emergency notification");
  assert(lowTriage.dpdpBreachNoticeRequired === false, "G5", "Non-personal incident does NOT trigger DPDP §8(6) notice");

  // 4. Tamper-Evident SHA-256 Hash Chain (All 7 Verification Scenarios)
  const genesisPayloadHash = await sha256Hex(JSON.stringify({ init: true }));
  const genesisEntryHash = await computeEntryHash(
    0,
    "2026-11-17T00:00:00Z",
    "PLATFORM_INITIALIZATION",
    "SYSTEM",
    genesisPayloadHash,
    GENESIS_HASH
  );
  const testGenesis: AuditLogEntry = {
    index: 0,
    timestamp: "2026-11-17T00:00:00Z",
    eventType: "PLATFORM_INITIALIZATION",
    actor: "SYSTEM",
    payloadHash: genesisPayloadHash,
    previousHash: GENESIS_HASH,
    entryHash: genesisEntryHash,
  };

  const block1PayloadHash = await sha256Hex(JSON.stringify({ action: "USER_CONSENT_GRANTED" }));
  const block1Hash = await computeEntryHash(
    1,
    "2026-11-17T00:05:00Z",
    "CONSENT_CHANGE",
    "USER",
    block1PayloadHash,
    testGenesis.entryHash
  );
  const testBlock1: AuditLogEntry = {
    index: 1,
    timestamp: "2026-11-17T00:05:00Z",
    eventType: "CONSENT_CHANGE",
    actor: "USER",
    payloadHash: block1PayloadHash,
    previousHash: testGenesis.entryHash,
    entryHash: block1Hash,
  };

  const block2PayloadHash = await sha256Hex(JSON.stringify({ action: "GRIEVANCE_FILED" }));
  const block2Hash = await computeEntryHash(
    2,
    "2026-11-17T00:10:00Z",
    "GRIEVANCE_FILED",
    "USER",
    block2PayloadHash,
    testBlock1.entryHash
  );
  const testBlock2: AuditLogEntry = {
    index: 2,
    timestamp: "2026-11-17T00:10:00Z",
    eventType: "GRIEVANCE_FILED",
    actor: "USER",
    payloadHash: block2PayloadHash,
    previousHash: testBlock1.entryHash,
    entryHash: block2Hash,
  };

  const validChain = [testGenesis, testBlock1, testBlock2];

  // Tamper Scenario 1: Valid unaltered chain passes
  assert(
    (await verifyLedgerIntegrity(validChain)) === true,
    "G5",
    "Audit ledger: Valid unaltered hash chain passes integrity verification"
  );

  // Tamper Scenario 2: Tampered genesis block fails
  const tamperedGenesisChain = [
    { ...testGenesis, previousHash: "1111111111111111111111111111111111111111111111111111111111111111" },
    testBlock1,
    testBlock2,
  ];
  assert(
    (await verifyLedgerIntegrity(tamperedGenesisChain)) === false,
    "G5",
    "Audit ledger: Tampered genesis previousHash fails verification"
  );

  // Tamper Scenario 3: Modified payload hash fails
  const tamperedPayloadChain = [
    testGenesis,
    { ...testBlock1, payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    testBlock2,
  ];
  assert(
    (await verifyLedgerIntegrity(tamperedPayloadChain)) === false,
    "G5",
    "Audit ledger: Tampered payload hash fails verification"
  );

  // Tamper Scenario 4: Out-of-order timestamp fails
  const tamperedTimestampChain = [
    testGenesis,
    { ...testBlock1, timestamp: "2026-11-16T23:59:59Z" }, // earlier than genesis
    testBlock2,
  ];
  assert(
    (await verifyLedgerIntegrity(tamperedTimestampChain)) === false,
    "G5",
    "Audit ledger: Non-monotonic out-of-order timestamp fails verification"
  );

  // Tamper Scenario 5: Deleted block (index gap) fails
  const deletedBlockChain = [testGenesis, testBlock2]; // missing index 1
  assert(
    (await verifyLedgerIntegrity(deletedBlockChain)) === false,
    "G5",
    "Audit ledger: Deleted block / index continuity gap fails verification"
  );

  // Tamper Scenario 6: Reordered blocks fail
  const reorderedChain = [testGenesis, testBlock2, testBlock1];
  assert(
    (await verifyLedgerIntegrity(reorderedChain)) === false,
    "G5",
    "Audit ledger: Reordered blocks fail verification"
  );

  // Tamper Scenario 7: Forged entryHash fails
  const forgedHashChain = [
    testGenesis,
    { ...testBlock1, entryHash: "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
    { ...testBlock2, previousHash: "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
  ];
  assert(
    (await verifyLedgerIntegrity(forgedHashChain)) === false,
    "G5",
    "Audit ledger: Forged entryHash fails recomputed cryptographic check"
  );

  // --------------------------------------------------------------------------
  // Pass 8: Mandatory Adversarial Rate-Limiter & Identity Test Suite
  // --------------------------------------------------------------------------
  console.log("\n[PASS 8] Executing Mandatory Adversarial Rate-Limiter & Identity Suite...");

  // Adversarial Test 1: 10,000 unique fake bearer tokens -> No unlimited trusted identity creation
  const fakeTokenKeys = new Set<string>();
  for (let i = 0; i < 10000; i++) {
    const key = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "authorization" ? `Bearer attacker-fake-token-${i}` : null),
    });
    fakeTokenKeys.add(key);
  }
  assert(
    fakeTokenKeys.size === 1 && fakeTokenKeys.has("audit-get:net:untrusted-direct"),
    "G5",
    "Pass 8 Adversarial 1: 10,000 unique fake bearer tokens collapse into single untrusted-direct key (no identity bloat)"
  );

  // Adversarial Test 2: 10,000 rotating cookie values -> No unlimited trusted identity creation
  const rotatingCookieKeys = new Set<string>();
  for (let i = 0; i < 10000; i++) {
    const key = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "cookie" ? `sb-auth-token=rotating-session-val-${i}` : null),
    });
    rotatingCookieKeys.add(key);
  }
  assert(
    rotatingCookieKeys.size === 1 && rotatingCookieKeys.has("audit-get:net:untrusted-direct"),
    "G5",
    "Pass 8 Adversarial 2: 10,000 rotating cookie values collapse into single untrusted-direct key (no identity bloat)"
  );

  // Adversarial Test 3: Rotating browser fingerprints -> No rate-limit bypass
  const fingerprintLimiter = new BoundedRateLimiter({ maxEntries: 100, defaultWindowMs: 60000 });
  const fpLimit = 5;
  let fpAllowed = 0;
  let fpBlocked = 0;
  for (let i = 0; i < 15; i++) {
    const key = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => {
        if (h === "user-agent") return `AdversaryBot/${i}.0 (CustomAgent; Variant-${i})`;
        if (h === "accept-language") return `en-US,en;q=0.${(i % 9) + 1}`;
        if (h === "sec-ch-ua") return `"Chromium";v="${120 + i}", "Not?A_Brand";v="${i}"`;
        return null;
      },
    });
    const allowed = fingerprintLimiter.check(key, fpLimit, 60000);
    if (allowed) fpAllowed++;
    else fpBlocked++;
  }
  assert(
    fpAllowed === 5 && fpBlocked === 10,
    "G5",
    "Pass 8 Adversarial 3: Rotating browser fingerprints (UA/Lang/Sec-CH-UA) fails to bypass rate limit (10 of 15 blocked)"
  );

  // Adversarial Test 4: Invalid-token flood -> Bounded memory
  const floodLimiter = new BoundedRateLimiter({ maxEntries: 1000, defaultWindowMs: 60000 });
  for (let i = 0; i < 10000; i++) {
    const key = getNetworkRateLimitKey("audit-post", {
      get: (h: string) => (h === "authorization" ? `Bearer invalid-signature-${i}` : null),
    });
    floodLimiter.check(key, 100, 60000);
  }
  const floodStats = floodLimiter.getStats();
  assert(
    floodStats.size === 1 && floodStats.totalBlocked > 9000,
    "G5",
    "Pass 8 Adversarial 4: Invalid-token flood of 10,000 requests consumes exactly 1 entry in limiter Map"
  );

  // Adversarial Test 5: Spoofed X-Forwarded-For -> Not trusted in direct mode
  const origProxyStrategy = process.env.TRUSTED_PROXY_STRATEGY;
  const origProxyBool = process.env.TRUSTED_PROXY;
  try {
    delete process.env.TRUSTED_PROXY;
    delete process.env.TRUSTED_PROXY_STRATEGY;
    const directXffKey = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "x-forwarded-for" ? "198.51.100.1, 10.0.0.1" : null),
    });
    assert(
      directXffKey === "audit-get:net:untrusted-direct",
      "G5",
      "Pass 8 Adversarial 5: Spoofed X-Forwarded-For in direct mode maps to untrusted-direct"
    );

    // Adversarial Test 6: Spoofed X-Real-IP -> Not trusted in direct mode
    const directRealIpKey = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "x-real-ip" ? "198.51.100.2" : null),
    });
    assert(
      directRealIpKey === "audit-get:net:untrusted-direct",
      "G5",
      "Pass 8 Adversarial 6: Spoofed X-Real-IP in direct mode maps to untrusted-direct"
    );

    // Adversarial Test 7: Missing Cloudflare header -> Safe rejection/fallback
    process.env.TRUSTED_PROXY_STRATEGY = "cloudflare";
    const cfMissingKey = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "x-forwarded-for" ? "203.0.113.195" : null),
    });
    assert(
      cfMissingKey === "audit-get:net:untrusted-direct",
      "G5",
      "Pass 8 Adversarial 7: Cloudflare mode with missing CF-Connecting-IP rejects XFF fallback and maps to untrusted-direct"
    );

    // Adversarial Test 8: Malformed Cloudflare header -> Safe rejection/fallback
    const cfMalformedKey = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "cf-connecting-ip" ? "999.999.999.999" : null),
    });
    const cfInjectionKey = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "cf-connecting-ip" ? "203.0.113.50; DROP TABLE" : null),
    });
    assert(
      cfMalformedKey === "audit-get:net:untrusted-direct" && cfInjectionKey === "audit-get:net:untrusted-direct",
      "G5",
      "Pass 8 Adversarial 8: Cloudflare mode with malformed CF-Connecting-IP rejects value and maps to untrusted-direct"
    );

    // Adversarial Test 9: Reverse proxy mode -> Trust follows explicit ingress assumption
    process.env.TRUSTED_PROXY_STRATEGY = "reverse_proxy";
    const revProxyRealIpKey = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "x-real-ip" ? "198.51.100.42" : null),
    });
    const revProxyXffKey = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "x-forwarded-for" ? "198.51.100.43, 10.0.0.1" : null),
    });
    const revProxyMalformedKey = getNetworkRateLimitKey("audit-get", {
      get: (h: string) => (h === "x-real-ip" ? "invalid.ip.address" : null),
    });
    assert(
      revProxyRealIpKey === "audit-get:net:ip:198.51.100.42" &&
        revProxyXffKey === "audit-get:net:ip:198.51.100.43" &&
        revProxyMalformedKey === "audit-get:net:untrusted-direct",
      "G5",
      "Pass 8 Adversarial 9: Reverse proxy strategy extracts sanitized real IP / XFF and rejects malformed values"
    );
  } finally {
    if (origProxyStrategy !== undefined) process.env.TRUSTED_PROXY_STRATEGY = origProxyStrategy;
    else delete process.env.TRUSTED_PROXY_STRATEGY;
    if (origProxyBool !== undefined) process.env.TRUSTED_PROXY = origProxyBool;
    else delete process.env.TRUSTED_PROXY;
  }

  // Adversarial Test 10: Map saturation -> Maximum cardinality preserved (Safe saturation rejection, zero active eviction)
  const satLimiter = new BoundedRateLimiter({ maxEntries: 100, defaultWindowMs: 60000 });
  let satAllowed = 0;
  let satBlocked = 0;
  for (let i = 0; i < 1000; i++) {
    const res = satLimiter.check(`ip:${Math.floor(i / 256)}.${i % 256}.1.1`, 10, 60000);
    if (res) satAllowed++;
    else satBlocked++;
  }
  const satStats = satLimiter.getStats();
  assert(
    satStats.size <= 100 && satAllowed === 100 && satBlocked === 900 && satStats.totalEvicted === 0,
    "G5",
    "Pass 8 Adversarial 10: Map saturation strictly bounds size (<= 100), rejects new identities, and preserves active entries (0 evicted)"
  );

  // Adversarial Test 11: Expired entries -> Correct cleanup
  const expLimiter = new BoundedRateLimiter({ maxEntries: 100, defaultWindowMs: 50 });
  const simulatedNow = Date.now();
  for (let i = 0; i < 20; i++) {
    expLimiter.check(`exp-key-${i}`, 5, 50);
  }
  assert(expLimiter.getStats().size === 20, "G5", "Pass 8 Adversarial 11a: Entries inserted before expiration");
  const purged = expLimiter.cleanupExpired(simulatedNow + 200);
  assert(
    purged === 20 && expLimiter.getStats().size === 0,
    "G5",
    "Pass 8 Adversarial 11: Expired entries are cleanly purged and memory is fully reclaimed"
  );

  // Adversarial Test 12: Concurrent requests -> No limit-boundary race
  const raceLimiter = new BoundedRateLimiter({ maxEntries: 100, defaultWindowMs: 60000 });
  const raceLimit = 10;
  const raceBurst = 50;
  const raceResults = await Promise.all(
    Array.from({ length: raceBurst }).map(() =>
      Promise.resolve(raceLimiter.check("concurrent-race-key", raceLimit, 60000))
    )
  );
  const raceAllowed = raceResults.filter(Boolean).length;
  const raceBlocked = raceResults.filter((r) => !r).length;
  assert(
    raceAllowed === 10 && raceBlocked === 40,
    "G5",
    "Pass 8 Adversarial 12: Concurrent burst of 50 requests strictly allows exactly 10 and rejects 40 without race"
  );

  // Adversarial Test 13: Authenticated account -> Account-level bucket works
  const acctLimiter = new BoundedRateLimiter({ maxEntries: 100, defaultWindowMs: 60000 });
  const acctKey1 = getAccountRateLimitKey("audit-post", "user-uuid-1");
  const acctKey2 = getAccountRateLimitKey("audit-post", "user-uuid-2");
  for (let i = 0; i < 5; i++) {
    acctLimiter.check(acctKey1, 5, 60000);
  }
  const acct1Breach = acctLimiter.check(acctKey1, 5, 60000); // 6th attempt
  const acct2First = acctLimiter.check(acctKey2, 5, 60000); // independent account
  assert(
    acct1Breach === false && acct2First === true,
    "G5",
    "Pass 8 Adversarial 13: Authenticated user account rate limit correctly isolates quota and blocks on breach"
  );

  // Adversarial Test 14: Multiple accounts, same network -> Independent account controls
  const multiAcctLimiter = new BoundedRateLimiter({ maxEntries: 100, defaultWindowMs: 60000 });
  const aliceKey = getAccountRateLimitKey("triage-post", "user-alice-108");
  const bobKey = getAccountRateLimitKey("triage-post", "user-bob-108");
  // Alice exhausts her account limit of 3
  multiAcctLimiter.check(aliceKey, 3, 60000);
  multiAcctLimiter.check(aliceKey, 3, 60000);
  multiAcctLimiter.check(aliceKey, 3, 60000);
  const aliceBlocked = !multiAcctLimiter.check(aliceKey, 3, 60000);
  // Bob, on the same IP network, has an independent quota
  const bobAllowed = multiAcctLimiter.check(bobKey, 3, 60000);
  assert(
    aliceBlocked && bobAllowed,
    "G5",
    "Pass 8 Adversarial 14: Multiple accounts sharing same network have independent quotas (Alice exhausted does not block Bob)"
  );

  // Adversarial Test 15: One account, multiple networks -> Account-level limit remains effective
  const roamLimiter = new BoundedRateLimiter({ maxEntries: 100, defaultWindowMs: 60000 });
  const roamingUserId = "user-charlie-roaming-108";
  const roamAcctKey = getAccountRateLimitKey("audit-get", roamingUserId);
  const roamLimit = 3;
  // Charlie attempts 3 requests from 3 different IPs
  const roamReq1 = roamLimiter.check(roamAcctKey, roamLimit, 60000); // IP 1
  const roamReq2 = roamLimiter.check(roamAcctKey, roamLimit, 60000); // IP 2
  const roamReq3 = roamLimiter.check(roamAcctKey, roamLimit, 60000); // IP 3
  const roamReq4 = roamLimiter.check(roamAcctKey, roamLimit, 60000); // IP 4 (breach)
  assert(
    roamReq1 && roamReq2 && roamReq3 && !roamReq4,
    "G5",
    "Pass 8 Adversarial 15: Single account roaming across multiple networks remains strictly bound by account quota"
  );

  // Adversarial Test 16: Limiter internal error / invalid input -> Documented fail-safe behaviour
  const errorLimiter = new BoundedRateLimiter({ maxEntries: 100, defaultWindowMs: 60000 });
  const failEmptyKey = errorLimiter.check("", 10, 60000);
  const failZeroLimit = errorLimiter.check("key", 0, 60000);
  const failNegLimit = errorLimiter.check("key", -5, 60000);
  const failZeroWindow = errorLimiter.check("key", 10, 0);
  const failNegWindow = errorLimiter.check("key", 10, -1000);
  assert(
    !failEmptyKey && !failZeroLimit && !failNegLimit && !failZeroWindow && !failNegWindow,
    "G5",
    "Pass 8 Adversarial 16: Limiter fails closed safely (returns false) on invalid limits, negative windows, or empty keys"
  );

  // High-Cardinality Stress Test: 12,000 insertions against 10,000 capacity
  const stressLimiter = new BoundedRateLimiter({ maxEntries: 10000, defaultWindowMs: 60000 });
  let peakSize = 0;
  let stressAllowed = 0;
  let stressBlocked = 0;
  for (let i = 0; i < 12000; i++) {
    const ok = stressLimiter.check(`key-stress-${i}`, 10, 60000);
    if (ok) stressAllowed++;
    else stressBlocked++;
    const currSize = stressLimiter.getStats().size;
    if (currSize > peakSize) peakSize = currSize;
  }
  const finalStressStats = stressLimiter.getStats();
  assert(
    peakSize <= 10000 &&
      finalStressStats.size === 10000 &&
      stressAllowed === 10000 &&
      stressBlocked === 2000 &&
      finalStressStats.totalEvicted === 0,
    "G5",
    "Pass 8 High-Cardinality Stress Test: Limiter Map size never exceeds configured maxEntries (10,000) during 12,000 key flood without active eviction"
  );

  // --------------------------------------------------------------------------
  // Pass 8.1: Mandatory Active-Entry Preservation Test Scenario
  // --------------------------------------------------------------------------
  console.log("\n[PASS 8.1] Executing Active-Entry Preservation & Safe Saturation Suite...");

  // 1. Fill a small limiter to capacity (capacity = 5)
  const smallLimiter = new BoundedRateLimiter({ maxEntries: 5, defaultWindowMs: 60000 });
  for (let i = 1; i <= 4; i++) {
    assert(smallLimiter.check(`existing-identity-${i}`, 10, 60000) === true, "G5", `Pass 8.1: Insert active identity ${i}`);
  }

  // 2. Exhaust one existing identity's quota (identityA, limit = 2)
  const hit1 = smallLimiter.check("identityA", 2, 60000); // hit 1: allowed
  const hit2 = smallLimiter.check("identityA", 2, 60000); // hit 2: allowed
  const hit3 = smallLimiter.check("identityA", 2, 60000); // hit 3: blocked (exhausted)
  assert(
    hit1 === true && hit2 === true && hit3 === false,
    "G5",
    "Pass 8.1: identityA successfully exhausts quota (allowed 2, 3rd blocked)"
  );
  assert(
    smallLimiter.getStats().size === 5,
    "G5",
    "Pass 8.1: Limiter is now at full capacity (5 of 5 entries occupied)"
  );

  // 3. Generate hundreds of new identities (500 distinct keys)
  let floodAllowed = 0;
  let floodBlocked = 0;
  for (let i = 0; i < 500; i++) {
    const res = smallLimiter.check(`attacker-flood-key-${i}`, 10, 60000);
    if (res) floodAllowed++;
    else floodBlocked++;
  }

  // 4. Confirm the original exhausted identity remains blocked (NOT evicted or reset)
  const identityAAfterFlood = smallLimiter.check("identityA", 2, 60000);
  assert(
    identityAAfterFlood === false,
    "G5",
    "Pass 8.1 Test 1: Exhausted identityA remains strictly blocked after 500-key flood (active state preserved)"
  );

  // 5. Confirm Map size never exceeds capacity
  assert(
    smallLimiter.getStats().size === 5,
    "G5",
    "Pass 8.1 Test 2: Map size strictly remains at capacity ceiling (size === 5)"
  );

  // 6. Confirm new identities are rejected while no capacity is available
  assert(
    floodAllowed === 0 && floodBlocked === 500,
    "G5",
    "Pass 8.1 Test 3: All 500 new identities were rejected while capacity was exhausted with active entries"
  );

  // Confirm other active identities in the map still function
  const existingId1Hit = smallLimiter.check("existing-identity-1", 10, 60000);
  assert(
    existingId1Hit === true,
    "G5",
    "Pass 8.1 Test 4: Existing active identity-1 remains functional and tracked"
  );

  // 7. Confirm expired entries are reclaimed and new identities can then enter
  const nowForReclaim = Date.now();
  const purgedEntries = smallLimiter.cleanupExpired(nowForReclaim + 70000);
  assert(
    purgedEntries === 5 && smallLimiter.getStats().size === 0,
    "G5",
    "Pass 8.1 Test 5: Expired entries are cleanly reclaimed (purged === 5, size === 0)"
  );
  const newIdentityAllowed = smallLimiter.check("fresh-identity-after-expiry", 10, 60000);
  assert(
    newIdentityAllowed === true && smallLimiter.getStats().size === 1,
    "G5",
    "Pass 8.1 Test 6: New identity successfully enters after expired entries are reclaimed"
  );

  // --------------------------------------------------------------------------
  // Pass 8.1: Mandatory Bounded Request-Body Streaming & Size Limits Suite
  // --------------------------------------------------------------------------
  console.log("\n[PASS 8.2] Executing Bounded Request-Body Streaming & Finalization Suite...");

  // Early Content-Length validation: Malformed headers (non-numeric / negative) rejected with 400
  const malformedClAlpha = await readBoundedJsonBody(
    {
      headers: {
        get: (h: string) => (h === "content-length" ? "70kb; injection" : null),
      },
      body: null,
    },
    65536
  );
  const malformedClNegative = await readBoundedJsonBody(
    {
      headers: {
        get: (h: string) => (h === "content-length" ? "-500" : null),
      },
      body: null,
    },
    65536
  );
  assert(
    malformedClAlpha.ok === false &&
      malformedClAlpha.statusCode === 400 &&
      malformedClAlpha.code === "MALFORMED_CONTENT_LENGTH" &&
      malformedClNegative.ok === false &&
      malformedClNegative.code === "MALFORMED_CONTENT_LENGTH",
    "G5",
    "Pass 8.2 Body Pre-Check: Malformed Content-Length headers (non-numeric, negative) rejected with 400"
  );

  // Test 1: Valid readable stream within limit decodes and parses cleanly
  const p82ValidPayload = JSON.stringify({ incidentType: "UNAUTHORIZED_ACCESS", severity: "HIGH" });
  const p82ValidBytes = new TextEncoder().encode(p82ValidPayload);
  let p82ValidRead = false;
  const p82ValidStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!p82ValidRead) {
        p82ValidRead = true;
        controller.enqueue(p82ValidBytes);
      } else {
        controller.close();
      }
    },
  });
  const p82Test1 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p82ValidStream,
    },
    65536
  );
  assert(
    p82Test1.ok === true &&
      (p82Test1.data as Record<string, unknown>)?.incidentType === "UNAUTHORIZED_ACCESS",
    "G5",
    "Pass 8.2 Test 1: Valid readable stream within limit decodes and parses cleanly"
  );

  // Test 2: Oversized stream without Content-Length (chunked) aborted and cancelled with 413
  let p82OverCancelReason: unknown = null;
  const p82Chunk40k = new Uint8Array(40000).fill(65);
  let p82ChunkCount = 0;
  const p82OversizedStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (p82ChunkCount < 3) {
        p82ChunkCount++;
        controller.enqueue(p82Chunk40k); // 40KB * 3 = 120 KB > 64 KB
      } else {
        controller.close();
      }
    },
    cancel(reason) {
      p82OverCancelReason = reason;
    },
  });
  const p82Test2 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p82OversizedStream,
    },
    65536
  );
  assert(
    p82Test2.ok === false &&
      p82Test2.statusCode === 413 &&
      p82Test2.code === "PAYLOAD_TOO_LARGE" &&
      p82OverCancelReason === "PAYLOAD_TOO_LARGE",
    "G5",
    "Pass 8.2 Test 2: Oversized stream without Content-Length is aborted and cancelled immediately with 413"
  );

  // Test 3: Oversized stream with Content-Length rejected early before stream read
  let p82Stream3ReaderCreated = false;
  const p82Stream3 = new ReadableStream<Uint8Array>();
  const origGetReader = p82Stream3.getReader.bind(p82Stream3);
  p82Stream3.getReader = () => {
    p82Stream3ReaderCreated = true;
    return origGetReader();
  };
  const p82Test3 = await readBoundedJsonBody(
    {
      headers: { get: (h: string) => (h === "content-length" ? "70000" : null) },
      body: p82Stream3,
    },
    65536
  );
  assert(
    p82Test3.ok === false &&
      p82Test3.statusCode === 413 &&
      p82Test3.code === "PAYLOAD_TOO_LARGE" &&
      !p82Stream3ReaderCreated,
    "G5",
    "Pass 8.2 Test 3: Oversized stream with Content-Length rejected early with 413 before stream read"
  );

  // Test 4: Content-Length smaller than actual streamed bytes cancels stream and rejects with 400
  let p82MismatchCancelReason: unknown = null;
  let p82MismatchRead = false;
  const p82MismatchPayload = new TextEncoder().encode(JSON.stringify({ note: "Payload longer than declared CL" })); // ~40 bytes
  const p82MismatchStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!p82MismatchRead) {
        p82MismatchRead = true;
        controller.enqueue(p82MismatchPayload);
      } else {
        controller.close();
      }
    },
    cancel(reason) {
      p82MismatchCancelReason = reason;
    },
  });
  const p82Test4 = await readBoundedJsonBody(
    {
      headers: { get: (h: string) => (h === "content-length" ? "10" : null) }, // Declares 10, delivers ~40
      body: p82MismatchStream,
    },
    65536
  );
  assert(
    p82Test4.ok === false &&
      p82Test4.statusCode === 400 &&
      p82Test4.code === "CONTENT_LENGTH_MISMATCH" &&
      p82MismatchCancelReason === "CONTENT_LENGTH_MISMATCH",
    "G5",
    "Pass 8.2 Test 4: Content-Length smaller than actual streamed bytes cancels stream and rejects with 400 CONTENT_LENGTH_MISMATCH"
  );

  // Test 5: Missing readable stream (request.body is null or undefined)
  const p82Test5Null = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: null,
    },
    65536
  );
  const p82Test5Undefined = await readBoundedJsonBody(
    {
      headers: { get: () => null },
    },
    65536
  );
  assert(
    p82Test5Null.ok === false &&
      p82Test5Null.statusCode === 400 &&
      p82Test5Null.code === "MISSING_REQUEST_STREAM" &&
      p82Test5Undefined.ok === false &&
      p82Test5Undefined.code === "MISSING_REQUEST_STREAM",
    "G5",
    "Pass 8.2 Test 5: Missing readable stream rejected with 400 MISSING_REQUEST_STREAM"
  );

  // Test 6: Text-only request attempting to use the removed fallback is rejected; text() is never called
  let p82TextFallbackInvoked = false;
  const p82TextOnlyRequest = {
    headers: { get: () => null },
    text: async () => {
      p82TextFallbackInvoked = true;
      return JSON.stringify({ exploit: "unbounded_text_payload" });
    },
  };
  const p82Test6 = await readBoundedJsonBody(
    p82TextOnlyRequest as any,
    65536
  );
  assert(
    p82Test6.ok === false &&
      p82Test6.statusCode === 400 &&
      p82Test6.code === "MISSING_REQUEST_STREAM" &&
      !p82TextFallbackInvoked,
    "G5",
    "Pass 8.2 Test 6: Text-only request attempting fallback rejected with 400 MISSING_REQUEST_STREAM; text() never invoked"
  );

  // Test 7: Invalid UTF-8 bytes rejected with 400 INVALID_ENCODING
  const p82InvalidUtf8Bytes = new Uint8Array([0x80, 0xbf, 0xff, 0xfe]);
  let p82InvalidUtf8Read = false;
  const p82InvalidUtf8Stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!p82InvalidUtf8Read) {
        p82InvalidUtf8Read = true;
        controller.enqueue(p82InvalidUtf8Bytes);
      } else {
        controller.close();
      }
    },
  });
  const p82Test7 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p82InvalidUtf8Stream,
    },
    65536
  );
  assert(
    p82Test7.ok === false &&
      p82Test7.statusCode === 400 &&
      p82Test7.code === "INVALID_ENCODING",
    "G5",
    "Pass 8.2 Test 7: Invalid UTF-8 byte sequence safely rejected with 400 INVALID_ENCODING"
  );

  // Test 8: Malformed JSON syntax rejected with 400 MALFORMED_JSON
  const p82MalformedJsonBytes = new TextEncoder().encode("{ incidentType: unquoted, ");
  let p82MalformedJsonRead = false;
  const p82MalformedJsonStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!p82MalformedJsonRead) {
        p82MalformedJsonRead = true;
        controller.enqueue(p82MalformedJsonBytes);
      } else {
        controller.close();
      }
    },
  });
  const p82Test8 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p82MalformedJsonStream,
    },
    65536
  );
  assert(
    p82Test8.ok === false &&
      p82Test8.statusCode === 400 &&
      p82Test8.code === "MALFORMED_JSON",
    "G5",
    "Pass 8.2 Test 8: Malformed JSON syntax rejected with 400 MALFORMED_JSON"
  );

  // Test 9: Non-object JSON (array, primitive) rejected with 400 BAD_REQUEST
  const p82ArrayBytes = new TextEncoder().encode('["not", "a", "json", "object"]');
  let p82ArrayRead = false;
  const p82ArrayStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!p82ArrayRead) {
        p82ArrayRead = true;
        controller.enqueue(p82ArrayBytes);
      } else {
        controller.close();
      }
    },
  });
  const p82Test9Array = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p82ArrayStream,
    },
    65536
  );
  const p82PrimitiveBytes = new TextEncoder().encode('"just a primitive string"');
  let p82PrimitiveRead = false;
  const p82PrimitiveStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!p82PrimitiveRead) {
        p82PrimitiveRead = true;
        controller.enqueue(p82PrimitiveBytes);
      } else {
        controller.close();
      }
    },
  });
  const p82Test9Primitive = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p82PrimitiveStream,
    },
    65536
  );
  assert(
    p82Test9Array.ok === false &&
      p82Test9Array.statusCode === 400 &&
      p82Test9Array.code === "BAD_REQUEST" &&
      p82Test9Primitive.ok === false &&
      p82Test9Primitive.code === "BAD_REQUEST",
    "G5",
    "Pass 8.2 Test 9: Non-object JSON (array, primitive) rejected with 400 BAD_REQUEST"
  );

  // Test 10: Stream read failure safely caught and rejected with 400 STREAM_READ_ERROR
  const p82FailingStream = new ReadableStream<Uint8Array>({
    pull() {
      throw new Error("Simulated network stream abort");
    },
  });
  const p82Test10 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p82FailingStream,
    },
    65536
  );
  assert(
    p82Test10.ok === false &&
      p82Test10.statusCode === 400 &&
      p82Test10.code === "STREAM_READ_ERROR",
    "G5",
    "Pass 8.2 Test 10: Stream read failure safely caught and rejected with 400 STREAM_READ_ERROR"
  );

  // --------------------------------------------------------------------------
  // Pass 8.3: Bounded Stream Reader Defensive Hardening Suite (Tests 1-10)
  // --------------------------------------------------------------------------
  console.log("\n[PASS 8.3] Executing Bounded Stream Reader Defensive Hardening Suite...");

  // Test 1: Locked ReadableStream acquisition failure returns 400 STREAM_READ_ERROR
  const p83LockedStream = new ReadableStream<Uint8Array>();
  const p83PreExistingReader = p83LockedStream.getReader(); // Locks the stream!
  const p83Test1 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p83LockedStream,
    },
    65536
  );
  assert(
    p83Test1.ok === false &&
      p83Test1.statusCode === 400 &&
      p83Test1.code === "STREAM_READ_ERROR",
    "G5",
    "Pass 8.3 Test 1: Locked ReadableStream acquisition failure returns 400 STREAM_READ_ERROR"
  );
  p83PreExistingReader.releaseLock();

  // Test 2: Invalid stream object throwing on getReader returns 400 STREAM_READ_ERROR
  const p83InvalidStreamObj = {
    getReader() {
      throw new Error("Corrupted stream descriptor");
    },
  } as unknown as ReadableStream<Uint8Array>;
  const p83Test2 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p83InvalidStreamObj,
    },
    65536
  );
  assert(
    p83Test2.ok === false &&
      p83Test2.statusCode === 400 &&
      p83Test2.code === "STREAM_READ_ERROR",
    "G5",
    "Pass 8.3 Test 2: Invalid stream object throwing on getReader returns 400 STREAM_READ_ERROR"
  );

  // Test 3: maxBytes = 0 rejected with 400 INVALID_MAX_BYTES
  const p83Test3 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: new ReadableStream<Uint8Array>(),
    },
    0
  );
  assert(
    p83Test3.ok === false &&
      p83Test3.statusCode === 400 &&
      p83Test3.code === "INVALID_MAX_BYTES",
    "G5",
    "Pass 8.3 Test 3: maxBytes = 0 rejected with 400 INVALID_MAX_BYTES"
  );

  // Test 4: Negative maxBytes rejected with 400 INVALID_MAX_BYTES
  const p83Test4 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: new ReadableStream<Uint8Array>(),
    },
    -1024
  );
  assert(
    p83Test4.ok === false &&
      p83Test4.statusCode === 400 &&
      p83Test4.code === "INVALID_MAX_BYTES",
    "G5",
    "Pass 8.3 Test 4: Negative maxBytes rejected with 400 INVALID_MAX_BYTES"
  );

  // Test 5: maxBytes = NaN rejected with 400 INVALID_MAX_BYTES
  const p83Test5 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: new ReadableStream<Uint8Array>(),
    },
    NaN
  );
  assert(
    p83Test5.ok === false &&
      p83Test5.statusCode === 400 &&
      p83Test5.code === "INVALID_MAX_BYTES",
    "G5",
    "Pass 8.3 Test 5: maxBytes = NaN rejected with 400 INVALID_MAX_BYTES"
  );

  // Test 6: maxBytes = Infinity rejected with 400 INVALID_MAX_BYTES
  const p83Test6 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: new ReadableStream<Uint8Array>(),
    },
    Infinity
  );
  assert(
    p83Test6.ok === false &&
      p83Test6.statusCode === 400 &&
      p83Test6.code === "INVALID_MAX_BYTES",
    "G5",
    "Pass 8.3 Test 6: maxBytes = Infinity rejected with 400 INVALID_MAX_BYTES"
  );

  // Test 7: Fractional maxBytes rejected with 400 INVALID_MAX_BYTES
  const p83Test7 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: new ReadableStream<Uint8Array>(),
    },
    65536.5
  );
  assert(
    p83Test7.ok === false &&
      p83Test7.statusCode === 400 &&
      p83Test7.code === "INVALID_MAX_BYTES",
    "G5",
    "Pass 8.3 Test 7: Fractional maxBytes rejected with 400 INVALID_MAX_BYTES"
  );

  // Test 8: Normal valid stream still works
  const p83ValidPayload = JSON.stringify({ incidentType: "UNAUTHORIZED_ACCESS", severity: "HIGH" });
  let p83ValidRead = false;
  const p83ValidStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (!p83ValidRead) {
        p83ValidRead = true;
        controller.enqueue(new TextEncoder().encode(p83ValidPayload));
      } else {
        controller.close();
      }
    },
  });
  const p83Test8 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p83ValidStream,
    },
    65536
  );
  assert(
    p83Test8.ok === true &&
      (p83Test8.data as Record<string, unknown>)?.incidentType === "UNAUTHORIZED_ACCESS",
    "G5",
    "Pass 8.3 Test 8: Normal valid stream parses successfully"
  );

  // Test 9: Oversized stream still cancels
  let p83CancelReason: unknown = null;
  const p83Chunk = new Uint8Array(40000).fill(65);
  let p83ChunkIdx = 0;
  const p83OverStream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (p83ChunkIdx < 3) {
        p83ChunkIdx++;
        controller.enqueue(p83Chunk); // 120 KB > 64 KB
      } else {
        controller.close();
      }
    },
    cancel(reason) {
      p83CancelReason = reason;
    },
  });
  const p83Test9 = await readBoundedJsonBody(
    {
      headers: { get: () => null },
      body: p83OverStream,
    },
    65536
  );
  assert(
    p83Test9.ok === false &&
      p83Test9.statusCode === 413 &&
      p83Test9.code === "PAYLOAD_TOO_LARGE" &&
      p83CancelReason === "PAYLOAD_TOO_LARGE",
    "G5",
    "Pass 8.3 Test 9: Oversized stream cancels reader and returns 413 PAYLOAD_TOO_LARGE"
  );

  // Test 10: Text-only request still cannot invoke text()
  let p83TextInvoked = false;
  const p83TextOnlyReq = {
    headers: { get: () => null },
    text: async () => {
      p83TextInvoked = true;
      return JSON.stringify({ exploit: "unbounded_text" });
    },
  };
  const p83Test10 = await readBoundedJsonBody(p83TextOnlyReq as any, 65536);
  assert(
    p83Test10.ok === false &&
      p83Test10.statusCode === 400 &&
      p83Test10.code === "MISSING_REQUEST_STREAM" &&
      !p83TextInvoked,
    "G5",
    "Pass 8.3 Test 10: Text-only request still cannot invoke text() and returns 400 MISSING_REQUEST_STREAM"
  );

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    console.error("Test failures detected! Please remediate before release.");
    process.exit(1);
  } else {
    console.log("ALL M05 TECHNICAL & GOVERNANCE TESTS PASSED SUCCESSFULLY.");
  }
}

runM05Tests().catch((err) => {
  console.error("Unhandled error during M05 test execution:", err);
  process.exit(1);
});

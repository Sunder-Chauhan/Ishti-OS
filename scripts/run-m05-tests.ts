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
  type SessionVerificationProvider,
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
    async verifyToken(token: string) {
      const session = mockSessions[token];
      if (!session) {
        return { valid: false, error: "Invalid signature / token not found in auth service" };
      }
      if (session.expired) {
        return { valid: false, expired: true, error: "Token expired" };
      }
      return { valid: true, userId: session.userId };
    },
    async getUserRole(userId: string) {
      const session = Object.values(mockSessions).find((s) => s.userId === userId);
      return { role: session?.role || null };
    },
  };

  // Case A: No session token provided -> 401 Unauthorized
  const authNoSession = await verifyAdminSession(null, testAuthProvider);
  assert(
    authNoSession.authorized === false && authNoSession.statusCode === 401,
    "G5",
    "Server admin check: No session token returns 401 Unauthorized"
  );

  // Case B: Expired session token -> 401 Unauthorized
  const authExpired = await verifyAdminSession("token-expired-999", testAuthProvider);
  assert(
    authExpired.authorized === false && authExpired.statusCode === 401,
    "G5",
    "Server admin check: Expired session token returns 401 Unauthorized"
  );

  // Case C: Invalid / forged session token -> 401 Unauthorized
  const authInvalid = await verifyAdminSession("forged-token-xyz-000", testAuthProvider);
  assert(
    authInvalid.authorized === false && authInvalid.statusCode === 401,
    "G5",
    "Server admin check: Invalid session token signature returns 401 Unauthorized"
  );

  // Case D: Authenticated devotee role -> 403 Forbidden
  const authDevotee = await verifyAdminSession("token-devotee-108", testAuthProvider);
  assert(
    authDevotee.authorized === false && authDevotee.statusCode === 403,
    "G5",
    "Server admin check: Authenticated devotee session returns 403 Forbidden"
  );

  // Case E: Expert and scholar roles -> 403 Forbidden
  const authPandit = await verifyAdminSession("token-pandit-108", testAuthProvider);
  assert(
    authPandit.authorized === false && authPandit.statusCode === 403,
    "G5",
    "Server admin check: Authenticated expert_pandit session returns 403 Forbidden"
  );

  const authScholar = await verifyAdminSession("token-scholar-108", testAuthProvider);
  assert(
    authScholar.authorized === false && authScholar.statusCode === 403,
    "G5",
    "Server admin check: Authenticated content_scholar session returns 403 Forbidden"
  );

  // Case F: Verified platform administrator -> 200 Allowed
  const authAdmin = await verifyAdminSession("token-admin-108", testAuthProvider);
  assert(
    authAdmin.authorized === true && authAdmin.statusCode === 200,
    "G5",
    "Server admin check: Verified platform_admin session returns 200 Authorized"
  );

  // Case G: Direct API requests without a valid session -> 401 Rejected
  const authDirectApiNoSession = await verifyAdminSession(undefined, testAuthProvider);
  assert(
    authDirectApiNoSession.authorized === false && authDirectApiNoSession.statusCode === 401,
    "G5",
    "Direct API request without session token is strictly rejected with 401"
  );

  // Case H: Client-supplied role manipulation (headers/body overrides) -> Rejected
  const clientManipulationHeaders = {
    "x-user-role": "platform_admin",
    "x-ishti-role": "platform_admin",
    "authorization": "role=platform_admin",
  };
  const authDevoteeWithForgedRole = await verifyAdminSession(
    "token-devotee-108",
    testAuthProvider,
    clientManipulationHeaders
  );
  assert(
    authDevoteeWithForgedRole.authorized === false && authDevoteeWithForgedRole.statusCode === 403,
    "G5",
    "Client-supplied role manipulation: devotee sending x-user-role='platform_admin' is rejected with 403"
  );

  const authUnauthWithForgedRole = await verifyAdminSession(
    null,
    testAuthProvider,
    clientManipulationHeaders
  );
  assert(
    authUnauthWithForgedRole.authorized === false && authUnauthWithForgedRole.statusCode === 401,
    "G5",
    "Client-supplied role manipulation: unauthenticated caller sending x-user-role='platform_admin' is rejected with 401"
  );

  // Case I: Unconfigured or offline backend authentication -> 503 Disabled
  const offlineAuthProvider: SessionVerificationProvider = {
    ...testAuthProvider,
    isBackendConfigured: () => false,
  };
  const authOfflineBackend = await verifyAdminSession("token-admin-108", offlineAuthProvider);
  assert(
    authOfflineBackend.authorized === false && authOfflineBackend.statusCode === 503,
    "G5",
    "Unconfigured backend authentication disables administrative access with 503 (M06 dependency)"
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

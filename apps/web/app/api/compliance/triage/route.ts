import { NextResponse, type NextRequest } from "next/server";
import {
  verifyServerAdminSession,
  verifyCsrfOrigin,
  checkComplianceRateLimit,
  getClientIp,
  getNetworkRateLimitKey,
  getAccountRateLimitKey,
  readBoundedJsonBody,
} from "../../../../lib/compliance/compliance-server";
import { triageSecurityIncident } from "../../../../lib/compliance/security-governance";

const MAX_PAYLOAD_BYTES = 65536; // 64 KB limit

const ALLOWED_SEVERITIES = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

/**
 * Protected Security Incident Triage Endpoint (Server-Side Authorization Boundary)
 *
 * Security Invariants:
 * 1. Independently verifies the session and 'platform_admin' role in a single context.
 * 2. Unauthorized callers cannot trigger incident assessment or CERT-In reporting analysis.
 * 3. Client-supplied role claims are strictly ignored.
 * 4. CSRF protection on mutations.
 * 5. Input payload size and schema validation enforced via bounded streaming body consumption.
 * 6. Layered rate limiting enforced:
 *    - Layer 1: Network-level pre-auth rate limiting (30 req/min).
 *    - Layer 2: Account-level post-auth rate limiting (10 req/min).
 */

export async function POST(request: NextRequest) {
  // 1. Early Content-Length validation if header is present
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && contentLength !== undefined && contentLength.trim() !== "") {
    const trimmed = contentLength.trim();
    if (!/^\d+$/.test(trimmed)) {
      return NextResponse.json(
        { error: "Malformed Content-Length header.", code: "MALFORMED_CONTENT_LENGTH" },
        { status: 400 }
      );
    }
    const parsedLength = parseInt(trimmed, 10);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      return NextResponse.json(
        { error: "Malformed Content-Length header.", code: "MALFORMED_CONTENT_LENGTH" },
        { status: 400 }
      );
    }
    if (parsedLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large. Maximum allowed size is 64 KB.", code: "PAYLOAD_TOO_LARGE" },
        { status: 413 }
      );
    }
  }

  // 2. CSRF validation for cookie-authenticated mutations
  const csrf = verifyCsrfOrigin(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: `CSRF_BLOCKED: ${csrf.reason}`, code: "CSRF_VIOLATION" },
      { status: 403 }
    );
  }

  // 3. Layer 1: Network-level pre-auth rate limiting
  const networkKey = getNetworkRateLimitKey("triage-post", request.headers);
  if (!checkComplianceRateLimit(networkKey, 30, 60000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  // 4. Server-side session & role verification
  const auth = await verifyServerAdminSession(request);

  if (!auth.authorized) {
    return NextResponse.json(
      {
        error: auth.error,
        code: auth.code || (auth.statusCode === 401 ? "UNAUTHENTICATED" : auth.statusCode === 403 ? "FORBIDDEN" : "SERVICE_UNAVAILABLE"),
      },
      { status: auth.statusCode }
    );
  }

  // 5. Layer 2: Account-level post-auth rate limiting (per verified admin account)
  if (auth.user?.id) {
    const accountKey = getAccountRateLimitKey("triage-post", auth.user.id);
    if (!checkComplianceRateLimit(accountKey, 10, 60000)) {
      return NextResponse.json(
        { error: "Account rate limit exceeded. Please try again later.", code: "ACCOUNT_RATE_LIMITED" },
        { status: 429 }
      );
    }
  }

  // 6. Bounded streaming body consumption & validation (max 64 KB, aborts stream early on overflow)
  const bodyResult = await readBoundedJsonBody<Record<string, unknown>>(request, MAX_PAYLOAD_BYTES);
  if (!bodyResult.ok || !bodyResult.data) {
    return NextResponse.json(
      { error: bodyResult.error || "Bad request", code: bodyResult.code || "BAD_REQUEST" },
      { status: bodyResult.statusCode || 400 }
    );
  }
  const body = bodyResult.data;

  // Field validation
  const incidentType = typeof body.incidentType === "string" && body.incidentType.length <= 100
    ? body.incidentType
    : "UNAUTHORIZED_ACCESS_ATTEMPT";

  let affectedSystems = ["auth_cluster"];
  if (Array.isArray(body.affectedSystems)) {
    if (body.affectedSystems.length > 20) {
      return NextResponse.json(
        { error: "Validation error: affectedSystems exceeds maximum limit of 20 items.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    affectedSystems = body.affectedSystems
      .filter((s): s is string => typeof s === "string" && s.length <= 100);
  }

  const rawSeverity = typeof body.severity === "string" ? body.severity.toUpperCase() : "HIGH";
  const severity = ALLOWED_SEVERITIES.has(rawSeverity) ? (rawSeverity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") : "HIGH";

  const isPersonalDataExposed = Boolean(body.isPersonalDataExposed);
  const isRansomwareOrSystemic = Boolean(body.isRansomwareOrSystemic);

  const summary = typeof body.summary === "string" && body.summary.length <= 1000
    ? body.summary
    : "Security triage assessment";

  const triageResult = triageSecurityIncident({
    incidentType,
    affectedSystems,
    severity,
    isPersonalDataExposed,
    isRansomwareOrSystemic,
    summary,
  });

  return NextResponse.json({
    triage: triageResult,
    verifiedAdminId: auth.user?.id,
    isStatutoryFiling: false,
    disclaimer:
      "INTERNAL_PRELIMINARY_TRIAGE_SIMULATION_ONLY — This output does NOT constitute an official statutory notification to CERT-In or the Data Protection Board of India. Statutory incident reports must be formally filed via CERT-In incident reporting channels (incident@cert-in.org.in) by authorized legal and security officers.",
  });
}

export async function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

export async function PUT() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

export async function PATCH() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

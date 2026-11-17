import { NextResponse, type NextRequest } from "next/server";
import {
  verifyServerAdminSession,
  verifyCsrfOrigin,
  checkComplianceRateLimit,
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
 * 5. Input payload size and schema validation enforced.
 * 6. Rate limited to prevent denial-of-service.
 */

export async function POST(request: NextRequest) {
  // 1. Content-Length payload size check
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: "Payload too large. Maximum allowed size is 64 KB.", code: "PAYLOAD_TOO_LARGE" },
      { status: 413 }
    );
  }

  // 2. CSRF validation for cookie-authenticated mutations
  const csrf = verifyCsrfOrigin(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: `CSRF_BLOCKED: ${csrf.reason}`, code: "CSRF_VIOLATION" },
      { status: 403 }
    );
  }

  // 3. Rate limiting check
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  if (!checkComplianceRateLimit(`triage-post:${ip}`, 10, 60000)) {
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

  // 5. Schema validation & safe JSON parsing
  let body: Record<string, unknown>;
  try {
    const rawText = await request.text();
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large. Maximum allowed size is 64 KB.", code: "PAYLOAD_TOO_LARGE" },
        { status: 413 }
      );
    }
    body = JSON.parse(rawText);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Malformed request body. JSON object expected.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body for incident triage.", code: "MALFORMED_JSON" },
      { status: 400 }
    );
  }

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

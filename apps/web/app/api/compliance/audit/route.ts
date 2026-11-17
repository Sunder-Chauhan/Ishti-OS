import { NextResponse, type NextRequest } from "next/server";
import {
  verifyServerAdminSession,
  verifyCsrfOrigin,
  checkComplianceRateLimit,
} from "../../../../lib/compliance/compliance-server";
import { getAuditLedger, verifyLedgerIntegrity } from "../../../../lib/compliance/audit-trail";

/**
 * Protected Compliance Audit Endpoint (Server-Side Authorization Boundary)
 *
 * Security Invariants:
 * 1. Independently verifies the session and 'platform_admin' role in a single trusted context.
 * 2. Unauthorized callers cannot read audit data via direct HTTP requests.
 * 3. Client-supplied role claims (headers, cookies, body) are strictly ignored.
 * 4. Rate limiting enforced (30 req/min) to prevent brute-force or resource exhaustion.
 * 5. CSRF origin verification on mutations.
 * 6. Disallows unauthorized HTTP methods with 405.
 * 7. When backend auth is unavailable, access is disabled (503) rather than bypassed.
 */

export async function GET(request: NextRequest) {
  // 1. Rate limiting check
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  if (!checkComplianceRateLimit(`audit-get:${ip}`, 30, 60000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  // 2. Server-side session & role verification
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

  // 3. Verified platform administrator: read ledger
  const ledger = getAuditLedger();
  const isValid = await verifyLedgerIntegrity(ledger);

  return NextResponse.json({
    ledger,
    isValid,
    verifiedAdminId: auth.user?.id,
  });
}

export async function POST(request: NextRequest) {
  // 1. CSRF validation for cookie-authenticated mutations
  const csrf = verifyCsrfOrigin(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: `CSRF_BLOCKED: ${csrf.reason}`, code: "CSRF_VIOLATION" },
      { status: 403 }
    );
  }

  // 2. Rate limiting check
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  if (!checkComplianceRateLimit(`audit-post:${ip}`, 10, 60000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  // 3. Server-side session & role verification
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

  // Privileged mutating audit actions are disabled pending Milestone M06 WORM storage
  return NextResponse.json(
    {
      error: "Administrative audit mutation is disabled. Authoritative WORM ledger persistence requires Milestone M06.",
      code: "NOT_IMPLEMENTED",
    },
    { status: 501 }
  );
}

export async function PUT() {
  return new NextResponse(null, { status: 405, headers: { Allow: "GET, POST" } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: "GET, POST" } });
}

export async function PATCH() {
  return new NextResponse(null, { status: 405, headers: { Allow: "GET, POST" } });
}

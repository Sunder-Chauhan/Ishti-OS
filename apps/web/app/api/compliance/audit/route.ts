import { NextResponse, type NextRequest } from "next/server";
import { verifyServerAdminSession } from "../../../../lib/compliance/compliance-server";
import { getAuditLedger, verifyLedgerIntegrity } from "../../../../lib/compliance/audit-trail";

/**
 * Protected Compliance Audit Endpoint (Server-Side Authorization Boundary)
 *
 * Security Invariants:
 * 1. Independently verifies the session and 'platform_admin' role.
 * 2. Unauthorized callers cannot read audit data via direct HTTP requests.
 * 3. Client-supplied role claims (headers, cookies, body) are strictly ignored.
 * 4. When backend auth is unavailable, access is disabled rather than bypassed.
 */

export async function GET(request: NextRequest) {
  const auth = await verifyServerAdminSession(request);

  if (!auth.authorized) {
    return NextResponse.json(
      {
        error: auth.error,
        code: auth.statusCode === 401 ? "UNAUTHENTICATED" : auth.statusCode === 403 ? "FORBIDDEN" : "SERVICE_UNAVAILABLE",
      },
      { status: auth.statusCode }
    );
  }

  // Verified platform administrator
  const ledger = getAuditLedger();
  const isValid = await verifyLedgerIntegrity(ledger);

  return NextResponse.json({
    ledger,
    isValid,
    verifiedAdminId: auth.user?.id,
  });
}

export async function POST(request: NextRequest) {
  const auth = await verifyServerAdminSession(request);

  if (!auth.authorized) {
    return NextResponse.json(
      {
        error: auth.error,
        code: auth.statusCode === 401 ? "UNAUTHENTICATED" : auth.statusCode === 403 ? "FORBIDDEN" : "SERVICE_UNAVAILABLE",
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

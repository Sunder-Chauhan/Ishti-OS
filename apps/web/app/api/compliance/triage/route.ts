import { NextResponse, type NextRequest } from "next/server";
import { verifyServerAdminSession } from "../../../../lib/compliance/compliance-server";
import { triageSecurityIncident } from "../../../../lib/compliance/security-governance";

/**
 * Protected Security Incident Triage Endpoint (Server-Side Authorization Boundary)
 *
 * Security Invariants:
 * 1. Independently verifies the session and 'platform_admin' role.
 * 2. Unauthorized callers cannot trigger incident assessment or CERT-In reporting analysis.
 * 3. Client-supplied role claims are strictly ignored.
 */

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

  // Verified platform administrator
  try {
    const body = await request.json();

    const incidentType = body.incidentType || "UNAUTHORIZED_ACCESS_ATTEMPT";
    const affectedSystems = Array.isArray(body.affectedSystems) ? body.affectedSystems : ["auth_cluster"];
    const severity = body.severity || "HIGH";
    const isPersonalDataExposed = Boolean(body.isPersonalDataExposed);
    const isRansomwareOrSystemic = Boolean(body.isRansomwareOrSystemic);
    const summary = body.summary || "Security triage assessment";

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
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Invalid JSON request body for incident triage." },
      { status: 400 }
    );
  }
}

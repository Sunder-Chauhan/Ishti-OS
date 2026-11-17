import type { SecurityIncidentTriage, IncidentSeverity } from "@spiritual-os/types";

/**
 * ISHTI Security Incident Triage & Regulatory Breach Notification Engine
 *
 * Grounded in:
 * - CERT-In Cyber Security Directions (April 2022): Mandatory 6-hour reporting window
 *   for qualifying cybersecurity incidents.
 * - Digital Personal Data Protection Act, 2023 §8(6): In the event of a personal data breach,
 *   the Data Fiduciary shall give the Data Protection Board and affected Data Principals intimation.
 * - ISO/IEC 27001:2022 Information Security Management Standards.
 */

export interface AssessIncidentInput {
  incidentType: string;
  affectedSystems: string[];
  severity: IncidentSeverity;
  isPersonalDataExposed: boolean;
  isRansomwareOrSystemic: boolean;
  summary: string;
}

export function triageSecurityIncident(input: AssessIncidentInput): SecurityIncidentTriage {
  const now = new Date();
  const detectedAt = now.toISOString();

  // CERT-In 6-hour reporting mandate applies to high/critical incidents, systemic attacks, or unauthorized DB access
  const certInNotificationRequired =
    input.severity === "CRITICAL" ||
    input.severity === "HIGH" ||
    input.isRansomwareOrSystemic;

  // DPDP §8(6) notification applies whenever personal data is compromised
  const dpdpBreachNoticeRequired = input.isPersonalDataExposed;

  // CERT-In strict 6-hour deadline calculation
  const deadlineHours = certInNotificationRequired ? 6 : 24;
  const containmentDeadline = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000).toISOString();

  const incidentId = `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  return {
    incidentId,
    severity: input.severity,
    affectedSystems: input.affectedSystems,
    certInNotificationRequired,
    dpdpBreachNoticeRequired,
    containmentStatus: "ANALYZING",
    detectedAt,
    containmentDeadline,
    summary: input.summary,
  };
}

export const RECOGNIZED_SECURITY_POSTURE = {
  encryptionStandard: "Server-side AES-256-GCM envelope encryption with tenant-bound authentication tags",
  databaseIsolation: "PostgreSQL Row-Level Security (RLS) with non-recursive security definer functions",
  transportSecurity: "TLS 1.3 Strict Transport Security (HSTS) with forward secrecy",
  rateLimiting: "PostgreSQL 64-bit advisory locking sliding-window with HMAC-SHA-256 IP anonymization",
  certInReportingSla: "6 Hours from confirmation of qualifying cybersecurity incident",
  itRulesAcknowledgementSla: "24 Hours from receipt of grievance",
  itRulesResolutionSla: "7 Days from receipt of grievance",
};

/**
 * ISHTI Statutory Compliance Operations & Security Governance Types
 *
 * Grounded in:
 * - Information Technology (Intermediary Guidelines) Rules, 2021 (amended Feb 2026: 24h ack, 7d resolve)
 * - IT Rules Rule 3A (Grievance Appellate Committee - GAC)
 * - Digital Personal Data Protection Act, 2023 §13 (Grievance) & §8(6) (Breach Notification)
 * - CERT-In Directions (April 2022) Cyber Incident Reporting
 */

export type GrievanceCategory =
  | "content_takedown"         // Rule 3(1)(d) 36h order
  | "intermediary_complaint"    // Rule 3(2) general complaint: 24h ack, 7d resolve
  | "data_protection"          // DPDP Act 2023 §13
  | "expert_conduct"           // Pandit / Acharya conduct
  | "commerce_billing"         // Payment / refund dispute
  | "cybersecurity_incident";  // Security vulnerability report

export type GrievanceStatus =
  | "ACKNOWLEDGED"
  | "INVESTIGATING"
  | "EVIDENCE_GATHERING"
  | "RESOLVED"
  | "APPEALED_TO_GAC"
  | "CLOSED";

export interface GrievanceTicket {
  id: string;
  ticketNumber: string;
  category: GrievanceCategory;
  status: GrievanceStatus;
  complainantName: string;
  complainantEmail: string;
  subject: string;
  description: string;
  submittedAt: string;
  acknowledgedAt: string;
  resolutionDeadline: string; // 7 days from submission
  resolvedAt?: string;
  resolutionSummary?: string;
  officerDesignation: string; // [LEGAL_REVIEW_REQUIRED: Statutory Grievance Officer]
  gacAppealEligible: boolean;
  isPrototype?: boolean;
  prototypeNotice?: string;
}

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SecurityIncidentTriage {
  incidentId: string;
  severity: IncidentSeverity;
  affectedSystems: string[];
  certInNotificationRequired: boolean;
  dpdpBreachNoticeRequired: boolean;
  containmentStatus: "ANALYZING" | "CONTAINED" | "REMEDIATED" | "CLOSED";
  detectedAt: string;
  containmentDeadline: string;
  summary: string;
}

export interface AuditLogEntry {
  index: number;
  timestamp: string;
  eventType: string;
  actor: string;
  payloadHash: string;
  previousHash: string;
  entryHash: string;
}

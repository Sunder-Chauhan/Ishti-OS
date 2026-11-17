import type {
  GrievanceTicket,
  GrievanceCategory,
  GrievanceStatus,
} from "@spiritual-os/types";

export const LOCAL_GRIEVANCE_KEY = "ishti_grievance_tickets_v1";

export const STATUTORY_OFFICER_PLACEHOLDER =
  "[LEGAL_REVIEW_REQUIRED: Statutory Grievance Officer & Data Protection Officer, ISHTI Platform Operator]";

export interface CreateGrievanceInput {
  category: GrievanceCategory;
  complainantName: string;
  complainantEmail: string;
  subject: string;
  description: string;
}

const SEED_GRIEVANCES: GrievanceTicket[] = [
  {
    id: "grv-seed-001",
    ticketNumber: "ISHTI-GRV-2026-1001",
    category: "data_protection",
    status: "RESOLVED",
    complainantName: "Vedic Scholar Reviewer",
    complainantEmail: "scholar@ishti.in",
    subject: "Verification of Birth Coordinate Envelope Encryption",
    description: "Inquiry regarding the technical implementation of AES-256-GCM envelope encryption for Kundli records.",
    submittedAt: "2026-11-16T10:00:00Z",
    acknowledgedAt: "2026-11-16T10:05:00Z",
    resolutionDeadline: "2026-11-23T10:00:00Z",
    resolvedAt: "2026-11-17T08:30:00Z",
    resolutionSummary: "Confirmed server-side AES-256-GCM envelope encryption with tenant-bound authentication tags.",
    officerDesignation: STATUTORY_OFFICER_PLACEHOLDER,
    gacAppealEligible: true,
  },
];

// In-memory cache for SSR, test environments, and server runtime fallbacks
const inMemoryGrievances: GrievanceTicket[] = [...SEED_GRIEVANCES];

export function createGrievanceTicket(input: CreateGrievanceInput): GrievanceTicket {
  const now = new Date();
  const submittedAt = now.toISOString();

  // Acknowledged within 24 hours (simulated immediate automated statutory acknowledgement)
  const acknowledgedAt = now.toISOString();

  // Resolution SLA: Exactly 7 days from submission under amended IT Rules (Feb 2026)
  const deadlineDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const resolutionDeadline = deadlineDate.toISOString();

  const ticketNumber = `ISHTI-GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const id = `grv-${Date.now()}`;

  const ticket: GrievanceTicket = {
    id,
    ticketNumber,
    category: input.category,
    status: "ACKNOWLEDGED",
    complainantName: input.complainantName,
    complainantEmail: input.complainantEmail,
    subject: input.subject,
    description: input.description,
    submittedAt,
    acknowledgedAt,
    resolutionDeadline,
    officerDesignation: STATUTORY_OFFICER_PLACEHOLDER,
    gacAppealEligible: true,
  };

  inMemoryGrievances.unshift(ticket);

  if (typeof window !== "undefined") {
    try {
      const existing = localStorage.getItem(LOCAL_GRIEVANCE_KEY);
      const list: GrievanceTicket[] = existing ? JSON.parse(existing) : [];
      list.unshift(ticket);
      localStorage.setItem(LOCAL_GRIEVANCE_KEY, JSON.stringify(list));
    } catch {
      // Local session fallback
    }
  }

  return ticket;
}

export function getGrievanceByTicketNumber(ticketNumber: string): GrievanceTicket | undefined {
  const normalized = ticketNumber.trim().toUpperCase();
  const list = getAllGrievances();
  return list.find((t) => t.ticketNumber.toUpperCase() === normalized);
}

export function getAllGrievances(): GrievanceTicket[] {
  if (typeof window === "undefined") {
    return inMemoryGrievances;
  }

  try {
    const raw = localStorage.getItem(LOCAL_GRIEVANCE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_GRIEVANCE_KEY, JSON.stringify(SEED_GRIEVANCES));
      return [...SEED_GRIEVANCES];
    }
    return JSON.parse(raw);
  } catch {
    return inMemoryGrievances;
  }
}

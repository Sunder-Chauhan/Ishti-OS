import type {
  GrievanceTicket,
  GrievanceCategory,
  GrievanceStatus,
} from "@spiritual-os/types";

/**
 * ISHTI Statutory Grievance Redressal Service (Prototype Demonstration)
 *
 * NOTE: This service provides a client-side prototype demonstration of the
 * statutory grievance redressal workflow mandated by Rule 3(2) of the Information
 * Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021
 * (as amended February 2026) and §13 of the DPDP Act, 2023.
 *
 * Tickets staged in this client-side store are NOT transmitted to a statutory officer
 * or backend database. Formal grievance redressal, email notifications, and database
 * persistence will be enabled in Milestone M06 upon backend service deployment.
 */

export const LOCAL_GRIEVANCE_KEY = "ishti_grievance_tickets_prototype_v1";

export const STATUTORY_OFFICER_PLACEHOLDER =
  "[LEGAL_REVIEW_REQUIRED: Statutory Grievance Officer & Data Protection Officer, ISHTI Platform Operator]";

export interface CreateGrievanceInput {
  category: GrievanceCategory;
  complainantName: string;
  complainantEmail: string;
  subject: string;
  description: string;
}

// In-memory prototype store for SSR and test execution (zero pre-seeded fake complaints)
const prototypeTicketStore: GrievanceTicket[] = [];

export function createGrievanceTicket(input: CreateGrievanceInput): GrievanceTicket {
  const now = new Date();
  const submittedAt = now.toISOString();

  // Simulated immediate automated statutory acknowledgement timestamp for UI display
  const acknowledgedAt = now.toISOString();

  // Statutory resolution SLA: Exactly 7 days from submission under amended IT Rules (Feb 2026)
  const deadlineDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const resolutionDeadline = deadlineDate.toISOString();

  const ticketNumber = `ISHTI-GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const id = `grv-proto-${Date.now()}`;

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
    isPrototype: true,
    prototypeNotice:
      "PROTOTYPE DEMONSTRATION: This ticket is recorded in local browser session memory for prototype workflow demonstration. Official legal transmission to the Statutory Grievance Officer requires backend service deployment (M06).",
  };

  prototypeTicketStore.unshift(ticket);

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
    return prototypeTicketStore;
  }

  try {
    const raw = localStorage.getItem(LOCAL_GRIEVANCE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return prototypeTicketStore;
  }
}

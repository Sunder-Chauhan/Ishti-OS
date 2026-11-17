import { calculateRefundEligibility, type CalculateRefundOptions } from "./cancellation-calculator";
import type {
  RefundRequestRecord,
  RefundRequestStatus,
  CurrencyCode,
  ServiceClassification,
} from "@spiritual-os/types";

/**
 * ISHTI Commerce Trust & Refund Service (Prototype Simulation)
 *
 * NOTE: This service calculates refund entitlements under ISHTI's proposed
 * commercial cancellation policy. Requests logged here are stored in local
 * browser session storage for demonstration purposes only.
 * No actual financial settlement or payment aggregator API call (e.g. Razorpay,
 * Stripe) has occurred. Live transaction execution will be implemented in
 * Milestone M06 upon payment gateway integration.
 */

export const LOCAL_REFUND_KEY = "ishti_refund_requests_prototype_v1";

export function getEstimatedSettlementTimeline(currency: CurrencyCode): string {
  if (currency === "INR") {
    return "3 to 5 business days (UPI / Domestic Net Banking / Cards)";
  }
  return "7 to 10 business days (International Cards / Multi-Currency Network)";
}

export function submitRefundRequest(
  options: CalculateRefundOptions & {
    bookingReference: string;
    userId: string;
    disputeNotes?: string;
  }
): RefundRequestRecord {
  const calculation = calculateRefundEligibility(options);
  const now = new Date().toISOString();
  const requestId = `ref-sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const status: RefundRequestStatus = calculation.canCancel ? "SUBMITTED" : "REJECTED";

  const record: RefundRequestRecord = {
    id: requestId,
    bookingReference: options.bookingReference,
    userId: options.userId,
    serviceType: options.serviceType,
    originalAmount: options.originalAmount,
    currency: options.currency,
    status,
    submittedAt: now,
    calculation,
    disputeNotes: options.disputeNotes,
    estimatedSettlementDays: getEstimatedSettlementTimeline(options.currency),
    isSimulation: true,
    simulationDisclaimer:
      "COMMERCE SIMULATION: This calculation illustrates refund entitlement under proposed commercial policy. No transaction has been submitted to payment aggregators.",
  };

  if (typeof window !== "undefined") {
    try {
      const existing = localStorage.getItem(LOCAL_REFUND_KEY);
      const list: RefundRequestRecord[] = existing ? JSON.parse(existing) : [];
      list.unshift(record);
      localStorage.setItem(LOCAL_REFUND_KEY, JSON.stringify(list));
    } catch {
      // Session fallback
    }
  }

  return record;
}

export function getStoredRefundRequests(): RefundRequestRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = localStorage.getItem(LOCAL_REFUND_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch {
    return [];
  }
}

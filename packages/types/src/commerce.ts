/**
 * ISHTI Commerce Trust, Multi-Currency & Refund Governance Types
 *
 * Grounded in:
 * - Consumer Protection (E-Commerce) Rules, 2020 (India)
 * - EU Consumer Rights Directive 2011/83/EU Article 16(m)
 * - Payment and Settlement Systems Act, 2007
 */

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | "SGD";

export type ServiceClassification =
  | "live_consultation"
  | "online_puja"
  | "digital_audio_scripture"
  | "pandit_no_show";

export type RefundRequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSED"
  | "FAILED";

export interface CancellationTier {
  id: string;
  minHoursBeforeStart: number;
  maxHoursBeforeStart: number | null;
  refundPercentage: number;
  gatewayFeeDeductionPct: number;
  description: string;
}

export interface RefundCalculation {
  originalAmount: number;
  currency: CurrencyCode;
  serviceType: ServiceClassification;
  hoursUntilStart: number;
  canCancel: boolean;
  refundPercentage: number;
  grossRefundAmount: number;
  gatewayFeeDeducted: number;
  netRefundAmount: number;
  tierDescription: string;
  isDigitalWaiverApplicable: boolean;
  reasonMessage: string;
}

export interface RefundRequestRecord {
  id: string;
  bookingReference: string;
  userId: string;
  serviceType: ServiceClassification;
  originalAmount: number;
  currency: CurrencyCode;
  status: RefundRequestStatus;
  submittedAt: string;
  resolvedAt?: string;
  calculation: RefundCalculation;
  disputeNotes?: string;
  estimatedSettlementDays: string;
  isSimulation?: boolean;
  simulationDisclaimer?: string;
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  defaultTaxPct: number;
}

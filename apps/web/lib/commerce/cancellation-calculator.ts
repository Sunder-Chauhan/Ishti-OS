import type {
  CurrencyCode,
  ServiceClassification,
  RefundCalculation,
  CancellationTier,
} from "@spiritual-os/types";

/**
 * Proposed cancellation tiers for consultations & pujas.
 * [PROPOSED COMMERCIAL POLICY — SUBJECT TO FORMAL OPERATOR & LEGAL REVIEW]
 * Gateway fee deduction default is 0% pending final aggregator agreements.
 */
export const CONSULTATION_CANCELLATION_TIERS: CancellationTier[] = [
  {
    id: "tier-full-refund",
    minHoursBeforeStart: 24,
    maxHoursBeforeStart: null,
    refundPercentage: 100,
    gatewayFeeDeductionPct: 0,
    description: "More than 24 hours prior to scheduled start. Full 100% refund (proposed policy: 0% gateway fee deduction).",
  },
  {
    id: "tier-partial-refund",
    minHoursBeforeStart: 4,
    maxHoursBeforeStart: 24,
    refundPercentage: 50,
    gatewayFeeDeductionPct: 0,
    description: "Between 4 and 24 hours prior to scheduled start. 50% refund to compensate accredited Pandit preparation.",
  },
  {
    id: "tier-no-refund",
    minHoursBeforeStart: 0,
    maxHoursBeforeStart: 4,
    refundPercentage: 0,
    gatewayFeeDeductionPct: 0,
    description: "Less than 4 hours prior. Non-refundable. One-time emergency rescheduling permitted up to 2 hours prior.",
  },
];

export const PROPOSED_DEFAULT_TIERS = CONSULTATION_CANCELLATION_TIERS;

export interface CalculateRefundOptions {
  originalAmount: number;
  currency: CurrencyCode;
  serviceType: ServiceClassification;
  hoursUntilStart: number;
  isDigitalAssetDownloaded?: boolean;
}

// Helper: integer minor-unit arithmetic (paise / cents) to prevent IEEE-754 floating-point errors
const toMinor = (amount: number): number => Math.round(amount * 100);
const fromMinor = (minor: number): number => Number((minor / 100).toFixed(2));

export function calculateRefundEligibility(
  options: CalculateRefundOptions
): RefundCalculation {
  const { originalAmount, currency, serviceType, hoursUntilStart, isDigitalAssetDownloaded } = options;
  const originalMinor = toMinor(originalAmount);

  // Case 1: Pandit No-Show or Expert Cancellation (100% full refund with 0% gateway fee deduction)
  if (serviceType === "pandit_no_show") {
    return {
      originalAmount,
      currency,
      serviceType,
      hoursUntilStart,
      canCancel: true,
      refundPercentage: 100,
      grossRefundAmount: originalAmount,
      gatewayFeeDeducted: 0,
      netRefundAmount: originalAmount,
      tierDescription: "Pandit Absence or Cancellation Guarantee",
      isDigitalWaiverApplicable: false,
      reasonMessage:
        "Full 100% refund granted under ISHTI Expert Reliability Guarantee. All transaction and gateway fees absorbed by ISHTI.",
    };
  }

  // Case 2: Digital Audio or Scripture Downloads
  if (serviceType === "digital_audio_scripture") {
    if (isDigitalAssetDownloaded) {
      return {
        originalAmount,
        currency,
        serviceType,
        hoursUntilStart: 0,
        canCancel: false,
        refundPercentage: 0,
        grossRefundAmount: 0,
        gatewayFeeDeducted: 0,
        netRefundAmount: 0,
        tierDescription: "Digital Content Performance Commenced",
        isDigitalWaiverApplicable: true,
        reasonMessage:
          "Digital content is non-refundable once streaming or download has commenced. In accordance with EU Directive 2011/83/EU Article 16(m), the 14-day statutory withdrawal right is waived upon immediate delivery.",
      };
    } else {
      return {
        originalAmount,
        currency,
        serviceType,
        hoursUntilStart: 0,
        canCancel: true,
        refundPercentage: 100,
        grossRefundAmount: originalAmount,
        gatewayFeeDeducted: 0,
        netRefundAmount: originalAmount,
        tierDescription: "Digital Content Not Yet Downloaded",
        isDigitalWaiverApplicable: false,
        reasonMessage:
          "Full refund granted as digital transmission or download has not yet commenced.",
      };
    }
  }

  // Case 3: Live Consultations & Online Puja Ceremonies
  for (const tier of CONSULTATION_CANCELLATION_TIERS) {
    const matchesMin = hoursUntilStart >= tier.minHoursBeforeStart;
    const matchesMax = tier.maxHoursBeforeStart === null || hoursUntilStart < tier.maxHoursBeforeStart;

    if (matchesMin && matchesMax) {
      const grossMinor = Math.round((originalMinor * tier.refundPercentage) / 100);
      const feeMinor = Math.round((grossMinor * tier.gatewayFeeDeductionPct) / 100);
      const netMinor = Math.max(0, grossMinor - feeMinor);

      const grossRefund = fromMinor(grossMinor);
      const gatewayFee = fromMinor(feeMinor);
      const netRefund = fromMinor(netMinor);

      return {
        originalAmount,
        currency,
        serviceType,
        hoursUntilStart,
        canCancel: tier.refundPercentage > 0,
        refundPercentage: tier.refundPercentage,
        grossRefundAmount: grossRefund,
        gatewayFeeDeducted: gatewayFee,
        netRefundAmount: netRefund,
        tierDescription: tier.description,
        isDigitalWaiverApplicable: false,
        reasonMessage:
          tier.refundPercentage > 0
            ? `Eligible for ${tier.refundPercentage}% refund under tier rules (${hoursUntilStart.toFixed(1)} hours before start).`
            : "Cancellation is non-refundable within 4 hours of the scheduled start time as the Pandit has completed sacred preparations.",
      };
    }
  }

  // Fallback for past sessions
  return {
    originalAmount,
    currency,
    serviceType,
    hoursUntilStart,
    canCancel: false,
    refundPercentage: 0,
    grossRefundAmount: 0,
    gatewayFeeDeducted: 0,
    netRefundAmount: 0,
    tierDescription: "Session Elapsed",
    isDigitalWaiverApplicable: false,
    reasonMessage: "The scheduled consultation has already concluded or elapsed.",
  };
}

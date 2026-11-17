import type { RetentionRule } from "@spiritual-os/types";

/**
 * ISHTI Statutory Retention & Deletion Schedule Matrix
 *
 * Grounded in:
 * - Income-tax Act, 2025 (§62 / Rule 46): 7 years retention for books of account & tax vouchers.
 * - Companies Act, 2013 (§128(5)): 8 financial years retention for books of account.
 * - Digital Personal Data Protection Act, 2023 (§8(7)): Erasure upon purpose cessation or consent withdrawal.
 * - Information Technology (Intermediary Guidelines) Rules, 2021: 180 days retention for user registration details after cancellation.
 * - Note: Corporate entities designated with [LEGAL_REVIEW_REQUIRED: ...] pending corporate formation.
 */
export const STATUTORY_RETENTION_RULES: RetentionRule[] = [
  {
    recordType: "Invoices, Billing Vouchers & GST Records",
    legalEntity: "[LEGAL_REVIEW_REQUIRED: ISHTI Corporate Entity]",
    statutoryCitation: "Income-tax Act, 2025 §62 / Rule 46 & CGST Act, 2017 §36",
    retentionYears: 7,
    trigger: "From end of the relevant assessment year",
    isStatutory: true,
    exceptionRationale:
      "Statutory tax and financial accounting mandate. Cannot be purged upon devotee erasure request; records are locked and pseudonymized to 'ANON-USER-DELETED'.",
  },
  {
    recordType: "Statutory Financial Ledgers & Audits",
    legalEntity: "[LEGAL_REVIEW_REQUIRED: ISHTI Corporate Entity]",
    statutoryCitation: "Companies Act, 2013 Section 128(5)",
    retentionYears: 8,
    trigger: "From end of the relevant financial year",
    isStatutory: true,
    exceptionRationale:
      "Statutory company accounts retention mandate. Kept in locked financial archives solely for statutory audit compliance.",
  },
  {
    recordType: "Account Registration & Intermediary Audit Trail",
    legalEntity: "[LEGAL_REVIEW_REQUIRED: ISHTI Platform Operator]",
    statutoryCitation: "IT (Intermediary Guidelines) Rules, 2021 Rule 3(1)(h)",
    retentionYears: 0.5, // 180 days
    trigger: "From date of user account cancellation or withdrawal",
    isStatutory: true,
    exceptionRationale:
      "Law enforcement preservation mandate under Indian intermediary law for investigative authorities.",
  },
  {
    recordType: "Astrological Birth Data (Encrypted Kundli)",
    legalEntity: "[LEGAL_REVIEW_REQUIRED: ISHTI Platform Operator]",
    statutoryCitation: "DPDP Act, 2023 §8(7) / GDPR Art. 17",
    retentionYears: 0,
    trigger: "Immediate erasure upon user account deletion or chart removal",
    isStatutory: false,
    exceptionRationale:
      "No statutory retention obligation. Cryptographic keys and encrypted birth records are permanently shredded upon verified deletion request.",
  },
  {
    recordType: "Spiritual Intentions (Sankalpa) & Prayer Notes",
    legalEntity: "[LEGAL_REVIEW_REQUIRED: ISHTI Platform Operator]",
    statutoryCitation: "DPDP Act, 2023 §8(7) / GDPR Art. 9 & 17",
    retentionYears: 0,
    trigger: "Immediate erasure upon user request or consultation conclusion",
    isStatutory: false,
    exceptionRationale:
      "Special category devotional data. Erased immediately from active storage upon verified devotee request.",
  },
  {
    recordType: "Transient Rate Limiting IP Hashes & Session Tokens",
    legalEntity: "[LEGAL_REVIEW_REQUIRED: ISHTI Platform Operator]",
    statutoryCitation: "Operational Security Policy (ISO 27001 / DPDP §8(5))",
    retentionYears: 0.25, // 90 days
    trigger: "Automated rolling expiration",
    isStatutory: false,
    exceptionRationale:
      "DDoS mitigation and brute-force protection logs. Salted HMAC-SHA-256 hashes automatically expire within 30 to 90 days.",
  },
];

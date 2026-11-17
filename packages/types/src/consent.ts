/**
 * ISHTI Multi-Jurisdiction Consent & Preference Governance Types
 *
 * Grounded in:
 * - Digital Personal Data Protection Act, 2023 §6 (Unbundled, Purpose-Specific Consent)
 * - GDPR Regulation (EU) 2016/679 Article 6 & Article 9 (Special Category Religious Data Explicit Consent)
 * - California Consumer Privacy Act / CPRA Notice & Choice
 */

export type ConsentPurposeId =
  | "kundli_astrology"
  | "expert_consultation"
  | "spiritual_ai"
  | "marketing_updates"
  | "analytics"
  | "community_visibility";

export type DataCategory =
  | "religious_special_category"
  | "astrological_birth_data"
  | "identity_contact"
  | "transactional_commerce"
  | "telemetry_diagnostics";

export type LegalBasis =
  | "dpdp_consent"
  | "gdpr_explicit_consent_art9"
  | "contractual_necessity"
  | "legitimate_interest"
  | "statutory_obligation";

export type ConsentStatus = "GRANTED" | "WITHDRAWN" | "PENDING" | "EXPIRED";

export interface ConsentPurposeDefinition {
  id: ConsentPurposeId;
  title: string;
  categoryName: string;
  dataCategory: DataCategory;
  legalBasis: LegalBasis;
  description: string;
  isMandatory: boolean;
  defaultGranted: boolean;
  version: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: ConsentPurposeId;
  status: ConsentStatus;
  version: string;
  legalBasis: LegalBasis;
  dataCategory: DataCategory;
  grantedAt: string;
  revokedAt?: string;
  ipHash?: string;
  userAgent?: string;
  evidenceHash: string;
}

export interface CookiePreferences {
  essential: boolean;     // Always true
  functional: boolean;    // A11y, language preferences
  analytics: boolean;     // Zero-PII reader telemetry (opt-in)
  updatedAt: string;
  version: string;
}

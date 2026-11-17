/**
 * ISHTI Privacy Rights, Data Subject Requests & Retention Types
 *
 * Grounded in:
 * - Digital Personal Data Protection Act, 2023 (§11 Access, §12 Correction/Erasure)
 * - GDPR Regulation (EU) 2016/679 (Articles 15, 17, 20)
 * - California Consumer Privacy Act / CPRA (§1798.100, §1798.105)
 * - Income-tax Act, 2025 (§62 / Rule 46) & Companies Act, 2013 (§128)
 */

export type PrivacyRequestType = "export" | "delete" | "rectify" | "restrict";

export type PrivacyRequestStatus =
  | "SUBMITTED"
  | "IDENTITY_VERIFIED"
  | "PROCESSING"
  | "COMPLETED"
  | "REJECTED";

export type DeletionStage =
  | "VERIFICATION"
  | "ANTI_CASCADE_UNLINKING"
  | "ASTRO_KEY_SHREDDING"
  | "SPIRITUAL_CONTENT_SCRUBBING"
  | "FINANCIAL_PSEUDONYMIZATION"
  | "CACHE_PURGE"
  | "PROOF_RECEIPT";

export interface RetentionRule {
  recordType: string;
  legalEntity: string;
  statutoryCitation: string;
  retentionYears: number;
  trigger: string;
  isStatutory: boolean;
  exceptionRationale: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: PrivacyRequestType;
  status: PrivacyRequestStatus;
  submittedAt: string;
  completedAt?: string;
  currentStage?: DeletionStage;
  proofReceiptHash?: string;
  retentionExceptions?: string[];
  notes?: string;
}

export interface ExportDataPackage {
  metadata: {
    exportId: string;
    userId: string;
    generatedAt: string;
    schemaVersion: string;
    dataFingerprintSha256: string;
  };
  profile: Record<string, any>;
  consents: Record<string, any>;
  kundliSummary: {
    totalProfiles: number;
    encryptionStandard: string;
    encryptedFieldsNotice: string;
  };
  bookingsSummary: {
    totalBookings: number;
    activeBookingsCount: number;
  };
  statutoryRetentionNotice: string;
}

export interface DeletionCertificate {
  certificateId: string;
  userId: string;
  executionTimestamp: string;
  stagesCompleted: DeletionStage[];
  recordsShredded: string[];
  pseudonymizedIdentity: string;
  retainedStatutoryRecords: string[];
  statutoryCitation: string;
  certificateHashSha256: string;
}

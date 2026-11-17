import { sha256Hex } from "../consent/evidence-hasher";
import { loadLocalConsentState } from "../consent/consent-service";

/**
 * ISHTI Subject Access Request (SAR) Data Package Specification Preview
 *
 * GOVERNANCE INVARIANT:
 * - This service provides an architectural schema preview of the machine-readable SAR export.
 * - Under NO circumstances does this function claim that a full statutory SAR request has been fulfilled,
 *   as live data extraction requires authenticated server-side queries across PostgreSQL tables.
 * - Missing Backend Dependency: Milestone M06 server-side data extraction pipeline.
 */

export interface GenerateExportOptions {
  userId: string;
  fullName?: string;
  phone?: string;
  email?: string;
  languagePreference?: string;
}

export interface SARPackagePreview {
  metadata: {
    previewId: string;
    userId: string;
    generatedAt: string;
    schemaVersion: string;
    fulfillmentStatus: "DEMONSTRATION_PREVIEW_ONLY";
    notice: string;
    templateFingerprintSha256: string;
  };
  demonstrationProfileStructure: {
    userId: string;
    fullName: string;
    phoneMasked: string;
    emailMasked: string;
    languagePreference: string;
    accountStatus: string;
  };
  clientPreferencesSnapshot: {
    localPreferences: Record<string, boolean>;
    preferenceTimestamps: Record<string, any>;
    disclaimer: string;
  };
  astrologicalDataSchema: {
    encryptionStandard: string;
    fieldsEncrypted: string[];
    extractionStatus: string;
  };
  statutoryDataSourcesPendingExtraction: string[];
  statutoryRetentionScheduleNotice: string;
}

export async function generateSARDataPackage(
  options: GenerateExportOptions
): Promise<SARPackagePreview> {
  const previewId = `sar-preview-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const generatedAt = new Date().toISOString();
  const consentState = loadLocalConsentState();

  const payloadToHash = `${previewId}:${options.userId}:${generatedAt}:PREVIEW_ONLY`;
  const templateFingerprintSha256 = await sha256Hex(payloadToHash);

  return {
    metadata: {
      previewId,
      userId: options.userId,
      generatedAt,
      schemaVersion: "v1.0.0-m05-specification",
      fulfillmentStatus: "DEMONSTRATION_PREVIEW_ONLY",
      notice:
        "DEMONSTRATION PREVIEW: This document illustrates the machine-readable JSON structure for Data Subject Access Requests (DPDP §11 / GDPR Art. 15). Live database extraction requires M06 backend pipeline integration. No production data was extracted.",
      templateFingerprintSha256,
    },
    demonstrationProfileStructure: {
      userId: options.userId,
      fullName: options.fullName || "[Authenticated User Name]",
      phoneMasked: options.phone ? options.phone.slice(0, 4) + "XXXXXX" : "[Masked Registered Phone]",
      emailMasked: options.email ? options.email.replace(/(?<=.).(?=[^@]*?@)/g, "*") : "[Masked Email]",
      languagePreference: options.languagePreference || "hi",
      accountStatus: "PENDING_SERVER_SESSION_QUERY",
    },
    clientPreferencesSnapshot: {
      localPreferences: consentState.consents,
      preferenceTimestamps: consentState.records,
      disclaimer: "Represents local browser convenience toggles; authoritative consent logs require M06 database records.",
    },
    astrologicalDataSchema: {
      encryptionStandard: "Server-side AES-256-GCM authenticated envelope encryption with tenant-bound AAD",
      fieldsEncrypted: ["date_of_birth", "time_of_birth", "latitude", "longitude", "city_of_birth"],
      extractionStatus: "PENDING_KMS_AUTHENTICATED_DECRYPTION_WORKER",
    },
    statutoryDataSourcesPendingExtraction: [
      "public.profiles (Devotee identity and traditional preferences)",
      "public.kundli_profiles (Encrypted birth charts)",
      "public.booking_requests (Historical consultation and puja orders)",
      "public.user_consents (Authoritative statutory consent logs)",
    ],
    statutoryRetentionScheduleNotice:
      "Statutory tax and billing records are subject to 7-year retention under Income-tax Act, 2025 §62 / Rule 46 and 8 years under Companies Act, 2013 §128. Live data extraction will be activated upon M06 backend deployment.",
  };
}

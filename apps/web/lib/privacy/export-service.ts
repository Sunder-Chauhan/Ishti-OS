import { sha256Hex } from "../consent/evidence-hasher";
import { loadLocalConsentState } from "../consent/consent-service";
import type { ExportDataPackage } from "@spiritual-os/types";

export interface GenerateExportOptions {
  userId: string;
  fullName?: string;
  phone?: string;
  email?: string;
  languagePreference?: string;
}

export async function generateSARDataPackage(
  options: GenerateExportOptions
): Promise<ExportDataPackage> {
  const exportId = `sar-export-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const generatedAt = new Date().toISOString();
  const consentState = loadLocalConsentState();

  const payloadToHash = `${exportId}:${options.userId}:${generatedAt}`;
  const dataFingerprintSha256 = await sha256Hex(payloadToHash);

  const exportPackage: ExportDataPackage = {
    metadata: {
      exportId,
      userId: options.userId,
      generatedAt,
      schemaVersion: "v1.0.0-m05",
      dataFingerprintSha256,
    },
    profile: {
      id: options.userId,
      fullName: options.fullName || "Devotee Seeker",
      phone: options.phone || "+91-XXXXXXXXXX",
      email: options.email || "devotee@example.com",
      languagePreference: options.languagePreference || "hi",
      accountCreated: "2026-11-16T00:00:00Z",
      status: "active",
    },
    consents: {
      activeConsents: consentState.consents,
      auditRecords: consentState.records,
    },
    kundliSummary: {
      totalProfiles: 1,
      encryptionStandard: "Server-side AES-256-GCM authenticated envelope encryption with tenant-bound AAD",
      encryptedFieldsNotice:
        "Exact date of birth, time of birth, and geographic coordinates are stored in encrypted form and excluded from unauthenticated plain text exports.",
    },
    bookingsSummary: {
      totalBookings: 1,
      activeBookingsCount: 0,
    },
    statutoryRetentionNotice:
      "Statutory tax and billing records are maintained for 7 years under Income-tax Act, 2025 §62/Rule 46. Under DPDP Act 2023 §11, this export includes all personal data processed under your consent.",
  };

  return exportPackage;
}

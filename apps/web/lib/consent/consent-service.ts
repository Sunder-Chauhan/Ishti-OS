import { CONSENT_PURPOSE_DEFINITIONS } from "./consent-registry";
import { sha256Hex } from "./evidence-hasher";
import type {
  ConsentPurposeId,
  ConsentPurposeDefinition,
  ConsentRecord,
  ConsentStatus,
} from "@spiritual-os/types";

export const LOCAL_CONSENT_KEY = "ishti_dpdp_consents_v2";

/**
 * Client-Side Local Browser Preference State
 *
 * NOTE: This is a convenience caching layer for browser preferences on the current device.
 * It is NOT authoritative statutory consent evidence. Under §6 of the DPDP Act, 2023 and
 * GDPR Art. 7, legally binding consent logs must be maintained server-side upon verified devotee
 * authentication.
 */
export interface LocalConsentPreferences {
  consents: Record<ConsentPurposeId, boolean>;
  records: Record<ConsentPurposeId, {
    status: ConsentStatus;
    updatedAt: string;
    version: string;
    integrityChecksum: string;
  }>;
}

// Backward compatibility alias for UI
export type StoredConsentState = LocalConsentPreferences;

/**
 * Server-Side Authoritative Consent Service Interface
 *
 * MISSING BACKEND DEPENDENCY:
 * Authoritative, legally binding consent logging under DPDP Act §6 and GDPR Art. 7
 * requires server-side persistence into `public.user_consents` via authenticated RPC.
 * This interface defines the contract for Milestone M06 implementation.
 */
export interface AuthoritativeConsentRecord {
  id: string;
  userId: string;
  purpose: ConsentPurposeId;
  status: "GRANTED" | "WITHDRAWN";
  version: string;
  legalBasis: string;
  dataCategory: string;
  timestamp: string;
  serverAuditSignature?: string;
}

export interface ServerConsentPersistenceService {
  recordConsent(
    userId: string,
    purpose: ConsentPurposeId,
    granted: boolean,
    version: string
  ): Promise<AuthoritativeConsentRecord>;
  fetchConsents(userId: string): Promise<Record<ConsentPurposeId, AuthoritativeConsentRecord>>;
  revokeConsent(userId: string, purpose: ConsentPurposeId): Promise<AuthoritativeConsentRecord>;
}

export function getAllConsentDefinitions(): ConsentPurposeDefinition[] {
  return CONSENT_PURPOSE_DEFINITIONS;
}

export function getConsentDefinition(purpose: ConsentPurposeId): ConsentPurposeDefinition | undefined {
  return CONSENT_PURPOSE_DEFINITIONS.find((def) => def.id === purpose);
}

export function getDefaultConsentState(): LocalConsentPreferences {
  const consents: Record<string, boolean> = {};
  const records: Record<string, any> = {};
  const now = new Date().toISOString();

  for (const def of CONSENT_PURPOSE_DEFINITIONS) {
    consents[def.id] = def.defaultGranted;
    records[def.id] = {
      status: def.defaultGranted ? "GRANTED" : "WITHDRAWN",
      updatedAt: now,
      version: def.version,
      integrityChecksum: "0000000000000000000000000000000000000000000000000000000000000000",
    };
  }

  return {
    consents: consents as Record<ConsentPurposeId, boolean>,
    records: records as LocalConsentPreferences["records"],
  };
}

export function loadLocalConsentState(): LocalConsentPreferences {
  if (typeof window === "undefined") {
    return getDefaultConsentState();
  }

  try {
    const raw = localStorage.getItem(LOCAL_CONSENT_KEY);
    if (!raw) return getDefaultConsentState();
    const parsed = JSON.parse(raw);
    const defaults = getDefaultConsentState();

    return {
      consents: { ...defaults.consents, ...(parsed.consents || {}) },
      records: { ...defaults.records, ...(parsed.records || {}) },
    };
  } catch {
    return getDefaultConsentState();
  }
}

/**
 * Computes a local preference integrity checksum.
 * Note: Used solely for detecting client-side localStorage tampering; does NOT constitute statutory proof.
 */
export async function createPreferenceChecksum(
  purpose: ConsentPurposeId,
  status: ConsentStatus,
  version: string = "v2026.1",
  timestamp: string = new Date().toISOString(),
  userId?: string
): Promise<string> {
  const identity = userId || "anonymous-browser-session";
  const payload = `ishti:preference:${identity}:${purpose}:${status}:${version}:${timestamp}`;
  return sha256Hex(payload);
}

/**
 * Backward-compatible preference evidence calculation helper.
 */
export async function createConsentEvidence(
  purpose: ConsentPurposeId,
  status: ConsentStatus,
  userId: string = "anonymous-browser-session",
  version: string = "v2026.1",
  timestamp: string = new Date().toISOString()
): Promise<string> {
  return createPreferenceChecksum(purpose, status, version, timestamp, userId);
}

export async function updateLocalConsent(
  purpose: ConsentPurposeId,
  granted: boolean,
  userId?: string
): Promise<{ state: LocalConsentPreferences; record: ConsentRecord }> {
  const currentState = loadLocalConsentState();
  const def = getConsentDefinition(purpose);
  const version = def?.version || "v2026.1";
  const status: ConsentStatus = granted ? "GRANTED" : "WITHDRAWN";
  const now = new Date().toISOString();
  const checksum = await createPreferenceChecksum(purpose, status, version, now, userId);

  const updatedConsents = {
    ...currentState.consents,
    [purpose]: granted,
  };

  const updatedRecords = {
    ...currentState.records,
    [purpose]: {
      status,
      updatedAt: now,
      version,
      integrityChecksum: checksum,
    },
  };

  const nextState: LocalConsentPreferences = {
    consents: updatedConsents,
    records: updatedRecords,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_CONSENT_KEY, JSON.stringify(nextState));
  }

  const record: ConsentRecord = {
    id: `pref-${purpose}-${Date.now()}`,
    userId: userId || "anonymous",
    purpose,
    status,
    version,
    legalBasis: def?.legalBasis || "dpdp_consent",
    dataCategory: def?.dataCategory || "identity_contact",
    grantedAt: granted ? now : currentState.records[purpose]?.updatedAt || now,
    revokedAt: granted ? undefined : now,
    evidenceHash: checksum,
  };

  return { state: nextState, record };
}

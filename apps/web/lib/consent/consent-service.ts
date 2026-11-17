import { CONSENT_PURPOSE_DEFINITIONS } from "./consent-registry";
import { sha256Hex } from "./evidence-hasher";
import type {
  ConsentPurposeId,
  ConsentPurposeDefinition,
  ConsentRecord,
  ConsentStatus,
} from "@spiritual-os/types";

export const LOCAL_CONSENT_KEY = "ishti_dpdp_consents_v2";

export interface StoredConsentState {
  consents: Record<ConsentPurposeId, boolean>;
  records: Record<ConsentPurposeId, {
    status: ConsentStatus;
    updatedAt: string;
    version: string;
    evidenceHash: string;
  }>;
}

export function getAllConsentDefinitions(): ConsentPurposeDefinition[] {
  return CONSENT_PURPOSE_DEFINITIONS;
}

export function getConsentDefinition(purpose: ConsentPurposeId): ConsentPurposeDefinition | undefined {
  return CONSENT_PURPOSE_DEFINITIONS.find((def) => def.id === purpose);
}

export function getDefaultConsentState(): StoredConsentState {
  const consents: Record<string, boolean> = {};
  const records: Record<string, any> = {};
  const now = new Date().toISOString();

  for (const def of CONSENT_PURPOSE_DEFINITIONS) {
    consents[def.id] = def.defaultGranted;
    records[def.id] = {
      status: def.defaultGranted ? "GRANTED" : "WITHDRAWN",
      updatedAt: now,
      version: def.version,
      evidenceHash: "0000000000000000000000000000000000000000000000000000000000000000",
    };
  }

  return {
    consents: consents as Record<ConsentPurposeId, boolean>,
    records: records as StoredConsentState["records"],
  };
}

export function loadLocalConsentState(): StoredConsentState {
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

export async function createConsentEvidence(
  purpose: ConsentPurposeId,
  status: ConsentStatus,
  userId: string = "guest-devotee",
  version: string = "v2026.1",
  timestamp: string = new Date().toISOString()
): Promise<string> {
  const payload = `ishti:consent:${userId}:${purpose}:${status}:${version}:${timestamp}`;
  return sha256Hex(payload);
}

export async function updateLocalConsent(
  purpose: ConsentPurposeId,
  granted: boolean,
  userId: string = "guest-devotee"
): Promise<{ state: StoredConsentState; record: ConsentRecord }> {
  const currentState = loadLocalConsentState();
  const def = getConsentDefinition(purpose);
  const version = def?.version || "v2026.1";
  const status: ConsentStatus = granted ? "GRANTED" : "WITHDRAWN";
  const now = new Date().toISOString();
  const evidenceHash = await createConsentEvidence(purpose, status, userId, version, now);

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
      evidenceHash,
    },
  };

  const nextState: StoredConsentState = {
    consents: updatedConsents,
    records: updatedRecords,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_CONSENT_KEY, JSON.stringify(nextState));
  }

  const record: ConsentRecord = {
    id: `consent-${purpose}-${Date.now()}`,
    userId,
    purpose,
    status,
    version,
    legalBasis: def?.legalBasis || "dpdp_consent",
    dataCategory: def?.dataCategory || "identity_contact",
    grantedAt: granted ? now : currentState.records[purpose]?.updatedAt || now,
    revokedAt: granted ? undefined : now,
    evidenceHash,
  };

  return { state: nextState, record };
}

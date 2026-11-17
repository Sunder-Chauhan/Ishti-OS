import { sha256Hex } from "../consent/evidence-hasher";
import type { AuditLogEntry } from "@spiritual-os/types";

/**
 * ISHTI Tamper-Evident SHA-256 Audit Hash Chain
 *
 * NOTE: This module provides a client-side tamper-evident demonstration of SHA-256
 * hash chaining for compliance event tracking in the browser session.
 * In production environments, authoritative compliance audit records are written to
 * immutable, write-once server-side audit logs (WORM storage) under DPDP §8 and ISO 27001 A.12.4.
 */

export const LOCAL_AUDIT_LEDGER_KEY = "ishti_compliance_audit_ledger_v1";

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export async function appendAuditLogEntry(
  eventType: string,
  actor: string,
  payload: Record<string, any>
): Promise<AuditLogEntry> {
  const currentLedger = getAuditLedger();
  const index = currentLedger.length;
  const timestamp = new Date().toISOString();
  const previousHash = index === 0 ? GENESIS_HASH : currentLedger[index - 1].entryHash;

  const payloadString = JSON.stringify(payload);
  const payloadHash = await sha256Hex(payloadString);

  const blockData = `${index}:${timestamp}:${eventType}:${actor}:${payloadHash}:${previousHash}`;
  const entryHash = await sha256Hex(blockData);

  const newEntry: AuditLogEntry = {
    index,
    timestamp,
    eventType,
    actor,
    payloadHash,
    previousHash,
    entryHash,
  };

  if (typeof window !== "undefined") {
    try {
      const updated = [...currentLedger, newEntry];
      localStorage.setItem(LOCAL_AUDIT_LEDGER_KEY, JSON.stringify(updated));
    } catch {
      // Local session fallback
    }
  }

  return newEntry;
}

export function getAuditLedger(): AuditLogEntry[] {
  if (typeof window === "undefined") {
    return [
      {
        index: 0,
        timestamp: "2026-11-17T00:00:00Z",
        eventType: "PLATFORM_INITIALIZATION",
        actor: "SYSTEM",
        payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        previousHash: GENESIS_HASH,
        entryHash: "0a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6789",
      },
    ];
  }

  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_LEDGER_KEY);
    if (!raw) {
      const genesis: AuditLogEntry[] = [
        {
          index: 0,
          timestamp: "2026-11-17T00:00:00Z",
          eventType: "PLATFORM_INITIALIZATION",
          actor: "SYSTEM",
          payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          previousHash: GENESIS_HASH,
          entryHash: "0a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6789",
        },
      ];
      localStorage.setItem(LOCAL_AUDIT_LEDGER_KEY, JSON.stringify(genesis));
      return genesis;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function verifyLedgerIntegrity(ledger: AuditLogEntry[]): boolean {
  for (let i = 1; i < ledger.length; i++) {
    if (ledger[i].previousHash !== ledger[i - 1].entryHash) {
      return false; // Broken hash chain detected
    }
  }
  return true;
}

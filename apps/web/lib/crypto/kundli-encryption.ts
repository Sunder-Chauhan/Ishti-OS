import "server-only";

/**
 * ISHTI Astrological Data (Kundli) Application-Layer Encryption Service
 *
 * Security Architecture:
 * - Server-only execution: strictly prevented from entering client/mobile bundles.
 * - Algorithm: AES-256-GCM (Authenticated Encryption with Associated Data - AEAD)
 * - Key Length: 256 bits (32 bytes)
 * - IV Length: 96 bits (12 bytes) cryptographically random per field operation
 * - Auth Tag Length: 128 bits (16 bytes)
 * - Strict Context-Bound AAD:
 *     `ishti:kundli_profiles:${userId}:${profileId}:${fieldName}:v${keyVersion}`
 *   Prevents:
 *     1. Cross-user ciphertext transplantation.
 *     2. Cross-profile ciphertext transplantation (between profiles of same user).
 *     3. Cross-field ciphertext swapping (e.g. DOB into TOB or coordinates).
 *     4. Cross-version/environment replay attacks.
 * - Key Management & Rotation:
 *     * In production (NODE_ENV === "production"), explicitly configured versioned 32-byte
 *       hex keys (e.g. KUNDLI_ENCRYPTION_KEY_V1) are mandatory. Fails fast if missing.
 *     * Multi-version decryption allows seamless rolling key rotation without downtime.
 *
 * ISHTI Internal Data Classification: Level 4 — Highly Confidential
 * (Internal technical governance tier designed to satisfy reasonable security safeguard obligations
 *  under DPDP Act 2023 §8(5); not an official statutory government classification).
 */

import crypto from "node:crypto";

export type KundliEncryptedField = "dob" | "tob" | "coordinates";

export interface EncryptedField {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

export interface EncryptedCoordinatesPayload {
  latitude: number;
  longitude: number;
  altitude?: number;
  place_name: string;
  timezone: string;
}

export interface DecryptedKundliProfile {
  id?: string;
  userId: string;
  profileName: string;
  gender: "male" | "female" | "other";
  dob: string; // YYYY-MM-DD
  tob: string; // HH:MM:SS
  coordinates: EncryptedCoordinatesPayload;
  ayanamsha: string;
  isPrimary: boolean;
}

export interface EncryptedKundliRecord {
  id: string;
  user_id: string;
  profile_name: string;
  gender: "male" | "female" | "other";
  ciphertext_dob: string;
  ciphertext_tob: string;
  ciphertext_coordinates: string;
  encryption_key_version: number;
  encryption_iv: string; // Packed ivDob:ivTob:ivCoords
  encryption_auth_tag: string; // Packed tagDob:tagTob:tagCoords
  ayanamsha: string;
  is_primary: boolean;
}

export const CURRENT_KEY_VERSION = 1;

/**
 * Strict regex for safe entity identifiers in Kundli AAD binding.
 * Accepts standard UUIDs (RFC 4122) or safe alphanumeric slugs without delimiters.
 * Strictly rejects colons, semicolons, slashes, null bytes, and whitespace to prevent AAD delimiter injection.
 */
export const SAFE_ID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$|^[a-zA-Z0-9_-]{8,64}$/;

/**
 * Builds the canonical Additional Authenticated Data (AAD) for a specific Kundli field.
 * Cryptographically binds the ciphertext to the exact user, profile, field, table, and key version.
 * Enforces strict identifier validation to completely neutralize AAD delimiter injection attacks.
 */
export function buildKundliAad(
  userId: string,
  profileId: string,
  fieldName: KundliEncryptedField,
  keyVersion: number
): Buffer {
  if (!userId || typeof userId !== "string" || !SAFE_ID_REGEX.test(userId.trim())) {
    throw new Error(
      "Invalid userId for Kundli AAD binding: must be a valid UUID or alphanumeric identifier without delimiters."
    );
  }
  if (!profileId || typeof profileId !== "string" || !SAFE_ID_REGEX.test(profileId.trim())) {
    throw new Error(
      "Invalid profileId for Kundli AAD binding: must be a valid UUID or alphanumeric identifier without delimiters."
    );
  }
  if (!fieldName || !["dob", "tob", "coordinates"].includes(fieldName)) {
    throw new Error(`Invalid fieldName '${fieldName}' for Kundli AAD binding.`);
  }
  if (!Number.isInteger(keyVersion) || keyVersion < 1) {
    throw new Error(`Invalid keyVersion '${keyVersion}' for Kundli AAD binding: must be a positive integer.`);
  }
  return Buffer.from(
    `ishti:kundli_profiles:${userId.trim().toLowerCase()}:${profileId.trim().toLowerCase()}:${fieldName}:v${keyVersion}`,
    "utf8"
  );
}

/**
 * Retrieves the 256-bit encryption key for the specified version from server environment.
 * In production, fails immediately if the versioned key is missing or invalid.
 */
export function getEncryptionKey(version: number = CURRENT_KEY_VERSION): Buffer {
  const envVarName = `KUNDLI_ENCRYPTION_KEY_V${version}`;
  const rawKeyHex = process.env[envVarName];

  if (!rawKeyHex) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `CRITICAL CONFIGURATION ERROR: Missing server encryption key '${envVarName}' in production. Server startup halted.`
      );
    }
    // Deterministic test key derivation from master secret for isolated dev/test only
    const salt = `ishti-dev-salt-v${version}`;
    const baseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || "ishti-development-master-key-seed-32b";
    return crypto.scryptSync(baseSecret, salt, 32);
  }

  const keyBuffer = Buffer.from(rawKeyHex.trim(), "hex");
  if (keyBuffer.length !== 32) {
    throw new Error(
      `Invalid key length for '${envVarName}': expected 32 bytes (64 hex characters), got ${keyBuffer.length} bytes.`
    );
  }
  return keyBuffer;
}

/**
 * Encrypts a single plaintext field using AES-256-GCM with a fresh 96-bit IV and full AAD context binding.
 */
export function encryptKundliField(
  plaintext: string,
  userId: string,
  profileId: string,
  fieldName: KundliEncryptedField,
  keyVersion: number = CURRENT_KEY_VERSION,
  customKey?: Buffer
): EncryptedField {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Plaintext must be a non-empty string.");
  }

  const key = customKey || getEncryptionKey(keyVersion);
  const iv = crypto.randomBytes(12); // Fresh 96-bit IV for every encryption

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const aad = buildKundliAad(userId, profileId, fieldName, keyVersion);
  cipher.setAAD(aad);

  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    keyVersion,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted field, verifying both the 128-bit auth tag and full AAD context binding.
 * Throws an error if any tampering, cross-user copy, cross-profile copy, or cross-field swap occurs.
 */
export function decryptKundliField(
  ciphertext: string,
  ivHex: string,
  authTagHex: string,
  userId: string,
  profileId: string,
  fieldName: KundliEncryptedField,
  keyVersion: number = CURRENT_KEY_VERSION,
  customKey?: Buffer
): string {
  if (!ciphertext || !ivHex || !authTagHex) {
    throw new Error("Missing required ciphertext, IV, or authentication tag.");
  }

  const key = customKey || getEncryptionKey(keyVersion);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (iv.length !== 12) {
    throw new Error(`Invalid IV length: expected 12 bytes, got ${iv.length}`);
  }
  if (authTag.length !== 16) {
    throw new Error(`Invalid Auth Tag length: expected 16 bytes, got ${authTag.length}`);
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  const aad = buildKundliAad(userId, profileId, fieldName, keyVersion);
  decipher.setAAD(aad);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypts an entire Kundli profile into the database record format.
 * Generates an immutable profile ID if not already assigned, ensuring profile-level binding.
 */
export function encryptKundliProfile(
  profile: DecryptedKundliProfile,
  keyVersion: number = CURRENT_KEY_VERSION,
  customKey?: Buffer
): EncryptedKundliRecord {
  // Validate format before encryption
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.dob)) {
    throw new Error("Invalid date of birth format: expected YYYY-MM-DD");
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(profile.tob)) {
    throw new Error("Invalid time of birth format: expected HH:MM or HH:MM:SS");
  }

  const profileId = profile.id || crypto.randomUUID();

  const encDob = encryptKundliField(profile.dob, profile.userId, profileId, "dob", keyVersion, customKey);
  const encTob = encryptKundliField(profile.tob, profile.userId, profileId, "tob", keyVersion, customKey);
  const encCoords = encryptKundliField(
    JSON.stringify(profile.coordinates),
    profile.userId,
    profileId,
    "coordinates",
    keyVersion,
    customKey
  );

  return {
    id: profileId,
    user_id: profile.userId,
    profile_name: profile.profileName,
    gender: profile.gender,
    ciphertext_dob: encDob.ciphertext,
    ciphertext_tob: encTob.ciphertext,
    ciphertext_coordinates: encCoords.ciphertext,
    encryption_key_version: keyVersion,
    encryption_iv: `${encDob.iv}:${encTob.iv}:${encCoords.iv}`,
    encryption_auth_tag: `${encDob.authTag}:${encTob.authTag}:${encCoords.authTag}`,
    ayanamsha: profile.ayanamsha,
    is_primary: profile.isPrimary,
  };
}

/**
 * Decrypts a database record back into a strongly-typed DecryptedKundliProfile.
 * Authenticates user ID, profile ID, and field bindings.
 */
export function decryptKundliProfile(
  record: EncryptedKundliRecord,
  customKey?: Buffer
): DecryptedKundliProfile {
  const [ivDob, ivTob, ivCoords] = record.encryption_iv.split(":");
  const [tagDob, tagTob, tagCoords] = record.encryption_auth_tag.split(":");

  if (!ivDob || !ivTob || !ivCoords || !tagDob || !tagTob || !tagCoords) {
    throw new Error("Corrupted encryption metadata: missing IV or auth tag components.");
  }

  const dob = decryptKundliField(
    record.ciphertext_dob,
    ivDob,
    tagDob,
    record.user_id,
    record.id,
    "dob",
    record.encryption_key_version,
    customKey
  );

  const tob = decryptKundliField(
    record.ciphertext_tob,
    ivTob,
    tagTob,
    record.user_id,
    record.id,
    "tob",
    record.encryption_key_version,
    customKey
  );

  const coordsJson = decryptKundliField(
    record.ciphertext_coordinates,
    ivCoords,
    tagCoords,
    record.user_id,
    record.id,
    "coordinates",
    record.encryption_key_version,
    customKey
  );

  let coordinates: EncryptedCoordinatesPayload;
  try {
    coordinates = JSON.parse(coordsJson);
  } catch {
    throw new Error("Failed to parse decrypted coordinates payload JSON.");
  }

  return {
    id: record.id,
    userId: record.user_id,
    profileName: record.profile_name,
    gender: record.gender,
    dob,
    tob,
    coordinates,
    ayanamsha: record.ayanamsha,
    isPrimary: record.is_primary,
  };
}

/**
 * Key Rotation Architecture & Migration Procedure:
 *
 * 1. Active Key Policy:
 *    - New records are always encrypted using CURRENT_KEY_VERSION.
 *    - To rotate to key v2:
 *      a) Add KUNDLI_ENCRYPTION_KEY_V2 to production secrets/KMS.
 *      b) Retain KUNDLI_ENCRYPTION_KEY_V1 in production environment.
 *      c) Update CURRENT_KEY_VERSION = 2 in code.
 *
 * 2. Background Re-encryption Worker:
 *    - Queries records where encryption_key_version < CURRENT_KEY_VERSION.
 *    - Decrypts record using old version key (e.g. v1).
 *    - Re-encrypts record using new active key (e.g. v2) with fresh IVs and updated AAD.
 *    - Saves record with encryption_key_version = 2.
 *
 * 3. Decommissioning:
 *    - Once 0 records remain with key_version = 1, safely remove KUNDLI_ENCRYPTION_KEY_V1.
 */
export async function reencryptKundliRecord(
  record: EncryptedKundliRecord,
  targetKeyVersion: number = CURRENT_KEY_VERSION
): Promise<EncryptedKundliRecord> {
  if (record.encryption_key_version === targetKeyVersion) {
    return record; // Already up-to-date
  }

  const decrypted = decryptKundliProfile(record);
  return encryptKundliProfile(decrypted, targetKeyVersion);
}

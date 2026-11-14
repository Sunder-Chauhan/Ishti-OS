/**
 * ISHTI Astrological Data (Kundli) Application-Layer Encryption Service
 *
 * Security Architecture:
 * - Algorithm: AES-256-GCM (Authenticated Encryption with Associated Data - AEAD)
 * - Key Length: 256 bits (32 bytes)
 * - IV Length: 96 bits (12 bytes) cryptographically random per operation
 * - Auth Tag Length: 128 bits (16 bytes)
 * - AAD: Additional Authenticated Data binding ciphertext to target User ID & Key Version
 * - Isolation: Keys are held exclusively in server-side memory/KMS and never sent to
 *   browser clients, mobile apps, or PostgreSQL schemas.
 *
 * ISHTI Security Classification: Level 4 — Highly Confidential
 */

import crypto from "node:crypto";

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
  id?: string;
  user_id: string;
  profile_name: string;
  gender: "male" | "female" | "other";
  ciphertext_dob: string;
  ciphertext_tob: string;
  ciphertext_coordinates: string;
  encryption_key_version: number;
  encryption_iv: string;
  encryption_auth_tag: string;
  ayanamsha: string;
  is_primary: boolean;
}

const CURRENT_KEY_VERSION = 1;

/**
 * Retrieves the 256-bit encryption key for the specified version from server secrets.
 * Throws an explicit error if the key is missing or invalid.
 */
export function getEncryptionKey(version: number = CURRENT_KEY_VERSION): Buffer {
  // Read versioned key from environment
  const envVarName = `KUNDLI_ENCRYPTION_KEY_V${version}`;
  let rawKeyHex = process.env[envVarName];

  // In development/test environments, fallback to a derived key if not explicitly set
  if (!rawKeyHex) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`CRITICAL: Missing server encryption key ${envVarName} in production.`);
    }
    // Deterministic test key derivation from master secret
    const salt = `ishti-dev-salt-v${version}`;
    const baseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || "ishti-development-master-key-seed-32b";
    return crypto.scryptSync(baseSecret, salt, 32);
  }

  const keyBuffer = Buffer.from(rawKeyHex.trim(), "hex");
  if (keyBuffer.length !== 32) {
    throw new Error(`Invalid key length for ${envVarName}: expected 32 bytes (64 hex characters), got ${keyBuffer.length}`);
  }
  return keyBuffer;
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a fresh 96-bit IV and AAD binding.
 */
export function encryptKundliField(
  plaintext: string,
  userId: string,
  keyVersion: number = CURRENT_KEY_VERSION,
  customKey?: Buffer
): EncryptedField {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Plaintext must be a non-empty string.");
  }
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID is required for AAD security binding.");
  }

  const key = customKey || getEncryptionKey(keyVersion);
  const iv = crypto.randomBytes(12); // Fresh 96-bit IV for every encryption

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  // Bind ciphertext cryptographically to user ID and key version (prevents cross-user copying)
  const aad = Buffer.from(`ishti:kundli:${userId}:v${keyVersion}`, "utf8");
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
 * Decrypts an AES-256-GCM encrypted field, verifying both the auth tag and AAD binding.
 */
export function decryptKundliField(
  ciphertext: string,
  ivHex: string,
  authTagHex: string,
  userId: string,
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

  // Verify AAD binding matches the original encryption context
  const aad = Buffer.from(`ishti:kundli:${userId}:v${keyVersion}`, "utf8");
  decipher.setAAD(aad);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypts an entire Kundli profile into the database record format.
 */
export function encryptKundliProfile(
  profile: DecryptedKundliProfile,
  keyVersion: number = CURRENT_KEY_VERSION
): EncryptedKundliRecord {
  // Validate basic format before encryption
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.dob)) {
    throw new Error("Invalid date of birth format: expected YYYY-MM-DD");
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(profile.tob)) {
    throw new Error("Invalid time of birth format: expected HH:MM or HH:MM:SS");
  }

  const encDob = encryptKundliField(profile.dob, profile.userId, keyVersion);
  const encTob = encryptKundliField(profile.tob, profile.userId, keyVersion);
  const encCoords = encryptKundliField(JSON.stringify(profile.coordinates), profile.userId, keyVersion);

  return {
    id: profile.id,
    user_id: profile.userId,
    profile_name: profile.profileName,
    gender: profile.gender,
    ciphertext_dob: encDob.ciphertext,
    ciphertext_tob: encTob.ciphertext,
    ciphertext_coordinates: encCoords.ciphertext,
    encryption_key_version: keyVersion,
    // Store IVs & Tags (we store the coordinate IV as primary or serialized envelope)
    encryption_iv: `${encDob.iv}:${encTob.iv}:${encCoords.iv}`,
    encryption_auth_tag: `${encDob.authTag}:${encTob.authTag}:${encCoords.authTag}`,
    ayanamsha: profile.ayanamsha,
    is_primary: profile.isPrimary,
  };
}

/**
 * Decrypts an encrypted Kundli database record into the plain domain model.
 */
export function decryptKundliProfile(record: EncryptedKundliRecord): DecryptedKundliProfile {
  const [ivDob, ivTob, ivCoords] = record.encryption_iv.split(":");
  const [tagDob, tagTob, tagCoords] = record.encryption_auth_tag.split(":");

  if (!ivDob || !ivTob || !ivCoords || !tagDob || !tagTob || !tagCoords) {
    throw new Error("Corrupted encryption envelope: missing multi-field IV or Auth Tag components.");
  }

  const dob = decryptKundliField(
    record.ciphertext_dob,
    ivDob,
    tagDob,
    record.user_id,
    record.encryption_key_version
  );

  const tob = decryptKundliField(
    record.ciphertext_tob,
    ivTob,
    tagTob,
    record.user_id,
    record.encryption_key_version
  );

  const coordsRaw = decryptKundliField(
    record.ciphertext_coordinates,
    ivCoords,
    tagCoords,
    record.user_id,
    record.encryption_key_version
  );

  return {
    id: record.id,
    userId: record.user_id,
    profileName: record.profile_name,
    gender: record.gender,
    dob,
    tob,
    coordinates: JSON.parse(coordsRaw),
    ayanamsha: record.ayanamsha,
    isPrimary: record.is_primary,
  };
}

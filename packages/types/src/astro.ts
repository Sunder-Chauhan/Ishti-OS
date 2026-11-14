/**
 * Astrological Profile (Kundli) & Planetary Models
 *
 * Security Architecture:
 * - Technical Safeguards: Authenticated AES-256-GCM application-layer envelope encryption.
 * - Legal Safeguards: Fulfills DPDP Act 2023 Section 8(5) reasonable security safeguards to prevent
 *   unauthorized disclosure of sensitive personal parameters.
 * - ISHTI Security Classification: Level 4 — Highly Confidential (Birth Time & Coordinates).
 */

export type AyanamshaSystem =
  | "LAHIRI"
  | "RAMAN"
  | "KRISHNAMURTI_PADHDHATI"
  | "YUKTESHWAR";

export interface BirthCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  place_name: string;
  timezone: string;
}

export interface KundliProfileDTO {
  id: string;
  user_id: string;
  profile_name: string;
  gender: "male" | "female" | "other";
  /** Authenticated ciphertext (AES-256-GCM) */
  ciphertext_dob: string;
  ciphertext_tob: string;
  ciphertext_coordinates: string;
  encryption_key_version: number;
  encryption_iv: string;
  encryption_auth_tag: string;
  ayanamsha: AyanamshaSystem;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanetaryPosition {
  planet:
    | "Surya"
    | "Chandra"
    | "Mangala"
    | "Budha"
    | "Guru"
    | "Shukra"
    | "Shani"
    | "Rahu"
    | "Ketu"
    | "Lagna";
  longitude: number;
  rashi: number; // 1-12
  nakshatra: number; // 1-27
  pada: number; // 1-4
  is_retrograde: boolean;
}

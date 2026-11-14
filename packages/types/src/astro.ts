/**
 * Astrological Profile (Kundli) & Planetary Models
 * Protected under DPDP Act 2023 with Tier-1 PII column encryption.
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
  date_of_birth: string; // ISO date YYYY-MM-DD (Encrypted at rest)
  time_of_birth: string; // HH:MM:SS (Encrypted at rest)
  coordinates: BirthCoordinates; // Encrypted at rest
  ayanamsha: AyanamshaSystem;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanetaryPosition {
  planet: "Surya" | "Chandra" | "Mangala" | "Budha" | "Guru" | "Shukra" | "Shani" | "Rahu" | "Ketu" | "Lagna";
  longitude: number;
  rashi: number; // 1-12
  nakshatra: number; // 1-27
  pada: number; // 1-4
  is_retrograde: boolean;
}

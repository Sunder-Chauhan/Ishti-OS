/**
 * User and Identity Types for YUGON (Ishti-OS)
 * Conforms to DPDP Act 2023 consent tracking and RBAC principles.
 */

export type UserRole =
  | "devotee"
  | "expert_pandit"
  | "content_scholar"
  | "platform_admin";

export interface UserProfile {
  id: string;
  auth_user_id: string;
  phone?: string;
  email?: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  role: UserRole;
  language_preference: string;
  sampradaya_tradition?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type ConsentPurpose =
  | "kundli_astrology"
  | "expert_consultation"
  | "marketing_updates"
  | "analytics";

export interface UserConsentLog {
  id: string;
  user_id: string;
  purpose: ConsentPurpose;
  granted: boolean;
  consent_version: string;
  ip_hash?: string;
  user_agent?: string;
  granted_at: string;
  revoked_at?: string;
}

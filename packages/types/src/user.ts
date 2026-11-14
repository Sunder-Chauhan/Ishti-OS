/**
 * User and Identity Types for ISHTI (Ishti-OS)
 *
 * Governance:
 * - Implements role-based access control (RBAC).
 * - Tracks user consents aligned with Digital Personal Data Protection Act, 2023 principles
 *   (purpose specification, consent logging, and revocation tracking).
 * - Internal Security Classification: Level 3 — Confidential (Profile data).
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

export interface RoleAssignmentAudit {
  id: string;
  user_id: string;
  previous_role: string;
  new_role: UserRole;
  assigned_by?: string;
  assigned_by_system: boolean;
  reason: string;
  created_at: string;
}

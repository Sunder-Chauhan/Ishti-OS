/**
 * ISHTI Global Legal, Privacy & Trust Policy Types
 *
 * Defines the schema for the multi-jurisdiction policy centre.
 * Supports versioning, publication status, regional schedules, and statutory bases.
 */

export type PolicyDocumentSlug =
  | "terms"
  | "privacy"
  | "refunds"
  | "payments"
  | "data-deletion"
  | "acceptable-use"
  | "ai-usage"
  | "cookies"
  | "security"
  | "grievance";

export type PolicyCategory =
  | "legal"
  | "privacy"
  | "commerce"
  | "safety"
  | "governance";

export type PolicyStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "LEGAL_REVIEW"
  | "OPERATOR_APPROVAL"
  | "APPROVED"
  | "PUBLISHED"
  | "SUPERSEDED";

export type JurisdictionCode =
  | "GLOBAL"
  | "IN"       // India
  | "EU_UK"    // European Union & United Kingdom
  | "US"       // United States
  | "SG"       // Singapore
  | "AE";      // United Arab Emirates

export interface PolicySection {
  id: string;
  title: string;
  order: number;
  content: string;
  legalBasisRef?: string;
}

export interface PolicySchedule {
  id: string;
  slug: string;
  title: string;
  jurisdiction: JurisdictionCode;
  description: string;
  sections: PolicySection[];
}

export interface PolicyDocument {
  slug: PolicyDocumentSlug;
  title: string;
  category: PolicyCategory;
  status: PolicyStatus;
  version: string;
  effectiveDate: string;
  lastReviewedDate: string;
  summary: string;
  sections: PolicySection[];
  schedules?: PolicySchedule[];
  statutoryBasis?: string[];
  dpoContactRequired?: boolean;
}

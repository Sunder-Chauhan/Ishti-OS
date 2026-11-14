/**
 * Canonical Scripture Corpus & Verified Knowledge Models
 * Governed by scholarly review, strict source citations, and rights clearance.
 */

export type ScriptureCategory =
  | "veda"
  | "upanishad"
  | "purana"
  | "itihasa"
  | "darshana"
  | "stotra"
  | "agamas";

export type ScriptureLanguage = "sanskrit" | "prakrit" | "hindi" | "tamil";

export type ScholarlyStatus = "curated" | "scholarly_review" | "draft";

export type LicenseType =
  | "Public Domain"
  | "CC-BY-4.0"
  | "CC-BY-NC-4.0"
  | "Academic Fair Use"
  | "Licensed Commercial"
  | "Under Legal Review";

export type CommercialRightsStatus =
  | "public_domain_unrestricted"
  | "non_commercial_only"
  | "commercial_license_secured"
  | "under_legal_review";

export interface ScriptureCatalogItem {
  id: string;
  slug: string;
  title_iast: string;
  title_devanagari: string;
  category: ScriptureCategory;
  description: string;
  total_verses?: number;
  language: ScriptureLanguage;
  tradition_sampradaya: string;
  source_edition: string;
  publication_publisher: string;
  publication_year?: number;
  editor_or_compiler?: string;
  rights_holder: string;
  license_type: LicenseType;
  permitted_use: string;
  commercial_rights_status: CommercialRightsStatus;
  rights_clearance_status?: RightsClearanceStatus;
  status: ScholarlyStatus;
}

export type ReviewStatus = "verified" | "pending_peer_review" | "flagged";
export type RightsClearanceStatus = "cleared" | "restricted" | "pending_clearance";

export interface WordAnalysis {
  sanskrit: string;
  iast: string;
  english: string;
  hindi?: string;
  grammatical_notes?: string;
}

export interface VerseTranslation {
  language: string;
  translator: string;
  text: string;
  source_citation?: string;
}

export interface CanonicalVerse {
  id: string;
  scripture_id: string;
  canto_kanda_mandal?: number;
  chapter_adhyaya_sukta?: number;
  verse_number: number;
  devanagari: string;
  iast: string;
  word_for_word?: WordAnalysis[];
  translations: VerseTranslation[];
  meter_chandas?: string;
  deity_devata?: string;
  seer_rishi?: string;
  source_citation: string;
  scholarly_peer_reviewer?: string;
  peer_review_date?: string;
  scholarly_verification_notes?: string;
  rights_clearance_status: RightsClearanceStatus;
  review_status: ReviewStatus;
  created_at: string;
}

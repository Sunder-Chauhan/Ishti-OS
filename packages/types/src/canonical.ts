/**
 * Canonical Scripture Corpus & Verified Knowledge Models
 * Governed by scholarly review and strict source citations.
 */

export type ScriptureCategory =
  | "veda"
  | "upanishad"
  | "purana"
  | "itihasa"
  | "darshana"
  | "stotra"
  | "agamas";

export type ScriptureLanguage = "sanskrit" | "prakrit" | "hindi";

export type ScholarlyStatus = "curated" | "scholarly_review" | "draft";

export interface ScriptureCatalogItem {
  id: string;
  slug: string;
  title_iast: string;
  title_devanagari: string;
  category: ScriptureCategory;
  description: string;
  total_verses?: number;
  language: ScriptureLanguage;
  status: ScholarlyStatus;
}

export type ReviewStatus = "verified" | "pending_peer_review" | "flagged";

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
  reviewed_by?: string;
  review_status: ReviewStatus;
  created_at: string;
}

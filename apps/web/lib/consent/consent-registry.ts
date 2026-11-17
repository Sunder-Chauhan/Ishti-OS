import type { ConsentPurposeDefinition } from "@spiritual-os/types";

/**
 * ISHTI Unbundled Purpose-Specific Consent Registry
 *
 * Implements §6 of the Digital Personal Data Protection Act, 2023,
 * Article 6 and Article 9 of GDPR (Regulation (EU) 2016/679), and
 * California CPRA granular choice requirements.
 */
export const CONSENT_PURPOSE_DEFINITIONS: ConsentPurposeDefinition[] = [
  {
    id: "kundli_astrology",
    title: "Astrological Ephemeris & Birth Chart Calculations",
    categoryName: "Astrological Sanctuary",
    dataCategory: "astrological_birth_data",
    legalBasis: "dpdp_consent",
    description:
      "Authorizes ISHTI to process your date of birth, exact time of birth, and geographic coordinates of birth exclusively to compute planetary ephemeris, divisional charts, and dasha periods. Protected by server-side AES-256-GCM authenticated envelope encryption with tenant-bound authentication tags (AAD).",
    isMandatory: false,
    defaultGranted: true,
    version: "v2026.1",
  },
  {
    id: "expert_consultation",
    title: "Pandit & Acharya Consultation Sharing",
    categoryName: "Marketplace Consultations",
    dataCategory: "religious_special_category",
    legalBasis: "gdpr_explicit_consent_art9",
    description:
      "Permits sharing your astrological birth chart and ritual intentions (Sankalpa) with accredited Pandits and Acharyas officiating your booked consultations. Access is strictly scoped to the duration of the consultation and expires automatically upon session completion.",
    isMandatory: false,
    defaultGranted: true,
    version: "v2026.1",
  },
  {
    id: "spiritual_ai",
    title: "AI Pandit & Canonical Study Assistance",
    categoryName: "Artificial Intelligence",
    dataCategory: "religious_special_category",
    legalBasis: "gdpr_explicit_consent_art9",
    description:
      "Authorizes ISHTI to process your spiritual questions and scriptural inquiries using AI models grounded in verified Vedic texts. Your personal data is never used to train generalized foundation models.",
    isMandatory: false,
    defaultGranted: false,
    version: "v2026.1",
  },
  {
    id: "marketing_updates",
    title: "Tithi, Muhurat & Festival Observances",
    categoryName: "Serene Reminders",
    dataCategory: "identity_contact",
    legalBasis: "dpdp_consent",
    description:
      "Authorizes ISHTI to send serene, non-intrusive calendar reminders for upcoming Vedic festivals, ekadashi observances, and auspicious muhurta timings matching your geographical location.",
    isMandatory: false,
    defaultGranted: false,
    version: "v2026.1",
  },
  {
    id: "analytics",
    title: "Privacy-Preserving Telemetry & Reader Diagnostics",
    categoryName: "Service Quality",
    dataCategory: "telemetry_diagnostics",
    legalBasis: "dpdp_consent",
    description:
      "Enables aggregated, zero-PII performance metrics to optimize canonical scripture reader rendering speeds and astronomical calculation latency. Strictly opt-in.",
    isMandatory: false,
    defaultGranted: false,
    version: "v2026.1",
  },
  {
    id: "community_visibility",
    title: "Devotee Community Satsang Presence",
    categoryName: "Devotee Community",
    dataCategory: "identity_contact",
    legalBasis: "dpdp_consent",
    description:
      "Enables your public display name and avatar in community satsang circles, scripture discussion threads, and collective prayer gatherings.",
    isMandatory: false,
    defaultGranted: false,
    version: "v2026.1",
  },
];

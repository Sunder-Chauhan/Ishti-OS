import React from "react";
import Link from "next/link";

interface PillarData {
  id: string;
  route: string;
  name: string;
  devanagari: string;
  tagline: string;
  description: string;
  capabilities: string[];
  accentColor: string;
  icon: (color: string) => React.ReactNode;
}

const pillars: PillarData[] = [
  {
    id: "puja",
    route: "/puja",
    name: "ISHTI Puja",
    devanagari: "पूजा एवं विधि",
    tagline: "Authentic Ritual Guidance & AI Pandit",
    description:
      "Step-by-step puja vidhi, verified samagri checklists, and scriptural mantras tailored to your sampradaya, festival, and regional tradition.",
    capabilities: [
      "Rigorous mantra transliteration & audio pronunciation",
      "Vetted samagri lists with verified regional substitutes",
      "Interactive AI Pandit bounded strictly to canonical texts",
    ],
    accentColor: "var(--terracotta)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M 12 18 Q 8 22 10 27 L 22 27 Q 24 22 20 18 Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
        <ellipse cx="16" cy="18" rx="4" ry="1.5" stroke={color} strokeWidth="1.5" />
        <circle cx="16" cy="14" r="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.2" />
        <path d="M 12 16 Q 8 13 8 10 Q 11 11 13 14" stroke={color} strokeWidth="1.25" fill="none" strokeLinecap="round" />
        <path d="M 20 16 Q 24 13 24 10 Q 21 11 19 14" stroke={color} strokeWidth="1.25" fill="none" strokeLinecap="round" />
        <line x1="8" y1="29" x2="24" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "astro",
    route: "/astro",
    name: "ISHTI Astro",
    devanagari: "ज्योतिष शास्त्र",
    tagline: "Kundli, Dasha & Planetary Transits",
    description:
      "Mathematical precision meets classical Jyotish. Clear astrological insight without superstition, fear-based warnings, or commercial hype.",
    capabilities: [
      "Deterministic Vedic ephemeris calculations (Lahiri & Raman Ayanamsha)",
      "Transparent planetary positions, Vimshottari dasha, and divisional charts",
      "Constructive, introspective guidance honoring free will and personal duty",
    ],
    accentColor: "var(--gold)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="5" y="5" width="22" height="22" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
        <line x1="5" y1="5" x2="27" y2="27" stroke={color} strokeWidth="1.25" />
        <line x1="27" y1="5" x2="5" y2="27" stroke={color} strokeWidth="1.25" />
        <path d="M 16 5 L 27 16 L 16 27 L 5 16 Z" stroke={color} strokeWidth="1.25" />
        <circle cx="16" cy="16" r="2" fill={color} />
      </svg>
    ),
  },
  {
    id: "bhakti",
    route: "/bhakti",
    name: "ISHTI Bhakti",
    devanagari: "भक्ति एवं स्तोत्र",
    tagline: "Devotional Chants, Aartis & Living Prayers",
    description:
      "A serene repository of devotional compositions: aartis, stotras, chalisa, and suktas with lyrical transliteration and canonical explanations.",
    capabilities: [
      "Curated library of traditional chants across all major Hindu traditions",
      "Sanskrit Devanagari text alongside readable IAST and English meanings",
      "High-clarity audio recordings by verified traditional chanters",
    ],
    accentColor: "var(--terracotta)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M 10 7 C 8 7 6 9 6 11 L 6 23 C 6 25 8 27 10 27 L 22 27 C 24 27 26 25 26 23 L 26 11 C 26 9 24 7 22 7 Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
        <line x1="16" y1="7" x2="16" y2="27" stroke={color} strokeWidth="1.25" />
        <line x1="9" y1="12" x2="13" y2="12" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
        <line x1="9" y1="16" x2="13" y2="16" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
        <line x1="19" y1="12" x2="23" y2="12" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
        <line x1="19" y1="16" x2="23" y2="16" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "panchang",
    route: "/panchang",
    name: "ISHTI Panchang",
    devanagari: "पञ्चाङ्ग एवं मुहूर्त",
    tagline: "Astronomically Accurate Vedic Almanac",
    description:
      "Precision calculation of the five limbs of time: Tithi, Vaar, Nakshatra, Yoga, and Karana. Auspicious muhurtas calculated for your exact location.",
    capabilities: [
      "Exact sunrise, sunset, and twilight calculation by geographic coordinates",
      "Choghadiya, Rahu Kalam, Yamagandam, and Abhijit Muhurta indicators",
      "Major festival dates across regional calendars (Purnimanta & Amanta)",
    ],
    accentColor: "var(--gold)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="5" y="8" width="22" height="19" rx="2" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
        <line x1="5" y1="14" x2="27" y2="14" stroke={color} strokeWidth="1.25" />
        <line x1="10" y1="5" x2="10" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="5" x2="22" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="19" r="1.5" fill={color} />
        <circle cx="16" cy="19" r="1.5" fill={color} />
        <circle cx="21" cy="19" r="1.5" fill={color} />
        <circle cx="11" cy="23" r="1.5" fill={color} />
        <circle cx="16" cy="23" r="1.5" fill={color} />
      </svg>
    ),
  },
  {
    id: "experts",
    route: "/experts",
    name: "ISHTI Experts",
    devanagari: "विद्वत् परिषद",
    tagline: "Vetted Pandits, Acharyas & Gurus",
    description:
      "Direct, transparent access to qualified spiritual practitioners. Strict verification of lineage, credentials, and authentic ritual practice.",
    capabilities: [
      "Verified credentials, Vedic pathshala affiliation, and lineage disclosure",
      "Transparent honorariums without hidden commercial pressure",
      "Virtual and in-person ritual bookings with clear preparation guidance",
    ],
    accentColor: "var(--sage)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="11" r="5" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
        <path d="M 6 26 C 6 21 10 19 16 19 C 22 19 26 21 26 26" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="16" cy="8" r="1" fill={color} />
      </svg>
    ),
  },
  {
    id: "community",
    route: "/community",
    name: "ISHTI Community",
    devanagari: "सत्संग एवं सेवा",
    tagline: "Satsang, Seva & Temple Connection",
    description:
      "A dignified space for spiritual fellowship. Connect with local temple events, seva opportunities, and philosophical study circles.",
    capabilities: [
      "Moderated philosophical discussions bounded by dignity and respect",
      "Local temple event listings, utsava calendars, and seva coordination",
      "Study circles focusing on classical commentaries and living wisdom",
    ],
    accentColor: "var(--sage)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="11" cy="12" r="4" stroke={color} strokeWidth="1.25" fill={color} fillOpacity="0.08" />
        <circle cx="21" cy="12" r="4" stroke={color} strokeWidth="1.25" fill={color} fillOpacity="0.08" />
        <path d="M 4 25 C 4 21 7 19 11 19 C 13.5 19 15.6 20 16.5 21.5" stroke={color} strokeWidth="1.25" strokeLinecap="round" fill="none" />
        <path d="M 15.5 21.5 C 16.4 20 18.5 19 21 19 C 25 19 28 21 28 25" stroke={color} strokeWidth="1.25" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
];

export function EcosystemCards() {
  return (
    <div id="ecosystem" className="ecosystemGrid">
      {pillars.map((pillar, index) => (
        <article
          key={pillar.id}
          className="ecosystemCard"
          style={{ "--cardAccent": pillar.accentColor } as React.CSSProperties}
        >
          {/* Top card metadata */}
          <div className="cardHeader">
            <span className="cardIndex">0{index + 1}</span>
            <div className="cardIconWrap">{pillar.icon(pillar.accentColor)}</div>
          </div>

          {/* Titles */}
          <div className="cardTitleGroup">
            <h3 className="cardName">{pillar.name}</h3>
            <span className="cardDevanagari">{pillar.devanagari}</span>
          </div>

          <p className="cardTagline">{pillar.tagline}</p>
          <p className="cardDescription">{pillar.description}</p>

          {/* Feature highlights */}
          <div className="capabilitiesWrap">
            <span className="capabilitiesHeading">Core Capabilities</span>
            <ul className="cardCapabilities">
              {pillar.capabilities.map((cap, i) => (
                <li key={i} className="capabilityItem">
                  <span className="capabilityBullet" style={{ backgroundColor: pillar.accentColor }} />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card Action Link */}
          <div className="cardFooter">
            <Link href={pillar.route} className="btnExploreModule">
              <span>Enter {pillar.name}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

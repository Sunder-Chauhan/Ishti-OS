/**
 * ISHTI Multilingual Platform Architecture — Types & Schemas
 * Supports 10 constitutional Indian languages with explicit translation coverage tracking.
 */

export type Locale =
  | "en"
  | "hi"
  | "bn"
  | "mr"
  | "gu"
  | "ta"
  | "te"
  | "kn"
  | "ml"
  | "pa";

export interface LanguageInfo {
  code: Locale;
  nativeName: string;
  englishName: string;
  script: string;
  direction: "ltr" | "rtl";
  coveragePercent: number;
  status: "complete" | "in_progress" | "scaffolded";
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "en",
    nativeName: "English",
    englishName: "English",
    script: "Latin",
    direction: "ltr",
    coveragePercent: 100,
    status: "complete",
  },
  {
    code: "hi",
    nativeName: "हिन्दी",
    englishName: "Hindi",
    script: "Devanagari",
    direction: "ltr",
    coveragePercent: 100,
    status: "complete",
  },
  {
    code: "bn",
    nativeName: "বাংলা",
    englishName: "Bengali",
    script: "Bengali",
    direction: "ltr",
    coveragePercent: 15,
    status: "scaffolded",
  },
  {
    code: "mr",
    nativeName: "मराठी",
    englishName: "Marathi",
    script: "Devanagari",
    direction: "ltr",
    coveragePercent: 15,
    status: "scaffolded",
  },
  {
    code: "gu",
    nativeName: "ગુજરાતી",
    englishName: "Gujarati",
    script: "Gujarati",
    direction: "ltr",
    coveragePercent: 15,
    status: "scaffolded",
  },
  {
    code: "ta",
    nativeName: "தமிழ்",
    englishName: "Tamil",
    script: "Tamil",
    direction: "ltr",
    coveragePercent: 15,
    status: "scaffolded",
  },
  {
    code: "te",
    nativeName: "తెలుగు",
    englishName: "Telugu",
    script: "Telugu",
    direction: "ltr",
    coveragePercent: 15,
    status: "scaffolded",
  },
  {
    code: "kn",
    nativeName: "ಕನ್ನಡ",
    englishName: "Kannada",
    script: "Kannada",
    direction: "ltr",
    coveragePercent: 15,
    status: "scaffolded",
  },
  {
    code: "ml",
    nativeName: "മലയാളം",
    englishName: "Malayalam",
    script: "Malayalam",
    direction: "ltr",
    coveragePercent: 15,
    status: "scaffolded",
  },
  {
    code: "pa",
    nativeName: "ਪੰਜਾਬੀ",
    englishName: "Punjabi",
    script: "Gurmukhi",
    direction: "ltr",
    coveragePercent: 15,
    status: "scaffolded",
  },
];

export interface TranslationDictionary {
  common: {
    brandTagline: string;
    signIn: string;
    signOut: string;
    close: string;
    back: string;
    explore: string;
    save: string;
    read: string;
    verified: string;
    publicDomain: string;
    inReview: string;
    publicBrowsing: string;
    privateSanctuary: string;
    language: string;
    selectLanguage: string;
    accessibility: string;
    skipToContent: string;
  };
  nav: {
    home: string;
    bhakti: string;
    panchang: string;
    puja: string;
    astro: string;
    experts: string;
    community: string;
    profile: string;
  };
  home: {
    kicker: string;
    headline: string;
    headlineHighlight: string;
    lead: string;
    exploreBtn: string;
    philosophyBtn: string;
    trustCanon: string;
    trustGuidance: string;
    trustAcharyas: string;
    philosophyKicker: string;
    philosophyTitle: string;
    philosophySubtitle: string;
  };
  bhakti: {
    title: string;
    tagline: string;
    description: string;
    verseOfDayTitle: string;
    searchPlaceholder: string;
    readCanonical: string;
  };
  panchang: {
    title: string;
    tagline: string;
    description: string;
    selectLocation: string;
    shubhaMuhurtas: string;
    ashubhaKaal: string;
  };
  puja: {
    title: string;
    tagline: string;
    description: string;
    bookAcharya: string;
    canonicalGuides: string;
  };
  astro: {
    title: string;
    tagline: string;
    description: string;
    calculateKundli: string;
    privacyNote: string;
    generateChart: string;
    saveProfile: string;
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: string;
    ayanamshaModel: string;
    planetaryDegrees: string;
  };
  experts: {
    title: string;
    tagline: string;
    description: string;
    bookConsultation: string;
    vetted: string;
  };
  community: {
    title: string;
    tagline: string;
    description: string;
    satsangCircles: string;
    participate: string;
    dignityCharter: string;
  };
  profile: {
    title: string;
    subtitle: string;
    guestNotice: string;
    signInPrompt: string;
    signOut: string;
    membershipRef: string;
    consentCenter: string;
    consentDesc: string;
    manageConsent: string;
    kundliSanctuary: string;
    kundliDesc: string;
    openAstro: string;
    consultationsTitle: string;
    consultationsDesc: string;
  };
  a11y: {
    title: string;
    subtitle: string;
    profilesTitle: string;
    textSize: string;
    lineHeight: string;
    contrast: string;
    normalContrast: string;
    highContrast: string;
    darkTheme: string;
    dyslexiaFont: string;
    reducedMotion: string;
    pauseAnimations: string;
    highlightLinks: string;
    readAloud: string;
    voiceNav: string;
    resetDefaults: string;
    seniorProfile: string;
    seniorProfileDesc: string;
    lowVisionProfile: string;
    lowVisionProfileDesc: string;
    dyslexiaProfile: string;
    dyslexiaProfileDesc: string;
  };
}

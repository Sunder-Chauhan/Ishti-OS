/**
 * ISHTI Universal Accessibility Centre — Types & Schemas
 */

export type TextSize = 100 | 115 | 125 | 140 | 150 | 175 | 200;
export type LineHeight = "normal" | "relaxed" | "loose";
export type LetterSpacing = "normal" | "wide" | "wider";
export type ContrastMode = "normal" | "high_contrast" | "dark";

export type AccessibilityProfileId =
  | "default"
  | "senior"
  | "low_vision"
  | "dyslexia"
  | "cognitive"
  | "motor"
  | "high_contrast";

export interface A11yPreferences {
  textSize: TextSize;
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
  contrast: ContrastMode;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  pauseAnimations: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
  activeProfile: AccessibilityProfileId;
}

export const DEFAULT_A11Y_PREFERENCES: A11yPreferences = {
  textSize: 100,
  lineHeight: "normal",
  letterSpacing: "normal",
  contrast: "normal",
  dyslexiaFont: false,
  reducedMotion: false,
  pauseAnimations: false,
  highlightLinks: false,
  bigCursor: false,
  activeProfile: "default",
};

export interface AccessibilityProfileInfo {
  id: AccessibilityProfileId;
  name: { en: string; hi: string };
  description: { en: string; hi: string };
  settings: Partial<A11yPreferences>;
}

export const ACCESSIBILITY_PROFILES: AccessibilityProfileInfo[] = [
  {
    id: "senior",
    name: {
      en: "Senior Calm Profile",
      hi: "वरिष्ठ साधक शांत स्वरूप",
    },
    description: {
      en: "Large 125% text, relaxed line spacing, and minimized distractions for effortless reading.",
      hi: "१२५% बड़ा पाठ, सहज पंक्ति अन्तराल और न्यूनतम विक्षेप।",
    },
    settings: {
      textSize: 125,
      lineHeight: "relaxed",
      letterSpacing: "wide",
      reducedMotion: true,
      pauseAnimations: true,
      contrast: "normal",
      activeProfile: "senior",
    },
  },
  {
    id: "low_vision",
    name: {
      en: "Low Vision / High Clarity",
      hi: "स्पष्ट दृष्टि स्वरूप",
    },
    description: {
      en: "150% text magnification, high contrast borders, and prominent interactive focus rings.",
      hi: "१५०% पाठ आवर्धन, स्पष्ट सीमाएं और उच्च कंट्रास्ट।",
    },
    settings: {
      textSize: 150,
      lineHeight: "loose",
      letterSpacing: "wider",
      contrast: "high_contrast",
      highlightLinks: true,
      bigCursor: true,
      activeProfile: "low_vision",
    },
  },
  {
    id: "dyslexia",
    name: {
      en: "Dyslexia-Friendly Reading",
      hi: "पठन-सुलभ स्वरूप",
    },
    description: {
      en: "Clean sans letterforms with expanded character spacing to prevent letter crowding.",
      hi: "स्पष्ट अक्षर बनावट और चौड़े अन्तराल पठन सुगमता हेतु।",
    },
    settings: {
      textSize: 115,
      lineHeight: "relaxed",
      letterSpacing: "wide",
      dyslexiaFont: true,
      activeProfile: "dyslexia",
    },
  },
  {
    id: "cognitive",
    name: {
      en: "Cognitive & Focus",
      hi: "एकाग्रता एवं शांति स्वरूप",
    },
    description: {
      en: "Static backgrounds, paused decorative animations, and highlighted clickable links.",
      hi: "स्थिर पृष्ठभूमि, रोके गए दृश्य प्रभाव एवं स्पष्ट लिंक्स।",
    },
    settings: {
      reducedMotion: true,
      pauseAnimations: true,
      highlightLinks: true,
      activeProfile: "cognitive",
    },
  },
  {
    id: "motor",
    name: {
      en: "Motor Accessibility",
      hi: "सहज स्पर्श स्वरूप (Motor Access)",
    },
    description: {
      en: "Large 54px touch targets, generous button spacing, and prominent focus indicators.",
      hi: "बड़े बटन (५४px), चौड़ा अन्तराल और स्पष्ट कीबोर्ड नेविगेशन।",
    },
    settings: {
      textSize: 115,
      bigCursor: true,
      highlightLinks: true,
      activeProfile: "motor",
    },
  },
  {
    id: "high_contrast",
    name: {
      en: "High Contrast / Sacred Dark",
      hi: "गंभीर श्याम स्वरूप (Dark Mode)",
    },
    description: {
      en: "Deep temple charcoal surface with warm gold accents for night reading and light sensitivity.",
      hi: "गहरा श्याम धरातल एवं स्वर्ण वर्ण रात्रि पठन हेतु।",
    },
    settings: {
      contrast: "dark",
      activeProfile: "high_contrast",
    },
  },
];

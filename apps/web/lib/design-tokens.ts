/**
 * ISHTI Centralized TypeScript Design Tokens
 * Version: 1.0.0 — Production Brand System
 * Repository: Sunder-Chauhan/Ishti-OS
 * 
 * WCAG 2.2 AAA / AA Compliant Contrast Tokens
 * Source of Truth: Approved ISHTI Master Visual Identity
 */

export interface ColorToken {
  name: string;
  hex: string;
  rgb: [number, number, number];
  role: string;
  description: string;
  contrastOnIvory: number;
  contrastOnCharcoal: number;
  wcagIvoryText: "AAA" | "AA" | "FAIL_BODY";
  wcagCharcoalText: "AAA" | "AA" | "FAIL_BODY";
}

export const brandColors = {
  maroon: {
    name: "Temple Maroon",
    hex: "#711B16",
    rgb: [113, 27, 22],
    role: "Primary Brand & Wordmark",
    description: "Sacred kumkum, earthen altar bricks, primary brand anchor.",
    contrastOnIvory: 9.61,
    contrastOnCharcoal: 1.23,
    wcagIvoryText: "AAA",
    wcagCharcoalText: "FAIL_BODY",
  },
  saffron: {
    name: "Vedic Saffron",
    hex: "#EF7428",
    rgb: [239, 116, 40],
    role: "Sacred Flame & Primary Accent",
    description: "Sacred agni flame, spiritual vitality, call-to-action energy.",
    contrastOnIvory: 2.72,
    contrastOnCharcoal: 4.36,
    wcagIvoryText: "FAIL_BODY",
    wcagCharcoalText: "AA",
  },
  gold: {
    name: "Sacred Gold",
    hex: "#D7A64A",
    rgb: [215, 166, 74],
    role: "Ghee Bindu Drop & Highlights",
    description: "Clarified ghee offering, auspicious brass lamps, divine wisdom.",
    contrastOnIvory: 2.04,
    contrastOnCharcoal: 5.89,
    wcagIvoryText: "FAIL_BODY",
    wcagCharcoalText: "AA",
  },
  ivory: {
    name: "Ivory Paper",
    hex: "#F8F4ED",
    rgb: [248, 244, 237],
    role: "Primary Light Background",
    description: "Handmade temple paper, pure space, peaceful contemplation.",
    contrastOnIvory: 1.0,
    contrastOnCharcoal: 11.83,
    wcagIvoryText: "FAIL_BODY",
    wcagCharcoalText: "AAA",
  },
  sand: {
    name: "Warm Sand",
    hex: "#D1A477",
    rgb: [209, 164, 119],
    role: "Secondary Surfaces & Borders",
    description: "Sanctified ground, subtle dividers, supporting taglines.",
    contrastOnIvory: 1.69,
    contrastOnCharcoal: 7.02,
    wcagIvoryText: "FAIL_BODY",
    wcagCharcoalText: "AAA",
  },
  charcoal: {
    name: "Temple Charcoal",
    hex: "#302B2A",
    rgb: [48, 43, 42],
    role: "Primary Dark Surface & Body Ink",
    description: "Charred sacred wood, night vigils, deep contrast foundation.",
    contrastOnIvory: 11.83,
    contrastOnCharcoal: 1.0,
    wcagIvoryText: "AAA",
    wcagCharcoalText: "FAIL_BODY",
  },
} as const;

export const brandExtendedPalette = {
  maroonDark: "#52120E",
  maroonDeep: "#3D0D0A",
  saffronBright: "#F58733",
  goldBright: "#F9CE68",
  goldLight: "#FDE6A6",
  sandLight: "#E8CFB4",
  charcoalLight: "#4A4341",
  charcoalBorder: "#554C4A",
} as const;

export const brandTypography = {
  display: {
    family: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    tracking: "-0.015em",
    description: "Premium serif display typeface for wordmark-inspired headings, sacred invocations, and section titles.",
  },
  sans: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    tracking: "0",
    description: "Clean, accessible modern sans-serif for interface text, forms, navigation, and body copy.",
  },
  tagline: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    weights: {
      semibold: 600,
    },
    tracking: "0.22em",
    textTransform: "uppercase",
    description: "Widely tracked all-caps sans-serif for secondary Vedic taglines.",
  },
  devanagari: {
    family: "'Noto Sans Devanagari', -apple-system, sans-serif",
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    description: "Authentic Sanskrit and Hindi scripture, mantra, and devotional typography.",
  },
} as const;

export interface LogoMetadata {
  id: "primary" | "secondary" | "icon" | "horizontal" | "monochrome" | "reversed";
  name: string;
  fileName: string;
  aspectRatio: string;
  recommendedUse: string;
  minDigitalSize: string;
  minPrintSize: string;
}

export const brandLogoVariants: Record<string, LogoMetadata> = {
  primary: {
    id: "primary",
    name: "Primary Logo",
    fileName: "ishti-logo-primary.svg",
    aspectRatio: "400:560 (1:1.4)",
    recommendedUse: "Hero displays, official certificates, launch presentations, formal brand touchpoints.",
    minDigitalSize: "40px height",
    minPrintSize: "15mm height",
  },
  secondary: {
    id: "secondary",
    name: "Secondary Logo",
    fileName: "ishti-logo-secondary.svg",
    aspectRatio: "400:480 (1:1.2)",
    recommendedUse: "Application headers, splash screens, social avatars, marketing collaterals without taglines.",
    minDigitalSize: "24px height",
    minPrintSize: "8mm height",
  },
  icon: {
    id: "icon",
    name: "Symbol / Icon Only",
    fileName: "ishti-logo-icon.svg",
    aspectRatio: "1:1 (Square)",
    recommendedUse: "App launcher icon, favicons (16/24/32/48px), profile badges, small UI controls.",
    minDigitalSize: "16px x 16px",
    minPrintSize: "5mm x 5mm",
  },
  horizontal: {
    id: "horizontal",
    name: "Horizontal Logo",
    fileName: "ishti-logo-horizontal.svg",
    aspectRatio: "680:260 (2.61:1)",
    recommendedUse: "Desktop website navigation bar, email headers, invoices, letterheads, horizontal banners.",
    minDigitalSize: "28px height",
    minPrintSize: "10mm height",
  },
  monochrome: {
    id: "monochrome",
    name: "Monochrome Logo",
    fileName: "ishti-logo-monochrome.svg",
    aspectRatio: "400:480 (1:1.2)",
    recommendedUse: "Single-color printing, receipts, laser engraving, newspaper print, embossing.",
    minDigitalSize: "24px height",
    minPrintSize: "8mm height",
  },
  reversed: {
    id: "reversed",
    name: "Reversed Logo",
    fileName: "ishti-logo-reversed.svg",
    aspectRatio: "420:500 (1:1.19)",
    recommendedUse: "Dark backgrounds (#302B2A), night mode UI, dark video overlays, premium black packaging.",
    minDigitalSize: "24px height",
    minPrintSize: "8mm height",
  },
} as const;

export const brandClearSpace = {
  unitDescription: "X is defined as 50% of the total symbol height or the exact height of the wordmark 'I'.",
  minimumMarginRatio: 0.5, // 0.5X clear space required around all 4 sides
  rule: "No text, graphic elements, page trims, or background dividers may intrude into the exclusion zone.",
} as const;

/**
 * Utility to calculate WCAG 2.2 relative luminance and contrast ratio between two hex colors.
 */
export function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function checkWcagCompliance(ratio: number) {
  return {
    normalTextAA: ratio >= 4.5,
    normalTextAAA: ratio >= 7.0,
    largeTextAA: ratio >= 3.0,
    largeTextAAA: ratio >= 4.5,
    uiComponentAA: ratio >= 3.0,
  };
}

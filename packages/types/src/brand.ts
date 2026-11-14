/**
 * ISHTI visual tokens, brand guidelines v1.0.
 * Centralized design tokens and WCAG 2.2 AAA/AA compliant contrast values.
 */

export const ishtiWorkingColors = {
  maroon: "#711B16",    // Temple Maroon
  saffron: "#EF7428",   // Vedic Saffron
  gold: "#D7A64A",      // Sacred Gold
  ivory: "#F8F4ED",     // Ivory Paper
  sand: "#D1A477",      // Warm Sand
  charcoal: "#302B2A",  // Temple Charcoal
} as const;

export const brandColor = {
  maroon: ishtiWorkingColors.maroon,
  saffron: ishtiWorkingColors.saffron,
  gold: ishtiWorkingColors.gold,
  ivory: ishtiWorkingColors.ivory,
  sand: ishtiWorkingColors.sand,
  charcoal: ishtiWorkingColors.charcoal,
  // Backwards compatibility aliases
  terracotta: "#9B684E",
  sage: "#777B62",
} as const;

export const brandInk = {
  onIvory: "#302B2A",
  mutedOnIvory: "#584F4D",
  onCharcoal: "#F8F4ED",
  mutedOnCharcoal: "#D1A477",
  accentOnCharcoal: "#D7A64A",
} as const;

export const brandFont = {
  display: "Cormorant Garamond",
  sans: "Inter",
  devanagari: "Noto Sans Devanagari",
} as const;

export const brandThemeStyle = {
  "--maroon": brandColor.maroon,
  "--saffron": brandColor.saffron,
  "--gold": brandColor.gold,
  "--ivory": brandColor.ivory,
  "--sand": brandColor.sand,
  "--charcoal": brandColor.charcoal,
  "--terracotta": brandColor.terracotta,
  "--sage": brandColor.sage,
  "--ink": brandInk.onIvory,
  "--muted": brandInk.mutedOnIvory,
  "--on-charcoal": brandInk.onCharcoal,
  "--on-charcoal-muted": brandInk.mutedOnCharcoal,
  "--on-charcoal-accent": brandInk.accentOnCharcoal,
} as const;

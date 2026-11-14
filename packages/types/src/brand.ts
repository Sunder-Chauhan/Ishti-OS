/**
 * YUGON visual tokens, brand guidelines v1.0.
 * Palette hex values are the proposed brand colours. Text roles below were
 * checked against WCAG 2.2 before use.
 *
 * Contrast on Ivory (#F1EBDD):
 * - Temple Charcoal #20251F — 13.13:1, body and interface text
 * - Antique Gold #B18A50 — 2.67:1, decorative only (rules, marks). Not text, not focus.
 * - Terracotta #9B684E — 3.94:1, large text or non-text accents
 * - Sage #777B62 — 3.69:1, large text on Ivory only, or non-text accents
 * - Muted Sand #D9CBB2 — 1.35:1, secondary surfaces. Text on Sand must be Charcoal (9.76:1).
 *
 * Contrast on Temple Charcoal:
 * - Ivory — 13.13:1
 * - Muted Sand — 9.76:1
 * - Antique Gold — 4.92:1, so gold text is allowed on Charcoal
 *
 * mutedOnIvory is Sage mixed 51% toward Charcoal so secondary copy clears 7:1
 * without introducing a colour outside the Sage–Charcoal family.
 */
export const brandColor = {
  charcoal: "#20251F",
  gold: "#B18A50",
  ivory: "#F1EBDD",
  terracotta: "#9B684E",
  sage: "#777B62",
  sand: "#D9CBB2",
} as const;

export const brandInk = {
  onIvory: "#20251F",
  mutedOnIvory: "#4B4F40",
  onCharcoal: "#F1EBDD",
  mutedOnCharcoal: "#D9CBB2",
  accentOnCharcoal: "#B18A50",
} as const;

export const brandFont = {
  display: "Cormorant Garamond",
  sans: "Inter",
  devanagari: "Noto Sans Devanagari",
} as const;

export const brandThemeStyle = {
  "--charcoal": brandColor.charcoal,
  "--gold": brandColor.gold,
  "--ivory": brandColor.ivory,
  "--terracotta": brandColor.terracotta,
  "--sage": brandColor.sage,
  "--sand": brandColor.sand,
  "--ink": brandInk.onIvory,
  "--muted": brandInk.mutedOnIvory,
  "--on-charcoal": brandInk.onCharcoal,
  "--on-charcoal-muted": brandInk.mutedOnCharcoal,
  "--on-charcoal-accent": brandInk.accentOnCharcoal,
} as const;

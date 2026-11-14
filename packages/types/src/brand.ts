/**
 * ISHTI visual tokens, brand guidelines v1.0 & v1.1.
 */
export const brandColor = {
  charcoal: "#20251F",
  gold: "#B18A50",
  ivory: "#F1EBDD",
  terracotta: "#9B684E",
  sage: "#777B62",
  sand: "#D9CBB2",
  // v1.1 tokens
  templeMaroon: "#711B16",
  vedicSaffron: "#EF7428",
  sacredGold: "#D7A64A",
  ivoryPaper: "#F8F4ED",
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

/**
 * ISHTI Brand Design Tokens
 * Master visual truth grounded in Vedic geometry and Temple aesthetics.
 */

export const ISHTI_COLORS = {
  // Core Brand Palette
  templeMaroon: '#711B16',
  templeMaroonDark: '#5D1510',
  templeMaroonDeep: '#4A110D',
  vedicSaffron: '#EF7428',
  vedicSaffronLight: '#F58A45',
  sacredGold: '#D7A64A',
  sacredGoldLight: '#FFF3B3',
  sacredGoldDark: '#B27E24',
  ivoryPaper: '#F8F4ED',
  ivoryPaperWarm: '#FDFBF7',
  warmSand: '#D1A477',
  warmBronze: '#8B6846',
  mutedGold: '#9E764E',
  templeCharcoal: '#2A2726',
  slateCharcoal: '#282A36',
  altarShadow: '#6E1612',
  altarLight: '#E86424',
} as const;

export const ISHTI_TYPOGRAPHY = {
  fontFamilies: {
    serif: "'Cinzel', 'Trajan Pro', Georgia, serif",
    subSerif: "'Cormorant Garamond', 'Times New Roman', Georgia, serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  letterSpacing: {
    tighter: '-0.02em',
    normal: '0em',
    wide: '0.05em',
    wider: '0.12em',
    widest: '0.22em',
  },
} as const;

export const ISHTI_CLEARSPACE = {
  minIconPadding: 0.25,
  minWordmarkPadding: 0.5,
  minIconSizePx: 16,
} as const;

export type IshtiLogoVariant = 
  | 'primary'
  | 'secondary'
  | 'icon'
  | 'horizontal'
  | 'monochrome'
  | 'reversed';

export interface IshtiLogoProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
  variant?: IshtiLogoVariant;
  className?: string;
  decorative?: boolean;
  title?: string;
  desc?: string;
}

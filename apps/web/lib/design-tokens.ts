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

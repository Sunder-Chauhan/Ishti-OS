import type { CSSProperties, ImgHTMLAttributes } from 'react';

export type IshtiLogoVariant =
  | 'primary'
  | 'secondary'
  | 'icon'
  | 'horizontal'
  | 'monochrome'
  | 'reversed';

export interface IshtiLogoVariantMeta {
  variant: IshtiLogoVariant;
  filename: string;
  src: string;
  viewBox: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  aspectRatio: number;
  title: string;
  defaultAlt: string;
  description: string;
}

export const ISHTI_LOGO_VARIANTS: Record<IshtiLogoVariant, IshtiLogoVariantMeta> = {
  primary: {
    variant: 'primary',
    filename: 'ishti-primary.svg',
    src: '/brand/ishti-primary.svg',
    viewBox: '0 0 400 540',
    intrinsicWidth: 400,
    intrinsicHeight: 540,
    aspectRatio: 400 / 540,
    title: 'ISHTI Primary Logo',
    defaultAlt: 'ISHTI Primary Logo - Full Symbol, Wordmark and Supporting Taglines',
    description: 'ISHTI sacred fire altar symbol, custom serif wordmark, and supporting Vedic taglines',
  },
  secondary: {
    variant: 'secondary',
    filename: 'ishti-secondary.svg',
    src: '/brand/ishti-secondary.svg',
    viewBox: '0 0 400 460',
    intrinsicWidth: 400,
    intrinsicHeight: 460,
    aspectRatio: 400 / 460,
    title: 'ISHTI Secondary Logo',
    defaultAlt: 'ISHTI Secondary Logo - Symbol and Wordmark',
    description: 'ISHTI sacred fire altar symbol with custom serif wordmark below',
  },
  icon: {
    variant: 'icon',
    filename: 'ishti-icon.svg',
    src: '/brand/ishti-icon.svg',
    viewBox: '0 0 400 400',
    intrinsicWidth: 400,
    intrinsicHeight: 400,
    aspectRatio: 1,
    title: 'ISHTI Icon',
    defaultAlt: 'ISHTI Icon - Sacred Vedic Flame and Stepped Altar',
    description: 'Sacred Vedic flame with a golden bindu seed rising from a three-tiered stepped altar',
  },
  horizontal: {
    variant: 'horizontal',
    filename: 'ishti-horizontal.svg',
    src: '/brand/ishti-horizontal.svg',
    viewBox: '0 0 680 240',
    intrinsicWidth: 680,
    intrinsicHeight: 240,
    aspectRatio: 680 / 240,
    title: 'ISHTI Horizontal Logo',
    defaultAlt: 'ISHTI Horizontal Logo - Symbol Left, Wordmark and Tagline Right',
    description: 'Horizontal lockup with sacred fire altar symbol on the left and ISHTI wordmark with stacked tagline on the right',
  },
  monochrome: {
    variant: 'monochrome',
    filename: 'ishti-monochrome.svg',
    src: '/brand/ishti-monochrome.svg',
    viewBox: '0 0 400 460',
    intrinsicWidth: 400,
    intrinsicHeight: 460,
    aspectRatio: 400 / 460,
    title: 'ISHTI Monochrome Logo',
    defaultAlt: 'ISHTI Monochrome Logo - Single Colour Deep Charcoal Symbol and Wordmark',
    description: 'Single-colour deep charcoal (#2A2726) reproduction of ISHTI sacred fire altar and wordmark',
  },
  reversed: {
    variant: 'reversed',
    filename: 'ishti-reversed.svg',
    src: '/brand/ishti-reversed.svg',
    viewBox: '0 0 400 460',
    intrinsicWidth: 400,
    intrinsicHeight: 460,
    aspectRatio: 400 / 460,
    title: 'ISHTI Reversed Logo',
    defaultAlt: 'ISHTI Reversed Logo - Sacred Gold and Agni on Dark Slate Charcoal Surface',
    description: 'Reversed contrast lockup calibrated for dark surfaces (#282A36) with luminous gold wordmark',
  },
};

export interface IshtiLogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  /**
   * The official approved ISHTI logo variant to render.
   * Defaults to 'secondary' (sacred symbol and custom wordmark).
   */
  variant?: IshtiLogoVariant;

  /**
   * Shorthand size parameter.
   * Automatically calculates proportional dimensions preserving aspect ratio without distortion.
   */
  size?: number | string;

  /**
   * Explicit display width.
   */
  width?: number | string;

  /**
   * Explicit display height.
   */
  height?: number | string;

  /**
   * Optional CSS class name for positioning and layout.
   * Note: CSS filters that alter logo artwork colors are strictly prohibited.
   */
  className?: string;

  /**
   * Custom inline styles.
   */
  style?: CSSProperties;

  /**
   * When true, marks the logo as purely decorative (alt="", role="presentation", aria-hidden="true").
   * When false (default), provides accessible labels and title.
   */
  decorative?: boolean;

  /**
   * Optional custom accessible title/alt override.
   */
  title?: string;

  /**
   * Optional description for accessibility (maps to alt text).
   */
  desc?: string;

  /**
   * Prioritize image loading (e.g. above-the-fold brand headers).
   */
  priority?: boolean;
}

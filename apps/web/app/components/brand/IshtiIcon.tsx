import React, { useId } from "react";

export interface IshtiIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  decorative?: boolean;
  title?: string;
  description?: string;
  idPrefix?: string;
  theme?: "color" | "monochrome" | "reversed";
}

/**
 * ISHTI Icon Component
 * 
 * The sacred Vedic symbol:
 * - Four-tiered stepped altar (Vedi / Yajna Kunda) in 3D isometric perspective
 * - Sacred Agni flame rising from the hearth
 * - Golden Bindu seed drop (ghee offering / spark of consciousness)
 * - Dynamic floating embers
 * 
 * Highly recognizable and crisp from 16px to 512px.
 */
export function IshtiIcon({
  size = 48,
  width,
  height,
  decorative = true,
  title = "ISHTI Icon",
  description = "Sacred Vedic flame with a golden bindu seed rising from a four-tiered stepped altar",
  idPrefix,
  theme = "color",
  className = "",
  ...props
}: IshtiIconProps) {
  const reactId = useId();
  const prefix = idPrefix || `ishti_icon_${reactId.replace(/:/g, "_")}`;

  const isMonochrome = theme === "monochrome";
  const isReversed = theme === "reversed";

  const renderedWidth = width ?? size;
  const renderedHeight = height ?? size;

  const fLeft1 = isMonochrome ? "#302B2A" : isReversed ? `url(#${prefix}-rev-altar-left)` : `url(#${prefix}-altar-left-1)`;
  const fLeft2 = isMonochrome ? "#302B2A" : isReversed ? `url(#${prefix}-rev-altar-left)` : `url(#${prefix}-altar-left-2)`;
  const fLeft3 = isMonochrome ? "#302B2A" : isReversed ? `url(#${prefix}-rev-altar-left)` : `url(#${prefix}-altar-left-3)`;
  const fLeft4 = isMonochrome ? "#302B2A" : isReversed ? `url(#${prefix}-rev-altar-left)` : `url(#${prefix}-altar-left-4)`;

  const fRight1 = isMonochrome ? "#302B2A" : isReversed ? `url(#${prefix}-rev-altar-right)` : `url(#${prefix}-altar-right-1)`;
  const fRight2 = isMonochrome ? "#302B2A" : isReversed ? `url(#${prefix}-rev-altar-right)` : `url(#${prefix}-altar-right-2)`;
  const fRight3 = isMonochrome ? "#302B2A" : isReversed ? `url(#${prefix}-rev-altar-right)` : `url(#${prefix}-altar-right-3)`;
  const fRight4 = isMonochrome ? "#302B2A" : isReversed ? `url(#${prefix}-rev-altar-right)` : `url(#${prefix}-altar-right-4)`;

  const fTreadL = isMonochrome ? "#F8F4ED" : isReversed ? "#F8F4ED" : `url(#${prefix}-altar-tread-left)`;
  const fTreadR = isMonochrome ? "#D8D2C6" : isReversed ? "#D7A64A" : `url(#${prefix}-altar-tread-right)`;

  const fFlame = isMonochrome ? "#302B2A" : isReversed ? `url(#${prefix}-rev-flame)` : `url(#${prefix}-flame-main)`;
  const fSpire = isMonochrome ? "#302B2A" : isReversed ? "#F8F4ED" : `url(#${prefix}-flame-spire)`;
  const fBindu = isMonochrome ? "#302B2A" : isReversed ? "#F8F4ED" : `url(#${prefix}-bindu)`;
  const strokeMono = isMonochrome ? 'stroke="#F8F4ED" strokeWidth="2.5" strokeLinejoin="round"' : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      width={renderedWidth}
      height={renderedHeight}
      fill="none"
      className={className}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      {...props}
    >
      {!decorative && title && <title>{title}</title>}
      {!decorative && description && <desc>{description}</desc>}

      <defs>
        {!isMonochrome && !isReversed && (
          <>
            <linearGradient id={`${prefix}-flame-main`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#711B16" />
              <stop offset="35%" stopColor="#C23616" />
              <stop offset="70%" stopColor="#EF7428" />
              <stop offset="100%" stopColor="#F7B731" />
            </linearGradient>
            <linearGradient id={`${prefix}-flame-spire`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#D3461A" />
              <stop offset="50%" stopColor="#EF7428" />
              <stop offset="100%" stopColor="#FDCB58" />
            </linearGradient>
            <radialGradient id={`${prefix}-bindu`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFF2A3" />
              <stop offset="60%" stopColor="#D7A64A" />
              <stop offset="100%" stopColor="#EF7428" />
            </radialGradient>
            <linearGradient id={`${prefix}-altar-left-1`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B23E1D" />
              <stop offset="100%" stopColor="#DE6424" />
            </linearGradient>
            <linearGradient id={`${prefix}-altar-left-2`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C2471F" />
              <stop offset="100%" stopColor="#E96F26" />
            </linearGradient>
            <linearGradient id={`${prefix}-altar-left-3`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CF5122" />
              <stop offset="100%" stopColor="#F27B2A" />
            </linearGradient>
            <linearGradient id={`${prefix}-altar-left-4`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC5D25" />
              <stop offset="100%" stopColor="#F98933" />
            </linearGradient>
            <linearGradient id={`${prefix}-altar-right-1`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7B1D16" />
              <stop offset="100%" stopColor="#54120D" />
            </linearGradient>
            <linearGradient id={`${prefix}-altar-right-2`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#882119" />
              <stop offset="100%" stopColor="#601510" />
            </linearGradient>
            <linearGradient id={`${prefix}-altar-right-3`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#96261D" />
              <stop offset="100%" stopColor="#6E1913" />
            </linearGradient>
            <linearGradient id={`${prefix}-altar-right-4`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A52C21" />
              <stop offset="100%" stopColor="#7B1E16" />
            </linearGradient>
            <linearGradient id={`${prefix}-altar-tread-left`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF7428" />
              <stop offset="100%" stopColor="#F9AB43" />
            </linearGradient>
            <linearGradient id={`${prefix}-altar-tread-right`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E59938" />
              <stop offset="100%" stopColor="#9C271C" />
            </linearGradient>
          </>
        )}
        {isReversed && (
          <>
            <linearGradient id={`${prefix}-rev-flame`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#D1A477" />
              <stop offset="50%" stopColor="#D7A64A" />
              <stop offset="100%" stopColor="#F8F4ED" />
            </linearGradient>
            <linearGradient id={`${prefix}-rev-altar-left`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D1A477" />
              <stop offset="100%" stopColor="#E4C19C" />
            </linearGradient>
            <linearGradient id={`${prefix}-rev-altar-right`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A87B50" />
              <stop offset="100%" stopColor="#845D36" />
            </linearGradient>
          </>
        )}
      </defs>

      <g className="ishti-symbol-group">
        {/* Tier 1 (Base) */}
        <polygon points="200,358 68,303 68,318 200,373" fill={fLeft1} stroke={isMonochrome ? "#F8F4ED" : undefined} strokeWidth={isMonochrome ? 2.5 : undefined} strokeLinejoin="round" />
        <polygon points="200,358 332,303 332,318 200,373" fill={fRight1} stroke={isMonochrome ? "#F8F4ED" : undefined} strokeWidth={isMonochrome ? 2.5 : undefined} strokeLinejoin="round" />
        <polygon points="200,358 68,303 94,292 200,344" fill={fTreadL} />
        <polygon points="200,358 332,303 306,292 200,344" fill={fTreadR} />

        {/* Tier 2 */}
        <polygon points="200,344 94,292 94,306 200,358" fill={fLeft2} stroke={isMonochrome ? "#F8F4ED" : undefined} strokeWidth={isMonochrome ? 2.5 : undefined} strokeLinejoin="round" />
        <polygon points="200,344 306,292 306,306 200,358" fill={fRight2} stroke={isMonochrome ? "#F8F4ED" : undefined} strokeWidth={isMonochrome ? 2.5 : undefined} strokeLinejoin="round" />
        <polygon points="200,344 94,292 120,281 200,330" fill={fTreadL} />
        <polygon points="200,344 306,292 280,281 200,330" fill={fTreadR} />

        {/* Tier 3 */}
        <polygon points="200,330 120,281 120,294 200,344" fill={fLeft3} stroke={isMonochrome ? "#F8F4ED" : undefined} strokeWidth={isMonochrome ? 2.5 : undefined} strokeLinejoin="round" />
        <polygon points="200,330 280,281 280,294 200,344" fill={fRight3} stroke={isMonochrome ? "#F8F4ED" : undefined} strokeWidth={isMonochrome ? 2.5 : undefined} strokeLinejoin="round" />
        <polygon points="200,330 120,281 146,270 200,316" fill={fTreadL} />
        <polygon points="200,330 280,281 254,270 200,316" fill={fTreadR} />

        {/* Tier 4 (Top Platform) */}
        <polygon points="200,316 146,270 146,282 200,330" fill={fLeft4} stroke={isMonochrome ? "#F8F4ED" : undefined} strokeWidth={isMonochrome ? 2.5 : undefined} strokeLinejoin="round" />
        <polygon points="200,316 254,270 254,282 200,330" fill={fRight4} stroke={isMonochrome ? "#F8F4ED" : undefined} strokeWidth={isMonochrome ? 2.5 : undefined} strokeLinejoin="round" />
        <polygon points="200,316 146,270 200,248 254,270" fill={isMonochrome ? "#302B2A" : "#EF7428"} />
        <polygon points="200,312 152,270 200,252 248,270" fill={isMonochrome ? "#F8F4ED" : "#99261B"} />

        {/* Agni Flame */}
        <path d="M 182,266 C 160,268 135,254 124,226 C 114,198 122,168 144,142 C 148,137 154,142 152,148 C 142,172 144,194 158,212 C 168,224 178,232 186,242 Z" fill={fFlame} />
        <path d="M 218,266 C 240,268 265,254 276,226 C 286,198 278,168 256,142 C 252,137 246,142 248,148 C 258,172 256,194 242,212 C 232,224 222,232 214,242 Z" fill={fFlame} />
        <path d="M 174,236 C 158,222 152,192 160,162 C 164,146 172,130 178,114 C 180,109 184,112 183,117 C 178,138 182,156 192,172 C 196,178 198,186 196,194 Z" fill={fFlame} />
        <path d="M 226,236 C 242,222 248,192 240,162 C 236,146 228,130 222,114 C 220,109 216,112 217,117 C 222,138 218,156 208,172 C 204,178 202,186 204,194 Z" fill={fFlame} />
        <path d="M 188,212 C 186,182 192,152 198,124 C 202,104 204,84 205,62 C 205.5,58 208.5,58 209,62 C 211,82 213,102 211,122 C 209,148 208,176 212,212 C 208,216 192,216 188,212 Z" fill={fSpire} />

        {/* Negative space cradle & Golden Bindu Seed */}
        <path d="M 200,214 C 188,226 188,242 200,254 C 212,242 212,226 200,214 Z" fill={isReversed ? "#302B2A" : "#F8F4ED"} />
        <path d="M 200,219 C 193,228 193,239 200,248 C 207,239 207,228 200,219 Z" fill={fBindu} />

        {/* Embers */}
        <path d="M 207,40 C 204.5,43.5 204.5,47.5 207,51 C 209.5,47.5 209.5,43.5 207,40 Z" fill={fSpire} />
        <path d="M 175,82 C 173,85 173.5,88 176,90 C 178,88 177.5,85 175,82 Z" fill={fSpire} />
        <path d="M 227,88 C 225,91 225.5,94 228,96 C 230,94 229.5,91 227,88 Z" fill={fSpire} />
        <circle cx="152" cy="116" r="2.2" fill={fFlame} />
        <circle cx="254" cy="126" r="2.2" fill={fFlame} />
      </g>
    </svg>
  );
}

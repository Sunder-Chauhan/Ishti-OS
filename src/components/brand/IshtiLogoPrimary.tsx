import React, { useId } from "react";
import { IshtiIcon } from "./IshtiIcon";
import { IshtiWordmark } from "./IshtiWordmark";

export interface IshtiLogoPrimaryProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  width?: number | string;
  height?: number | string;
  decorative?: boolean;
  title?: string;
  description?: string;
  idPrefix?: string;
  theme?: "color" | "monochrome" | "reversed";
}

/**
 * ISHTI Primary Logo Component
 * 
 * Complete formal identity system:
 * - Symbol (Flame + Altar + Bindu + Sparks) on top
 * - Custom Outlined Wordmark "ISHTI" in center
 * - Supporting Tagline Line 1: "TRANSFORMATIVE RITUALS & OFFERINGS" (widely tracked all-caps)
 * - Supporting Tagline Line 2: "Vedic Essence & Rituals" (title case serif)
 * - Aspect ratio: 400:560 (1:1.4)
 * 
 * Recommended for hero landing pages, official certificates, launch presentations, and formal brand assets.
 */
export function IshtiLogoPrimary({
  size,
  width = 240,
  height,
  decorative = true,
  title = "ISHTI Primary Logo",
  description = "ISHTI sacred fire altar symbol, custom serif wordmark, and taglines: Transformative Rituals & Offerings, Vedic Essence & Rituals",
  idPrefix,
  theme = "color",
  className = "",
  ...props
}: IshtiLogoPrimaryProps) {
  const reactId = useId();
  const prefix = idPrefix || `ishti_pri_${reactId.replace(/:/g, "_")}`;

  const isMonochrome = theme === "monochrome";
  const isReversed = theme === "reversed";

  const wordmarkFill = isMonochrome ? "#302B2A" : isReversed ? "#F8F4ED" : "#711B16";
  const tagline1Fill = isMonochrome ? "#584F4D" : isReversed ? "#D1A477" : "#D1A477";
  const tagline2Fill = isMonochrome ? "#7A6F6C" : isReversed ? "#D7A64A" : "#A87B50";

  const renderedWidth = size ?? width;
  const renderedHeight = size ? Number(size) * 1.4 : (height ?? "auto");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 560"
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

      {/* Symbol Component */}
      <IshtiIcon
        width={400}
        height={400}
        idPrefix={`${prefix}_sym`}
        theme={theme}
        decorative={true}
      />

      {/* Outlined Wordmark */}
      <g transform="translate(97, 400)">
        <IshtiWordmark width={206} height={54} fill={wordmarkFill} decorative={true} />
      </g>

      {/* Tagline 1: All Caps, Widely Tracked Sans */}
      <text
        x="200"
        y="482"
        textAnchor="middle"
        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="10.5"
        fontWeight="600"
        letterSpacing="0.22em"
        fill={tagline1Fill}
      >
        TRANSFORMATIVE RITUALS &amp; OFFERINGS
      </text>

      {/* Tagline 2: Title Case Serif */}
      <text
        x="200"
        y="504"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, 'Times New Roman', serif"
        fontSize="13"
        fontStyle="italic"
        fontWeight="500"
        letterSpacing="0.05em"
        fill={tagline2Fill}
      >
        Vedic Essence &amp; Rituals
      </text>
    </svg>
  );
}

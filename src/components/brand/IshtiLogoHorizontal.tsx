import React, { useId } from "react";
import { IshtiIcon } from "./IshtiIcon";
import { IshtiWordmark } from "./IshtiWordmark";

export interface IshtiLogoHorizontalProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  decorative?: boolean;
  title?: string;
  description?: string;
  idPrefix?: string;
  theme?: "color" | "monochrome" | "reversed";
}

/**
 * ISHTI Horizontal Logo Component
 * 
 * Layout:
 * - Symbol (Flame + Altar) on left
 * - Outlined Wordmark "ISHTI" on right
 * - Stacked tagline on right below wordmark:
 *   TRANSFORMATIVE
 *   RITUALS & OFFERINGS
 * - Aspect ratio: 680:260 (2.61:1)
 * 
 * Recommended for desktop navigation headers, email templates, invoices, and letterheads.
 */
export function IshtiLogoHorizontal({
  width = 340,
  height = 130,
  decorative = true,
  title = "ISHTI Horizontal Logo",
  description = "Horizontal arrangement with the sacred fire altar symbol on the left and ISHTI wordmark with stacked tagline on the right",
  idPrefix,
  theme = "color",
  className = "",
  ...props
}: IshtiLogoHorizontalProps) {
  const reactId = useId();
  const prefix = idPrefix || `ishti_horiz_${reactId.replace(/:/g, "_")}`;

  const isMonochrome = theme === "monochrome";
  const isReversed = theme === "reversed";

  const wordmarkFill = isMonochrome ? "#302B2A" : isReversed ? "#F8F4ED" : "#711B16";
  const taglineFill = isMonochrome ? "#584F4D" : isReversed ? "#D1A477" : "#D1A477";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 680 260"
      width={width}
      height={height}
      fill="none"
      className={className}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      {...props}
    >
      {!decorative && title && <title>{title}</title>}
      {!decorative && description && <desc>{description}</desc>}

      {/* Symbol on Left */}
      <g transform="translate(10, -50) scale(0.85)">
        <IshtiIcon
          width={400}
          height={400}
          idPrefix={`${prefix}_sym`}
          theme={theme}
          decorative={true}
        />
      </g>

      {/* Wordmark on Right */}
      <g transform="translate(310, 85) scale(1.45)">
        <IshtiWordmark width={206} height={54} fill={wordmarkFill} decorative={true} />
      </g>

      {/* Stacked Tagline */}
      <text
        x="312"
        y="188"
        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="13.5"
        fontWeight="600"
        letterSpacing="0.2em"
        fill={taglineFill}
      >
        TRANSFORMATIVE
      </text>
      <text
        x="312"
        y="210"
        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="13.5"
        fontWeight="600"
        letterSpacing="0.2em"
        fill={taglineFill}
      >
        RITUALS &amp; OFFERINGS
      </text>
    </svg>
  );
}

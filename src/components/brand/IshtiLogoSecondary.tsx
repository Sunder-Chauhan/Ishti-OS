import React, { useId } from "react";
import { IshtiIcon } from "./IshtiIcon";
import { IshtiWordmark } from "./IshtiWordmark";

export interface IshtiLogoSecondaryProps extends React.SVGProps<SVGSVGElement> {
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
 * ISHTI Secondary Logo Component
 * 
 * Composition:
 * - Symbol (Flame + Altar + Bindu) on top
 * - Custom Outlined Wordmark "ISHTI" below
 * - Aspect ratio: 400:480
 * 
 * Recommended for headers, mobile navigation, splash screens, and brand collateral.
 */
export function IshtiLogoSecondary({
  size,
  width = 200,
  height,
  decorative = true,
  title = "ISHTI Logo",
  description = "ISHTI sacred fire altar symbol with custom serif wordmark below",
  idPrefix,
  theme = "color",
  className = "",
  ...props
}: IshtiLogoSecondaryProps) {
  const reactId = useId();
  const prefix = idPrefix || `ishti_sec_${reactId.replace(/:/g, "_")}`;

  const isMonochrome = theme === "monochrome";
  const isReversed = theme === "reversed";

  const wordmarkFill = isMonochrome ? "#302B2A" : isReversed ? "#F8F4ED" : "#711B16";

  const renderedWidth = size ?? width;
  const renderedHeight = size ? Number(size) * 1.2 : (height ?? "auto");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 480"
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
    </svg>
  );
}

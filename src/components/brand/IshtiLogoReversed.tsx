import React, { useId } from "react";
import { IshtiIcon } from "./IshtiIcon";
import { IshtiWordmark } from "./IshtiWordmark";

export interface IshtiLogoReversedProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  width?: number | string;
  height?: number | string;
  decorative?: boolean;
  title?: string;
  description?: string;
  idPrefix?: string;
  showBackground?: boolean;
}

/**
 * ISHTI Reversed Logo Component
 * 
 * Inverted artwork on dark backgrounds:
 * - Symbol rendered in Ivory Paper, Warm Sand, and Sacred Gold
 * - Wordmark rendered in Ivory Paper
 * - Optional embedded Temple Charcoal rounded container block
 * - Aspect ratio: 420:500 (1:1.19)
 * 
 * Recommended for dark mode UI, night vigils, dark packaging, and hero charcoal banners.
 */
export function IshtiLogoReversed({
  size,
  width = 210,
  height,
  decorative = true,
  title = "ISHTI Reversed Logo",
  description = "Reversed execution with light ivory and gold artwork on a deep Temple Charcoal background",
  idPrefix,
  showBackground = true,
  className = "",
  ...props
}: IshtiLogoReversedProps) {
  const reactId = useId();
  const prefix = idPrefix || `ishti_rev_${reactId.replace(/:/g, "_")}`;

  const renderedWidth = size ?? width;
  const renderedHeight = size ? Number(size) * 1.19 : (height ?? "auto");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 500"
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

      {showBackground && <rect width="100%" height="100%" rx="12" fill="#302B2A" />}

      <g transform="translate(10, 10)">
        <IshtiIcon
          width={400}
          height={400}
          idPrefix={`${prefix}_sym`}
          theme="reversed"
          decorative={true}
        />
        <g transform="translate(97, 400)">
          <IshtiWordmark width={206} height={54} fill="#F8F4ED" decorative={true} />
        </g>
      </g>
    </svg>
  );
}

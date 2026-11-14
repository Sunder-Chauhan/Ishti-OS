import React from "react";
import { IshtiIcon } from "./IshtiIcon";
import { IshtiLogoPrimary } from "./IshtiLogoPrimary";
import { IshtiLogoSecondary } from "./IshtiLogoSecondary";
import { IshtiLogoHorizontal } from "./IshtiLogoHorizontal";
import { IshtiLogoMonochrome } from "./IshtiLogoMonochrome";
import { IshtiLogoReversed } from "./IshtiLogoReversed";

export type IshtiLogoVariant =
  | "primary"
  | "secondary"
  | "icon"
  | "horizontal"
  | "monochrome"
  | "reversed";

export interface IshtiLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: IshtiLogoVariant;
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
 * ISHTI Master Unified Logo Component
 * 
 * Dynamic entrypoint for the approved ISHTI logo family:
 * - variant="primary": Full symbol, wordmark and 2 taglines (400x560)
 * - variant="secondary" (default): Symbol and wordmark (400x480)
 * - variant="icon": Stepped altar and sacred flame symbol only (400x400)
 * - variant="horizontal": Symbol left, wordmark & stacked tagline right (680x260)
 * - variant="monochrome": Single-color Temple Charcoal execution (400x480)
 * - variant="reversed": Light artwork on dark background (420x500)
 */
export function IshtiLogo({
  variant = "secondary",
  ...props
}: IshtiLogoProps) {
  switch (variant) {
    case "primary":
      return <IshtiLogoPrimary {...props} />;
    case "icon":
      return <IshtiIcon {...props} />;
    case "horizontal":
      return <IshtiLogoHorizontal {...props} />;
    case "monochrome":
      return <IshtiLogoMonochrome {...props} />;
    case "reversed":
      return <IshtiLogoReversed {...props} />;
    case "secondary":
    default:
      return <IshtiLogoSecondary {...props} />;
  }
}

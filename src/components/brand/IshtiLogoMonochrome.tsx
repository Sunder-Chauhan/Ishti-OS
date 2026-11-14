import React from "react";
import { IshtiLogoSecondary, IshtiLogoSecondaryProps } from "./IshtiLogoSecondary";

/**
 * ISHTI Monochrome Logo Component
 * 
 * Single-color Temple Charcoal execution:
 * - Uses negative-space grooved lines to articulate 3D altar facets and flame curves
 * - No color gradients
 * - Aspect ratio: 400:480
 * 
 * Recommended for single-color print, newspaper ads, embossing, laser engraving, and receipts.
 */
export function IshtiLogoMonochrome(props: Omit<IshtiLogoSecondaryProps, "theme">) {
  return <IshtiLogoSecondary {...props} theme="monochrome" />;
}

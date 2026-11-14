import React from "react";

interface EmblemProps {
  size?: number;
  className?: string;
  variant?: "gold" | "charcoal" | "ivory";
}

/**
 * ISHTI Emblem
 * A sacred geometric synthesis of:
 * 1. The Rising Sun (Udaya / Yug): dawn of a new era of accessibility.
 * 2. Indian Sacred Geometry: 8-fold concentric symmetry (Ashta-dala) and bindu center.
 * 3. Contemporary Clarity: balanced minimal vector lines suitable for mobile app icons and favicons.
 */
export function Emblem({ size = 36, className = "", variant = "gold" }: EmblemProps) {
  const strokeColor =
    variant === "charcoal"
      ? "#20251F"
      : variant === "ivory"
      ? "#F1EBDD"
      : "#B18A50";

  const fillColor =
    variant === "charcoal"
      ? "#20251F"
      : variant === "ivory"
      ? "#F1EBDD"
      : "#B18A50";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer subtle concentric alignment ring */}
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeOpacity="0.4"
      />

      {/* Octagonal / 8-point geometric bounding foundation */}
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* Lower horizon / pedestal arc */}
      <path
        d="M 14 36 C 18 46, 46 46, 50 36"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Stepped sanctum base (Mandapa tier) */}
      <path
        d="M 22 41 L 42 41"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 26 45 L 38 45"
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />

      {/* Rising Sun - Central Semi-disc */}
      <path
        d="M 20 33 A 12 12 0 0 1 44 33 Z"
        fill={fillColor}
        fillOpacity="0.22"
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* Central Bindu (Focal energy point) */}
      <circle cx="32" cy="28" r="2.5" fill={fillColor} />

      {/* Solar Rays - 7 traditional rays of illumination (Sapta Rashmi) */}
      {/* 1. North-West (135°) */}
      <line x1="22" y1="22" x2="18" y2="18" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      {/* 2. Mid NW (112.5°) */}
      <line x1="25" y1="18" x2="22" y2="13" stroke={strokeColor} strokeWidth="1.25" strokeLinecap="round" />
      {/* 3. North (90°) - Crown ray */}
      <line x1="32" y1="16" x2="32" y2="10" stroke={strokeColor} strokeWidth="1.75" strokeLinecap="round" />
      {/* 4. Mid NE (67.5°) */}
      <line x1="39" y1="18" x2="42" y2="13" stroke={strokeColor} strokeWidth="1.25" strokeLinecap="round" />
      {/* 5. North-East (45°) */}
      <line x1="42" y1="22" x2="46" y2="18" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      {/* 6. West horizon */}
      <line x1="17" y1="31" x2="12" y2="31" stroke={strokeColor} strokeWidth="1.25" strokeLinecap="round" strokeOpacity="0.7" />
      {/* 7. East horizon */}
      <line x1="47" y1="31" x2="52" y2="31" stroke={strokeColor} strokeWidth="1.25" strokeLinecap="round" strokeOpacity="0.7" />
    </svg>
  );
}


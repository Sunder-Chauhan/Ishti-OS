import React from "react";

/**
 * Authentic Indian Heritage Visual
 * A vector composition capturing:
 * - Sacred Temple Shikhara & Mandapa architectural silhouette
 * - The Udaya (Morning Sun) radiating over timeless stone carvings
 * - Subtle sacred geometry (Yantra concentric rings and 16-petal lotus base)
 * - Warm natural sandstone palette honoring India's classic sacred architecture
 */
export function HeroVisual() {
  return (
    <div className="heroVisualContainer" aria-hidden="true">
      <svg
        viewBox="0 0 540 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="heroVisualSvg"
      >
        <defs>
          {/* Dawn Solar Gradient */}
          <radialGradient
            id="dawnGlow"
            cx="270"
            cy="210"
            r="200"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#F1EBDD" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#D9CBB2" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#B18A50" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F1EBDD" stopOpacity="0" />
          </radialGradient>

          {/* Gold Accent Linear Gradient */}
          <linearGradient id="goldBeam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B18A50" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#9B684E" stopOpacity="0.2" />
          </linearGradient>

          {/* Temple Stone Silhouette Gradient */}
          <linearGradient id="templeStone" x1="270" y1="90" x2="270" y2="440" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9B684E" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#777B62" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#20251F" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Ambient Dawn Glow */}
        <circle cx="270" cy="210" r="190" fill="url(#dawnGlow)" />

        {/* Outer Celestial Geometry: Astronomical Coordinates */}
        <circle
          cx="270"
          cy="210"
          r="170"
          stroke="#B18A50"
          strokeWidth="1"
          strokeDasharray="4 6"
          strokeOpacity="0.4"
        />
        <circle
          cx="270"
          cy="210"
          r="140"
          stroke="#9B684E"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* Sacred Geometry: 12 Solar Nakshatra spokes */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
          <line
            key={i}
            x1="270"
            y1="210"
            x2={270 + 160 * Math.cos((angle * Math.PI) / 180)}
            y2={210 + 160 * Math.sin((angle * Math.PI) / 180)}
            stroke="#B18A50"
            strokeWidth="0.8"
            strokeOpacity="0.25"
          />
        ))}

        {/* Rising Sun Golden Disc */}
        <circle
          cx="270"
          cy="210"
          r="54"
          fill="#B18A50"
          fillOpacity="0.16"
          stroke="#B18A50"
          strokeWidth="1.5"
        />
        <circle cx="270" cy="210" r="32" fill="#B18A50" fillOpacity="0.25" />
        <circle cx="270" cy="210" r="6" fill="#B18A50" />

        {/* Sanctum Architectural Silhouettes (Temples of India) */}

        {/* Background Left Mandapa */}
        <path
          d="M 120 420 L 120 340 L 155 295 L 190 340 L 190 420 Z"
          fill="#D9CBB2"
          fillOpacity="0.45"
          stroke="#777B62"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Background Right Mandapa */}
        <path
          d="M 350 420 L 350 340 L 385 295 L 420 340 L 420 420 Z"
          fill="#D9CBB2"
          fillOpacity="0.45"
          stroke="#777B62"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Central Shikhara (Classical Stepped Temple Spire) */}
        {/* Kalash & Amrnaka Finial */}
        <line x1="270" y1="84" x2="270" y2="108" stroke="#B18A50" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="270" cy="112" r="7" fill="#B18A50" />
        <ellipse cx="270" cy="124" rx="14" ry="5" fill="#9B684E" stroke="#B18A50" strokeWidth="1" />

        {/* Stepped Shikhara Levels */}
        <path
          d="
            M 270 128
            L 258 148 L 282 148
            L 252 172 L 288 172
            L 246 198 L 294 198
            L 238 228 L 302 228
            L 230 262 L 310 262
            L 220 300 L 320 300
            L 205 345 L 335 345
            L 190 395 L 350 395
            L 170 435 L 370 435
            Z
          "
          fill="url(#templeStone)"
          stroke="#B18A50"
          strokeWidth="1.25"
          strokeOpacity="0.75"
        />

        {/* Inner Sanctum Arch (Garbhagriha Portal) */}
        <path
          d="M 248 435 L 248 375 Q 270 350 292 375 L 292 435 Z"
          fill="#20251F"
          stroke="#B18A50"
          strokeWidth="1.5"
        />

        {/* Sanctum Eternal Light (Akhanda Jyot Diya) */}
        <ellipse cx="270" cy="415" rx="8" ry="3.5" fill="#9B684E" />
        <path
          d="M 267 414 Q 270 400 273 414 Z"
          fill="#B18A50"
        />
        <circle cx="270" cy="407" r="2.5" fill="#F1EBDD" />

        {/* Foundation Stepped Ghat / Plinth (Adhishthana) */}
        <rect x="70" y="435" width="400" height="8" fill="#777B62" stroke="#20251F" strokeWidth="1" opacity="0.8" />
        <rect x="50" y="443" width="440" height="10" fill="#20251F" />
        <rect x="30" y="453" width="480" height="12" fill="#20251F" opacity="0.95" />

        {/* Sacred Geometry Lotus Pedestal (Kamalasana lines) */}
        <path
          d="M 170 443 Q 220 438 270 443 Q 320 438 370 443"
          stroke="#B18A50"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* Floating Devanagari Inscription Accent */}
        <text
          x="270"
          y="488"
          textAnchor="middle"
          fill="#777B62"
          fontSize="11"
          letterSpacing="4"
          fontFamily="var(--font-devanagari), sans-serif"
        >
          शान्तिः • सत्यम् • परम्परा
        </text>
      </svg>
    </div>
  );
}


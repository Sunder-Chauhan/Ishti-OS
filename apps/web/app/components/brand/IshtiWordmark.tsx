import React from "react";

export interface IshtiWordmarkProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  fill?: string;
  decorative?: boolean;
  title?: string;
}

/**
 * ISHTI Outlined Vector Wordmark Component
 * 
 * Master Typography Letterforms:
 * - Initial 'I': Outlined stem with distinctive graceful leftward-sweeping foot.
 * - 'S': Classical Roman humanist serif proportions.
 * - 'H': High-waisted classical crossbar with flared terminal brackets.
 * - 'T': Balanced stem with downward-flared crossbar terminals.
 * - Terminal 'I': Outlined stem with distinctive graceful rightward-sweeping foot.
 * 
 * Guarantees 100% typography fidelity regardless of whether custom fonts are installed.
 */
export function IshtiWordmark({
  width = 206,
  height = 54,
  fill = "#711B16",
  decorative = true,
  title = "ISHTI Wordmark",
  className = "",
  ...props
}: IshtiWordmarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 206 54"
      width={width}
      height={height}
      fill={fill}
      className={className}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      {...props}
    >
      {!decorative && title && <title>{title}</title>}
      <g className="ishti-wordmark-paths">
        {/* Letter I (Initial, Left-flourish foot) */}
        <path d="M 17,2.5 C 15.5,2.5 13.5,2.1 11.5,1.2 L 10.5,0 L 21.5,0 L 21.5,39 C 21.5,43.2 20.2,46.5 17.5,48.8 C 14.8,51.1 10.8,52.4 5.5,52.8 L 3.5,52.8 C 1.2,52.8 0,51.6 0,49.2 C 0,46.8 1.2,45.6 3.5,45.6 C 6.8,45.6 9.2,44.6 10.8,42.5 C 12.4,40.4 13.2,37.2 13.2,33 L 13.2,7.5 C 11.8,7.5 9.8,8.2 7.5,9.5 L 5.5,5 C 9.5,3.3 13.5,2.5 17,2.5 Z" />

        {/* Letter S */}
        <path d="M 62,12.5 L 57.5,14.2 C 56.5,10.8 55,8.2 52.8,6.5 C 50.5,4.8 47.5,3.8 43.8,3.8 C 39.8,3.8 36.5,4.8 34,7 C 31.5,9.2 30.2,11.8 30.2,15 C 30.2,17.8 31.2,20.2 33.5,22 C 35.8,23.8 39.5,25.8 44.5,27.8 C 50.8,30.2 55.2,32.8 58.2,35.8 C 61.2,38.8 62.8,42.8 62.8,47.5 C 62.8,53.5 60.5,58.2 56,61.8 C 51.5,65.2 45.5,67 38.2,67 C 32.8,67 28,65.8 24,63.2 C 20,60.6 17,56.8 15.2,52 L 20,49.5 C 21.5,53.5 23.8,56.5 26.8,58.8 C 29.8,61 33.8,62.2 38.5,62.2 C 43.5,62.2 47.5,61 50.5,58.5 C 53.5,56 55,52.5 55,48 C 55,44.8 53.8,42 51,39.5 C 48.2,37 44,34.8 38.5,32.5 C 32.8,30.2 28.5,27.8 25.8,24.8 C 23,21.8 21.8,18.2 21.8,13.8 C 21.8,8.8 24,4.8 28.2,1.8 C 32.5,-1.2 38,-2.5 44.5,-2.5 C 50,-2.5 54.8,-1.2 58.8,1.2 C 62.8,3.8 65.5,7.5 67,12.5 Z" transform="translate(6, -8) scale(0.82)" />

        {/* Letter H */}
        <path d="M 86,2.5 C 84.5,2.5 82.5,2.1 80.5,1.2 L 79.5,0 L 91.5,0 L 91.5,20.5 L 112.5,20.5 L 112.5,0 L 124.5,0 L 123.5,1.2 C 121.5,2.1 119.5,2.5 118,2.5 L 118,50 C 119.5,50 121.5,50.4 123.5,51.3 L 124.5,52.5 L 112.5,52.5 L 112.5,27.5 L 91.5,27.5 L 91.5,52.5 L 79.5,52.5 L 80.5,51.3 C 82.5,50.4 84.5,50 86,50 Z" />

        {/* Letter T */}
        <path d="M 129,0 L 175,0 L 175,10.5 L 171.5,10.5 C 170.5,7 169,4.8 167,3.8 C 165,2.8 161.5,2.5 156.5,2.5 L 156.5,50 C 158,50 160,50.4 162,51.3 L 163,52.5 L 141,52.5 L 142,51.3 C 144,50.4 146,50 147.5,50 L 147.5,2.5 C 142.5,2.5 139,2.8 137,3.8 C 135,4.8 133.5,7 132.5,10.5 L 129,10.5 Z" />

        {/* Letter I (Terminal, Right-flourish foot) */}
        <path d="M 189,2.5 C 187.5,2.5 185.5,2.1 183.5,1.2 L 182.5,0 L 193.5,0 L 193.5,33 C 193.5,37.2 194.2,40.4 195.8,42.5 C 197.4,44.6 199.8,45.6 203,45.6 C 205.2,45.6 206.5,46.8 206.5,49.2 C 206.5,51.6 205.2,52.8 203,52.8 L 201,52.8 C 195.8,52.4 191.8,51.1 189,48.8 C 186.2,46.5 185,43.2 185,39 L 185,7.5 C 183.5,7.5 181.5,8.2 179.5,9.5 L 177.5,5 C 181.5,3.3 185.5,2.5 189,2.5 Z" />
      </g>
    </svg>
  );
}

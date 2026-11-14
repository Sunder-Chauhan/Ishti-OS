import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Noto_Sans_Devanagari } from "next/font/google";
import type { CSSProperties } from "react";
import { brandThemeStyle } from "@spiritual-os/types";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "ISHTI | Rooted in Tradition. Connected to Today.",
  description:
    "A modern spiritual ecosystem rooted in Indian wisdom. Authentic religious knowledge, canonical Vedic practices, and vetted spiritual experts.",
  openGraph: {
    title: "ISHTI | Rooted in Tradition. Connected to Today.",
    description:
      "A modern spiritual ecosystem rooted in Indian wisdom. Authentic religious knowledge, canonical Vedic practices, and vetted spiritual experts.",
    siteName: "ISHTI",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISHTI | Rooted in Tradition. Connected to Today.",
    description: "A modern spiritual ecosystem rooted in Indian wisdom.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${devanagari.variable}`} style={brandThemeStyle as CSSProperties}>
      <body>{children}</body>
    </html>
  );
}

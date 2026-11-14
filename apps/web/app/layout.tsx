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
  title: "YUGON",
  description: "Rooted in Tradition. Connected to Today. A modern spiritual ecosystem for authentic knowledge, practice and community.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${devanagari.variable}`} style={brandThemeStyle as CSSProperties}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Inter, Noto_Sans_Devanagari } from "next/font/google";
import type { CSSProperties } from "react";
import { brandThemeStyle } from "@spiritual-os/types";
import { AppShell } from "./components/layout/AppShell";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-cinzel",
  display: "swap",
});

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ishti.in"),
  title: "ISHTI | Rooted in Tradition. Connected to Today.",
  description:
    "A modern spiritual ecosystem rooted in Indian wisdom. Authentic religious knowledge, canonical Vedic practices, and vetted spiritual experts.",
  icons: {
    icon: [
      { url: "/brand/ishti-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/brand/ishti-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/brand/ishti-icon.svg",
  },
  openGraph: {
    title: "ISHTI | Rooted in Tradition. Connected to Today.",
    description:
      "A modern spiritual ecosystem rooted in Indian wisdom. Authentic religious knowledge, canonical Vedic practices, and vetted spiritual experts.",
    siteName: "ISHTI",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/brand/ishti-primary.svg",
        width: 400,
        height: 540,
        alt: "ISHTI Primary Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ISHTI | Rooted in Tradition. Connected to Today.",
    description: "A modern spiritual ecosystem rooted in Indian wisdom.",
    images: ["/brand/ishti-primary.svg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${display.variable} ${sans.variable} ${devanagari.variable}`}
      style={brandThemeStyle as CSSProperties}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

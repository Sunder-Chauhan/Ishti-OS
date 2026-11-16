'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IshtiLogo,
  IshtiLogoIcon,
  IshtiLogoPrimary,
  IshtiLogoSecondary,
  IshtiLogoHorizontal,
  IshtiLogoMonochrome,
  IshtiLogoReversed,
} from '../components/brand';
import { ISHTI_COLORS } from '../../lib/design-tokens';

interface ColorCardProps {
  name: string;
  hex: string;
  role: string;
  textColor?: string;
}

function ColorCard({ name, hex, role, textColor = '#FFFFFF' }: ColorCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      className="cursor-pointer rounded-xl overflow-hidden border border-[#D1A477]/30 bg-white shadow-sm hover:shadow-md transition-all group"
    >
      <div
        className="h-24 w-full flex items-end p-3 transition-transform group-hover:scale-[1.02]"
        style={{ backgroundColor: hex }}
      >
        <span
          className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded backdrop-blur-sm bg-black/25"
          style={{ color: textColor }}
        >
          {copied ? 'COPIED!' : hex}
        </span>
      </div>
      <div className="p-3 bg-[#FDFBF7]">
        <div className="font-semibold text-sm text-[#302B2A]">{name}</div>
        <div className="text-xs text-[#8B6846] mt-0.5">{role}</div>
      </div>
    </div>
  );
}

export default function BrandShowcasePage() {
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const showDownloadNotification = (filename: string) => {
    setDownloadMsg(`Downloading ${filename}...`);
    setTimeout(() => setDownloadMsg(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED] text-[#302B2A] py-12 px-4 sm:px-6 lg:px-8">
      {/* Toast */}
      {downloadMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#711B16] text-[#F8F4ED] px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{downloadMsg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-16">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-[#711B16] hover:text-[#EF7428] mb-6 transition-colors"
          >
            ← Back to Sanctuary
          </Link>
          <div className="border-b border-[#D1A477]/40 pb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#EF7428]">
              Design System &amp; Brand Guidelines
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif text-[#711B16] mt-2 font-bold tracking-tight">
              ISHTI Brand Identity System
            </h1>
            <p className="mt-3 text-lg text-[#8B6846] max-w-3xl leading-relaxed">
              Rooted in the eternal geometry of Vedic sacred fire altars (Vedi) and consecrated offering rituals (Yajna).
              Faithfully vectorized from approved master artwork into a scalable, accessible, production-ready digital identity.
            </p>
          </div>
        </div>

        {/* 1. Master Logo Family Grid */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#D1A477]/20 pb-3">
            <h2 className="text-2xl font-serif text-[#711B16] font-bold">1. Approved Logo Family</h2>
            <span className="text-xs text-[#8B6846]">6 Official Digital Vectors (SVG)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary */}
            <div className="bg-white rounded-2xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>1. Primary</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#711B16] px-2 py-0.5 rounded font-mono">Full Lockup</span>
                </div>
                <div className="h-56 flex items-center justify-center p-2 bg-[#FDFBF7] rounded-xl border border-[#D1A477]/10">
                  <IshtiLogoPrimary className="max-h-full max-w-full" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#D1A477]/20 flex items-center justify-between text-xs">
                <span className="text-[#8B6846]">Official Master Lockup</span>
                <a
                  href="/brand/ishti-primary.svg"
                  download="ishti-primary.svg"
                  onClick={() => showDownloadNotification('ishti-primary.svg')}
                  className="font-medium text-[#711B16] hover:text-[#EF7428] transition-colors"
                >
                  Download SVG ↓
                </a>
              </div>
            </div>

            {/* Secondary */}
            <div className="bg-white rounded-2xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>2. Secondary</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#711B16] px-2 py-0.5 rounded font-mono">Standard</span>
                </div>
                <div className="h-56 flex items-center justify-center p-2 bg-[#FDFBF7] rounded-xl border border-[#D1A477]/10">
                  <IshtiLogoSecondary className="max-h-full max-w-full" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#D1A477]/20 flex items-center justify-between text-xs">
                <span className="text-[#8B6846]">App &amp; Web Headers</span>
                <a
                  href="/brand/ishti-secondary.svg"
                  download="ishti-secondary.svg"
                  onClick={() => showDownloadNotification('ishti-secondary.svg')}
                  className="font-medium text-[#711B16] hover:text-[#EF7428] transition-colors"
                >
                  Download SVG ↓
                </a>
              </div>
            </div>

            {/* Icon */}
            <div className="bg-white rounded-2xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>3. Icon</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#711B16] px-2 py-0.5 rounded font-mono">Symbol Only</span>
                </div>
                <div className="h-56 flex items-center justify-center p-4 bg-[#FDFBF7] rounded-xl border border-[#D1A477]/10">
                  <IshtiLogoIcon className="max-h-full max-w-full" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#D1A477]/20 flex items-center justify-between text-xs">
                <span className="text-[#8B6846]">Favicon &amp; App Icon</span>
                <a
                  href="/brand/ishti-icon.svg"
                  download="ishti-icon.svg"
                  onClick={() => showDownloadNotification('ishti-icon.svg')}
                  className="font-medium text-[#711B16] hover:text-[#EF7428] transition-colors"
                >
                  Download SVG ↓
                </a>
              </div>
            </div>

            {/* Horizontal */}
            <div className="bg-white rounded-2xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>4. Horizontal Lockup</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#711B16] px-2 py-0.5 rounded font-mono">Landscape</span>
                </div>
                <div className="h-44 flex items-center justify-center p-4 bg-[#FDFBF7] rounded-xl border border-[#D1A477]/10">
                  <IshtiLogoHorizontal className="max-h-full max-w-full" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#D1A477]/20 flex items-center justify-between text-xs">
                <span className="text-[#8B6846]">Navigation bars &amp; horizontal banners</span>
                <a
                  href="/brand/ishti-horizontal.svg"
                  download="ishti-horizontal.svg"
                  onClick={() => showDownloadNotification('ishti-horizontal.svg')}
                  className="font-medium text-[#711B16] hover:text-[#EF7428] transition-colors"
                >
                  Download SVG ↓
                </a>
              </div>
            </div>

            {/* Monochrome */}
            <div className="bg-white rounded-2xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>5. Monochrome</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#2A2726] px-2 py-0.5 rounded font-mono">Single Color</span>
                </div>
                <div className="h-44 flex items-center justify-center p-2 bg-[#FDFBF7] rounded-xl border border-[#D1A477]/10">
                  <IshtiLogoMonochrome className="max-h-full max-w-full" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#D1A477]/20 flex items-center justify-between text-xs">
                <span className="text-[#8B6846]">Print, Stamping &amp; Receipts</span>
                <a
                  href="/brand/ishti-monochrome.svg"
                  download="ishti-monochrome.svg"
                  onClick={() => showDownloadNotification('ishti-monochrome.svg')}
                  className="font-medium text-[#711B16] hover:text-[#EF7428] transition-colors"
                >
                  Download SVG ↓
                </a>
              </div>
            </div>

            {/* Reversed */}
            <div className="bg-[#282A36] rounded-2xl p-6 border border-[#3D4050] shadow-sm flex flex-col justify-between text-[#F8F4ED]">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#D7A64A] uppercase tracking-wider mb-4">
                  <span>6. Reversed</span>
                  <span className="text-[10px] bg-white/10 text-[#F8F4ED] px-2 py-0.5 rounded font-mono">Dark Tile</span>
                </div>
                <div className="h-56 flex items-center justify-center p-2 bg-[#20222B] rounded-xl border border-white/5">
                  <IshtiLogoReversed className="max-h-full max-w-full" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-white/60">Dark mode &amp; Night sanctuary</span>
                <a
                  href="/brand/ishti-reversed.svg"
                  download="ishti-reversed.svg"
                  onClick={() => showDownloadNotification('ishti-reversed.svg')}
                  className="font-medium text-[#D7A64A] hover:text-[#FFF3B3] transition-colors"
                >
                  Download SVG ↓
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Brand Color Tokens */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#D1A477]/20 pb-3">
            <h2 className="text-2xl font-serif text-[#711B16] font-bold">2. Brand Design Tokens</h2>
            <span className="text-xs text-[#8B6846]">Vedic Color Harmony (Click to copy Hex)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <ColorCard
              name="Temple Maroon"
              hex={ISHTI_COLORS.templeMaroon}
              role="Primary Brand &amp; Wordmark"
            />
            <ColorCard
              name="Vedic Saffron"
              hex={ISHTI_COLORS.vedicSaffron}
              role="Sacred Fire &amp; Energy"
            />
            <ColorCard
              name="Sacred Gold"
              hex={ISHTI_COLORS.sacredGold}
              role="Bindu Drop &amp; Illumination"
              textColor="#302B2A"
            />
            <ColorCard
              name="Ivory Paper"
              hex={ISHTI_COLORS.ivoryPaper}
              role="Background Sanctuary Canvas"
              textColor="#302B2A"
            />
            <ColorCard
              name="Warm Sand"
              hex={ISHTI_COLORS.warmSand}
              role="Secondary Borders &amp; Subtext"
              textColor="#302B2A"
            />
            <ColorCard
              name="Warm Bronze"
              hex={ISHTI_COLORS.warmBronze}
              role="Tagline Text &amp; Accents"
            />
            <ColorCard
              name="Temple Charcoal"
              hex={ISHTI_COLORS.templeCharcoal}
              role="Monochrome Artwork &amp; Dark Text"
            />
            <ColorCard
              name="Slate Charcoal"
              hex={ISHTI_COLORS.slateCharcoal}
              role="Dark Mode Tile Canvas"
            />
          </div>
        </section>

        {/* 3. Icon Scalability Verification */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#D1A477]/20 pb-3">
            <h2 className="text-2xl font-serif text-[#711B16] font-bold">3. Icon Scalability</h2>
            <span className="text-xs text-[#8B6846]">Legibility at 16px, 24px, 32px, 48px, 64px, 128px</span>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-[#D1A477]/30 shadow-sm">
            <div className="flex flex-wrap items-end justify-around gap-8">
              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={16} />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">16px (Favicon)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={24} />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">24px (Mobile Bar)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={32} />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">32px (Header Nav)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={48} />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">48px (App Icon)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={64} />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">64px (Splash)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-32">
                  <IshtiLogoIcon size={128} />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">128px (Hero)</div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Clear-space and Proportions */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#D1A477]/20 pb-3">
            <h2 className="text-2xl font-serif text-[#711B16] font-bold">4. Clear-Space &amp; Construction Rules</h2>
            <span className="text-xs text-[#8B6846]">Architectural Integrity</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#D1A477]/30 shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-lg text-[#711B16]">Clear-Space Zone (0.5X)</h3>
              <p className="text-sm text-[#8B6846] leading-relaxed">
                Maintain minimum clear-space equal to 50% of the wordmark cap-height around all four sides of any logo lockup.
                No third-party typography, icons, photography, or borders may intrude into this consecrated perimeter.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-[#D1A477]/30 shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-lg text-[#711B16]">Minimum Rendering Sizes</h3>
              <ul className="text-sm text-[#8B6846] space-y-1.5 list-disc pl-5">
                <li><strong className="text-[#302B2A]">Icon Only:</strong> 16px digital width / 6mm print.</li>
                <li><strong className="text-[#302B2A]">Horizontal Lockup:</strong> 120px digital width / 30mm print.</li>
                <li><strong className="text-[#302B2A]">Primary Lockup:</strong> 140px digital width / 35mm print.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


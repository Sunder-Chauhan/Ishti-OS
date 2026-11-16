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

type BackgroundTheme = 'ivory' | 'white' | 'dark';

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
  const [bgTheme, setBgTheme] = useState<BackgroundTheme>('ivory');
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const showDownloadNotification = (filename: string) => {
    setDownloadMsg(`Downloading ${filename}...`);
    setTimeout(() => setDownloadMsg(null), 2500);
  };

  const getContainerBg = (overrideTheme?: BackgroundTheme) => {
    const active = overrideTheme ?? bgTheme;
    switch (active) {
      case 'white':
        return 'bg-white border-[#E5E0D5] text-[#302B2A]';
      case 'dark':
        return 'bg-[#282A36] border-[#3D4050] text-[#F8F4ED]';
      case 'ivory':
      default:
        return 'bg-[#FDFBF7] border-[#D1A477]/25 text-[#302B2A]';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED] text-[#302B2A] py-12 px-4 sm:px-6 lg:px-8">
      {/* Download Toast Notification */}
      {downloadMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#711B16] text-[#F8F4ED] px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium animate-fade-in flex items-center gap-2">
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
          <div className="border-b border-[#D1A477]/40 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#EF7428]">
                Official Brand Assets &amp; Display Sizing System
              </span>
              <h1 className="text-4xl sm:text-5xl font-serif text-[#711B16] mt-2 font-bold tracking-tight">
                ISHTI Brand Identity System
              </h1>
              <p className="mt-3 text-base sm:text-lg text-[#8B6846] max-w-2xl leading-relaxed">
                Approved digital vector assets rendered at unconstrained, generous display scales.
                Preserves exact vector geometry, sacred Vedi proportions, and custom typography across all environments.
              </p>
            </div>

            {/* Interactive Background Theme Controller */}
            <div className="bg-white p-2 rounded-2xl border border-[#D1A477]/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs font-semibold text-[#8B6846] px-2 uppercase tracking-wider">
                Surface Canvas:
              </span>
              <div className="flex rounded-xl bg-[#F8F4ED] p-1 border border-[#D1A477]/20">
                <button
                  type="button"
                  onClick={() => setBgTheme('ivory')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    bgTheme === 'ivory'
                      ? 'bg-[#711B16] text-[#F8F4ED] shadow-sm'
                      : 'text-[#8B6846] hover:text-[#711B16]'
                  }`}
                >
                  Ivory Sanctuary
                </button>
                <button
                  type="button"
                  onClick={() => setBgTheme('white')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    bgTheme === 'white'
                      ? 'bg-[#711B16] text-[#F8F4ED] shadow-sm'
                      : 'text-[#8B6846] hover:text-[#711B16]'
                  }`}
                >
                  Pure White
                </button>
                <button
                  type="button"
                  onClick={() => setBgTheme('dark')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    bgTheme === 'dark'
                      ? 'bg-[#711B16] text-[#F8F4ED] shadow-sm'
                      : 'text-[#8B6846] hover:text-[#711B16]'
                  }`}
                >
                  Dark Slate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Large Hero Master Presentation */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 border border-[#D1A477]/35 shadow-sm space-y-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Visual Display Container */}
            <div
              className={`w-full lg:w-1/2 p-8 sm:p-12 rounded-2xl border flex items-center justify-center transition-colors min-h-[460px] ${getContainerBg()}`}
            >
              <div className="w-full flex justify-center items-center">
                <IshtiLogoPrimary width={340} priority decorative />
              </div>
            </div>

            {/* Editorial Specifications */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#EF7428]">
                  Master Sacred Lockup
                </span>
                <h2 className="text-3xl font-serif text-[#711B16] font-bold">
                  Primary Brand Emblem
                </h2>
                <p className="text-sm text-[#8B6846] leading-relaxed">
                  The supreme mark of ISHTI. Synthesizes the consecrated Vedi (sacred sacrificial altar),
                  the upward flame of Agni (spiritual consciousness), the golden Bindu (seed of transcendent truth),
                  and the dual canonical taglines: <em className="text-[#711B16] font-medium">“TRANSFORMATIVE RITUALS &amp; OFFERINGS”</em> and <em className="text-[#711B16] font-medium">“Vedic Essence &amp; Rituals”</em>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#D1A477]/20 text-xs">
                <div>
                  <span className="text-[#8B6846] block">Master Dimensions:</span>
                  <strong className="text-[#302B2A] font-mono text-sm">400 × 540 px (0.741)</strong>
                </div>
                <div>
                  <span className="text-[#8B6846] block">Recommended Scale:</span>
                  <strong className="text-[#302B2A] font-mono text-sm">280–360px wide</strong>
                </div>
                <div>
                  <span className="text-[#8B6846] block">Artwork Geometry:</span>
                  <strong className="text-[#302B2A]">100% Immutable Vector</strong>
                </div>
                <div>
                  <span className="text-[#8B6846] block">Key Application:</span>
                  <strong className="text-[#302B2A]">Hero, About &amp; Footer</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="/brand/ishti-primary.svg"
                  download="ishti-primary.svg"
                  onClick={() => showDownloadNotification('ishti-primary.svg')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#711B16] text-[#F8F4ED] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8B231D] transition-colors shadow-sm"
                >
                  <span>Download Primary SVG</span>
                  <span>↓</span>
                </a>
                <span className="text-xs text-[#8B6846]">Approved master vector asset</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Full Six-Variant Presentation Grid with Generous Display Sizing */}
        <section className="space-y-8">
          <div className="border-b border-[#D1A477]/25 pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-2xl font-serif text-[#711B16] font-bold">
                2. Official Logo Family — Generous Display Sizing
              </h2>
              <p className="text-xs text-[#8B6846] mt-1">
                Rendered with unconstrained containers, generous breathing room, and strict intrinsic aspect-ratio preservation.
              </p>
            </div>
            <span className="text-xs font-mono text-[#8B6846] bg-white px-3 py-1 rounded-full border border-[#D1A477]/30">
              6 Official Vectors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. Primary */}
            <div className="bg-white rounded-3xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>1. Primary Lockup</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#711B16] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    400 × 540
                  </span>
                </div>
                <div
                  className={`min-h-[440px] flex items-center justify-center p-6 rounded-2xl border transition-colors ${getContainerBg()}`}
                >
                  <IshtiLogoPrimary width={300} decorative />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#D1A477]/20 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#302B2A]">Full Lockup with Both Taglines</span>
                  <a
                    href="/brand/ishti-primary.svg"
                    download="ishti-primary.svg"
                    onClick={() => showDownloadNotification('ishti-primary.svg')}
                    className="font-bold text-[#711B16] hover:text-[#EF7428] transition-colors"
                  >
                    SVG ↓
                  </a>
                </div>
                <p className="text-[11px] text-[#8B6846]">
                  Display size: <strong>280–360px wide</strong> (About section) or <strong>180–220px wide</strong> (Footer).
                </p>
              </div>
            </div>

            {/* 2. Secondary */}
            <div className="bg-white rounded-3xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>2. Secondary Lockup</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#711B16] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    400 × 460
                  </span>
                </div>
                <div
                  className={`min-h-[440px] flex items-center justify-center p-6 rounded-2xl border transition-colors ${getContainerBg()}`}
                >
                  <IshtiLogoSecondary width={280} decorative />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#D1A477]/20 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#302B2A]">Standard Vertical Lockup</span>
                  <a
                    href="/brand/ishti-secondary.svg"
                    download="ishti-secondary.svg"
                    onClick={() => showDownloadNotification('ishti-secondary.svg')}
                    className="font-bold text-[#711B16] hover:text-[#EF7428] transition-colors"
                  >
                    SVG ↓
                  </a>
                </div>
                <p className="text-[11px] text-[#8B6846]">
                  Display size: <strong>150–190px wide</strong> (Desktop header) or <strong>110–140px wide</strong> (Mobile drawer).
                </p>
              </div>
            </div>

            {/* 3. Icon */}
            <div className="bg-white rounded-3xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>3. Sacred Icon</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#711B16] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    400 × 400
                  </span>
                </div>
                <div
                  className={`min-h-[440px] flex items-center justify-center p-6 rounded-2xl border transition-colors ${getContainerBg()}`}
                >
                  <IshtiLogoIcon size={180} decorative />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#D1A477]/20 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#302B2A]">Symbol Only (Vedi + Agni + Bindu)</span>
                  <a
                    href="/brand/ishti-icon.svg"
                    download="ishti-icon.svg"
                    onClick={() => showDownloadNotification('ishti-icon.svg')}
                    className="font-bold text-[#711B16] hover:text-[#EF7428] transition-colors"
                  >
                    SVG ↓
                  </a>
                </div>
                <p className="text-[11px] text-[#8B6846]">
                  Display size: <strong>44–52px</strong> (Mobile header) or <strong>16–48px</strong> (Favicon &amp; app icon).
                </p>
              </div>
            </div>

            {/* 4. Horizontal Landscape */}
            <div className="bg-white rounded-3xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-3">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>4. Horizontal Lockup (Landscape)</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#711B16] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    680 × 240
                  </span>
                </div>
                <div
                  className={`min-h-[260px] flex items-center justify-center p-8 rounded-2xl border transition-colors ${getContainerBg()}`}
                >
                  <div className="w-full flex justify-center items-center">
                    <IshtiLogoHorizontal width={480} decorative />
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#D1A477]/20 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-[#302B2A] block">Desktop Navigation &amp; Wide Banners</span>
                  <p className="text-xs text-[#8B6846]">
                    Suggested application display size: <strong>200–240px wide</strong> in desktop navigation bar (active: 220px).
                  </p>
                </div>
                <a
                  href="/brand/ishti-horizontal.svg"
                  download="ishti-horizontal.svg"
                  onClick={() => showDownloadNotification('ishti-horizontal.svg')}
                  className="font-bold text-xs text-[#711B16] hover:text-[#EF7428] transition-colors"
                >
                  Download Horizontal SVG ↓
                </a>
              </div>
            </div>

            {/* 5. Monochrome */}
            <div className="bg-white rounded-3xl p-6 border border-[#D1A477]/30 shadow-sm flex flex-col justify-between md:col-span-1 lg:col-span-1">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B6846] uppercase tracking-wider mb-4">
                  <span>5. Monochrome</span>
                  <span className="text-[10px] bg-[#F8F4ED] text-[#2A2726] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    400 × 460
                  </span>
                </div>
                <div
                  className={`min-h-[400px] flex items-center justify-center p-6 rounded-2xl border transition-colors ${
                    bgTheme === 'dark' ? 'bg-white border-[#E5E0D5]' : getContainerBg()
                  }`}
                >
                  <IshtiLogoMonochrome width={280} decorative />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#D1A477]/20 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#302B2A]">Single Color Temple Charcoal</span>
                  <a
                    href="/brand/ishti-monochrome.svg"
                    download="ishti-monochrome.svg"
                    onClick={() => showDownloadNotification('ishti-monochrome.svg')}
                    className="font-bold text-[#711B16] hover:text-[#EF7428] transition-colors"
                  >
                    SVG ↓
                  </a>
                </div>
                <p className="text-[11px] text-[#8B6846]">
                  Print, blind stamping, wax seals, official invoices, and letterheads.
                </p>
              </div>
            </div>

            {/* 6. Reversed (Dark Canvas Tile) */}
            <div className="bg-[#282A36] rounded-3xl p-6 border border-[#3D4050] shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-2 text-[#F8F4ED]">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#D7A64A] uppercase tracking-wider mb-4">
                  <span>6. Reversed Mark (Dark Ground)</span>
                  <span className="text-[10px] bg-white/10 text-[#F8F4ED] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    400 × 460
                  </span>
                </div>
                <div className="min-h-[400px] flex items-center justify-center p-8 bg-[#20222B] rounded-2xl border border-white/10">
                  <IshtiLogoReversed width={280} decorative />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-[#F8F4ED] block">Dark Mode Sanctuary &amp; Night Devotion</span>
                  <p className="text-xs text-white/60">
                    Specifically rendered with luminous Sacred Gold (#D7A64A) and Ivory for deep dark surfaces (#282A36).
                  </p>
                </div>
                <a
                  href="/brand/ishti-reversed.svg"
                  download="ishti-reversed.svg"
                  onClick={() => showDownloadNotification('ishti-reversed.svg')}
                  className="font-bold text-xs text-[#D7A64A] hover:text-[#FFF3B3] transition-colors"
                >
                  Download Reversed SVG ↓
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 3. In-App Placement Context Previews (Interactive Live Mocks) */}
        <section className="space-y-8">
          <div className="border-b border-[#D1A477]/25 pb-4">
            <h2 className="text-2xl font-serif text-[#711B16] font-bold">
              3. In-App Context Previews &amp; Sizing Verification
            </h2>
            <p className="text-xs text-[#8B6846] mt-1">
              Live renders verifying the exact suggested display sizes inside actual product interfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Desktop Header Mockup */}
            <div className="bg-white rounded-3xl p-6 border border-[#D1A477]/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#711B16] uppercase tracking-wider">
                  Desktop Header Mockup
                </span>
                <span className="font-mono text-[#8B6846] bg-[#F8F4ED] px-2.5 py-1 rounded-md">
                  Horizontal: 220px wide (88px nav)
                </span>
              </div>
              <div className="rounded-xl border border-[#D1A477]/40 bg-[#F1EBDD]/90 p-4 shadow-inner flex items-center justify-between">
                <IshtiLogoHorizontal width={220} decorative />
                <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-[#8B6846]">
                  <span className="text-[#711B16] font-semibold">Bhakti</span>
                  <span>Panchang</span>
                  <span>Puja</span>
                  <span>Astro</span>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-[#711B16] text-[#F8F4ED] rounded-lg text-xs font-semibold"
                >
                  Sign In
                </button>
              </div>
              <p className="text-xs text-[#8B6846] leading-relaxed">
                Rendered at <strong>220px wide</strong> (78px tall). Provides prominent brand presence and crisp tagline legibility within the sticky header without crowding navigation links.
              </p>
            </div>

            {/* Mobile Header & Drawer Mockup */}
            <div className="bg-white rounded-3xl p-6 border border-[#D1A477]/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#711B16] uppercase tracking-wider">
                  Mobile Header &amp; Drawer Mockup
                </span>
                <span className="font-mono text-[#8B6846] bg-[#F8F4ED] px-2.5 py-1 rounded-md">
                  Bar: 175px • Drawer: 180px
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Mobile Top Bar */}
                <div className="rounded-xl border border-[#D1A477]/40 bg-[#F1EBDD] p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <IshtiLogoHorizontal width={175} decorative />
                  </div>
                  <div className="flex flex-col gap-1 w-5 shrink-0 ml-2">
                    <span className="h-0.5 bg-[#711B16] w-full" />
                    <span className="h-0.5 bg-[#711B16] w-full" />
                    <span className="h-0.5 bg-[#711B16] w-full" />
                  </div>
                </div>

                {/* Mobile Drawer Top */}
                <div className="rounded-xl border border-[#D1A477]/40 bg-white p-3 flex flex-col items-center justify-center text-center">
                  <IshtiLogoSecondary width={170} decorative />
                  <span className="text-[10px] text-[#8B6846] mt-1 font-mono">Drawer Header (170px)</span>
                </div>
              </div>
              <p className="text-xs text-[#8B6846] leading-relaxed">
                Mobile bar dynamically renders the <strong>175px Horizontal lockup</strong> for clear wordmark and tagline visibility without squeezing, while the drawer renders the prominent <strong>170–180px Secondary</strong> lockup.
              </p>
            </div>

            {/* Footer Column Mockup */}
            <div className="bg-white rounded-3xl p-6 border border-[#D1A477]/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#711B16] uppercase tracking-wider">
                  Footer Brand Column Mockup
                </span>
                <span className="font-mono text-[#8B6846] bg-[#F8F4ED] px-2.5 py-1 rounded-md">
                  Primary: 200px wide
                </span>
              </div>
              <div className="rounded-xl border border-[#3D4050] bg-[#20251F] p-6 text-[#F1EBDD] space-y-4">
                <IshtiLogoPrimary width={200} decorative />
                <p className="text-xs text-[#D9CBB2] max-w-sm leading-relaxed">
                  A modern spiritual ecosystem inspired by India’s timeless traditions, built to make authentic knowledge accessible.
                </p>
              </div>
              <p className="text-xs text-[#8B6846] leading-relaxed">
                Rendered at <strong>200px wide</strong> (270px tall). Accurately balances the footer link columns and gives prominence to both Vedic subtitles.
              </p>
            </div>

            {/* About / Philosophy Section Mockup */}
            <div className="bg-white rounded-3xl p-6 border border-[#D1A477]/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#711B16] uppercase tracking-wider">
                  About / Philosophy Section Mockup
                </span>
                <span className="font-mono text-[#8B6846] bg-[#F8F4ED] px-2.5 py-1 rounded-md">
                  Primary: 320px wide
                </span>
              </div>
              <div className="rounded-xl border border-[#D1A477]/30 bg-[#FDFBF7] p-8 flex flex-col items-center justify-center text-center space-y-4">
                <IshtiLogoPrimary width={320} decorative />
                <p className="text-xs text-[#8B6846] max-w-md italic">
                  “Rooted in Tradition. Connected to Today.”
                </p>
              </div>
              <p className="text-xs text-[#8B6846] leading-relaxed">
                Rendered at <strong>320px wide</strong> (432px tall). Creates an imposing, dignified sacred centerpiece in the philosophy sanctuary.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Display Sizing & Implementation Specifications Table */}
        <section className="space-y-6">
          <div className="border-b border-[#D1A477]/25 pb-4">
            <h2 className="text-2xl font-serif text-[#711B16] font-bold">
              4. Application Display Sizing Specifications
            </h2>
            <p className="text-xs text-[#8B6846] mt-1">
              Engineering guidelines ensuring 100% geometric fidelity and zero layout distortion.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#D1A477]/30 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F4ED] border-b border-[#D1A477]/30 text-[#711B16]">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider">Application Placement</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Suggested Display Size</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Implemented Active Size</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Recommended Variant</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Intrinsic Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1A477]/15 text-[#302B2A]">
                <tr className="hover:bg-[#FDFBF7]">
                  <td className="p-4 font-semibold">Desktop header — horizontal logo</td>
                  <td className="p-4 font-mono text-[#8B6846]">200–240px wide</td>
                  <td className="p-4 font-mono font-bold text-[#711B16]">220px (min 175px on tablet)</td>
                  <td className="p-4"><code>ishti-horizontal.svg</code></td>
                  <td className="p-4 font-mono">680 × 240 (2.833)</td>
                </tr>
                <tr className="hover:bg-[#FDFBF7]">
                  <td className="p-4 font-semibold">Mobile header — auto-adjustable horizontal</td>
                  <td className="p-4 font-mono text-[#8B6846]">Fluid responsive</td>
                  <td className="p-4 font-mono font-bold text-[#711B16]">170–195px (floor: min 165px)</td>
                  <td className="p-4"><code>ishti-horizontal.svg</code></td>
                  <td className="p-4 font-mono">680 × 240 (2.833)</td>
                </tr>
                <tr className="hover:bg-[#FDFBF7]">
                  <td className="p-4 font-semibold">Mobile drawer header — secondary logo</td>
                  <td className="p-4 font-mono text-[#8B6846]">150–200px wide</td>
                  <td className="p-4 font-mono font-bold text-[#711B16]">180px (min 150px)</td>
                  <td className="p-4"><code>ishti-secondary.svg</code></td>
                  <td className="p-4 font-mono">400 × 460 (0.870)</td>
                </tr>
                <tr className="hover:bg-[#FDFBF7]">
                  <td className="p-4 font-semibold">Mobile bar touch icon (compact)</td>
                  <td className="p-4 font-mono text-[#8B6846]">44–52px</td>
                  <td className="p-4 font-mono font-bold text-[#711B16]">48px (min 44px)</td>
                  <td className="p-4"><code>ishti-icon.svg</code></td>
                  <td className="p-4 font-mono">400 × 400 (1.000)</td>
                </tr>
                <tr className="hover:bg-[#FDFBF7]">
                  <td className="p-4 font-semibold">Footer — primary logo</td>
                  <td className="p-4 font-mono text-[#8B6846]">180–220px wide</td>
                  <td className="p-4 font-mono font-bold text-[#711B16]">215px (fluid, min 170px)</td>
                  <td className="p-4"><code>ishti-primary.svg</code></td>
                  <td className="p-4 font-mono">400 × 540 (0.741)</td>
                </tr>
                <tr className="hover:bg-[#FDFBF7]">
                  <td className="p-4 font-semibold">About / brand section — primary logo</td>
                  <td className="p-4 font-mono text-[#8B6846]">280–360px wide</td>
                  <td className="p-4 font-mono font-bold text-[#711B16]">330px (fluid, min 220px)</td>
                  <td className="p-4"><code>ishti-primary.svg</code></td>
                  <td className="p-4 font-mono">400 × 540 (0.741)</td>
                </tr>
                <tr className="hover:bg-[#FDFBF7]">
                  <td className="p-4 font-semibold">Favicon &amp; App Icon</td>
                  <td className="p-4 font-mono text-[#8B6846]">16px / 32px / 48px</td>
                  <td className="p-4 font-mono font-bold text-[#711B16]">SVG vector / ICO export</td>
                  <td className="p-4"><code>ishti-icon.svg</code></td>
                  <td className="p-4 font-mono">400 × 400 (1.000)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Icon Scalability Verification */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#D1A477]/25 pb-4">
            <h2 className="text-2xl font-serif text-[#711B16] font-bold">5. Icon Scalability Across Digital Scales</h2>
            <span className="text-xs text-[#8B6846]">Legibility from 16px to 180px</span>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#D1A477]/30 shadow-sm">
            <div className="flex flex-wrap items-end justify-around gap-8">
              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={16} decorative />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">16px (Favicon)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={24} decorative />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">24px (Mobile Bar)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={32} decorative />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">32px (Header Nav)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={48} decorative />
                </div>
                <div className="text-[11px] font-mono text-[#711B16] font-bold">48px (Recommended)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-16">
                  <IshtiLogoIcon size={64} decorative />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">64px (Splash)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-28">
                  <IshtiLogoIcon size={96} decorative />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">96px (Devotional Tile)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center items-center h-36">
                  <IshtiLogoIcon size={144} decorative />
                </div>
                <div className="text-[11px] font-mono text-[#8B6846]">144px (Symbol Master)</div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Brand Design Tokens */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#D1A477]/25 pb-4">
            <h2 className="text-2xl font-serif text-[#711B16] font-bold">6. Brand Design Tokens</h2>
            <span className="text-xs text-[#8B6846]">Vedic Color Harmony (Click card to copy Hex)</span>
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

        {/* 7. Clear-Space & Construction Guidelines */}
        <section className="space-y-6">
          <div className="border-b border-[#D1A477]/25 pb-4">
            <h2 className="text-2xl font-serif text-[#711B16] font-bold">7. Clear-Space &amp; Construction Rules</h2>
            <p className="text-xs text-[#8B6846] mt-1">Preserving the sacred geometric integrity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-[#D1A477]/30 shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-lg text-[#711B16]">Clear-Space Zone (0.5X Rule)</h3>
              <p className="text-sm text-[#8B6846] leading-relaxed">
                Maintain minimum clear-space equal to 50% of the wordmark cap-height around all four sides of any logo lockup.
                No third-party typography, icons, photography, or borders may intrude into this consecrated perimeter.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-[#D1A477]/30 shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-lg text-[#711B16]">Display Preservation Rules</h3>
              <ul className="text-sm text-[#8B6846] space-y-1.5 list-disc pl-5">
                <li><strong className="text-[#302B2A]">Zero Artwork Alteration:</strong> Paths, gradients, and geometries are immutable.</li>
                <li><strong className="text-[#302B2A]">Layout Sizing Only:</strong> Enlarge via container dimensions, never internal scale transforms.</li>
                <li><strong className="text-[#302B2A]">Containment:</strong> Always use <code>object-fit: contain</code> and <code>aspect-ratio</code> preservation.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

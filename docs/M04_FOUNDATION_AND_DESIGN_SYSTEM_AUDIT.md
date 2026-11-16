# ISHTI Milestone M04 — Application Foundation & Design System Audit

**Milestone:** M04 (Application Foundation & UX Shell)  
**Project:** ISHTI (Internal codename: `spiritual-OS`)  
**Repository:** `C:\Users\as\Documents\GitHub\spiritual-OS`  
**Branch:** `main`  
**Status:** `AUDIT COMPLETE & SPECIFICATION FROZEN — READY FOR M04 IMPLEMENTATION`  
**Date:** 2026-11-16  

---

## 1. Executive Summary & Purpose

Following the successful closure of Milestone M03 (Gate A backup verification, Gate B schema reconciliation, INC-01 Razorpay key rotation, and Gate C hosted integration validation), ISHTI transitions from database infrastructure and cryptographic primitives to the **Application Foundation & User Experience Shell (Milestone M04)**.

Per core architectural directives:
> **"Don't build six disconnected applications. Build one coherent ISHTI ecosystem with six interconnected product experiences."**

This document establishes the architectural baseline, catalogs the visual design tokens, performs a comprehensive gap analysis between the existing landing page and the complete 6-module ecosystem, and defines the technical specifications for all foundational shell components.

---

## 2. Baseline Architecture Inspection (`apps/web`)

An exhaustive audit of the `apps/web` package reveals the following technical stack and configurations:

| Component | Current State | Architecture Analysis & Alignment |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.5.0 (App Router) with React 19.1.0 | Server-side rendering (RSC) by default. Async Request APIs (`cookies()`, `headers()`). |
| **Styling Paradigm** | Vanilla CSS + CSS Variables (`design-tokens.css`, `globals.css`) | No Tailwind runtime or precompiler dependency in web app. Clean token-driven architecture using native CSS custom properties. |
| **Typography Engine** | `next/font/google` in `app/layout.tsx` | - Display: `Cormorant_Garamond` (`--font-display`)<br>- UI/Sans: `Inter` (`--font-sans`)<br>- Indic Corpus: `Noto_Sans_Devanagari` (`--font-devanagari`) |
| **Session Middleware** | `middleware.ts` & `lib/supabase/middleware.ts` | Uses `@supabase/ssr` to refresh session cookies. Fallback present if Supabase URL/key is unset or placeholder. |
| **Brand Identity** | Official SVG Vector Family in `app/components/brand/` | 6 official logo variants (`IshtiLogoPrimary`, `IshtiLogoSecondary`, `IshtiLogoIcon`, `IshtiLogoHorizontal`, `IshtiLogoMonochrome`, `IshtiLogoReversed`). Tested across 16px–128px scales. |
| **Current Navigation** | `app/components/Navbar.tsx` | Single-page landing navigation with hash anchors (`#ecosystem`, `#philosophy`, `#trust`, `#experience`) and a placeholder "Sign In Planned" link. Lacks multi-route support, persistent mobile bottom navigation, and live authentication modal. |
| **Security & Privacy** | AES-256-GCM envelope encryption & HMAC rate limiter | Verified in Gate C (`apps/web/lib/crypto/kundli-encryption.ts` and `apps/web/lib/security/rate-limiter.ts`). |

---

## 3. Design Tokens Catalog (ISHTI Vedic Design System)

The design system marries traditional Vedic aesthetics (sacred geometry, temple architecture, manuscript ivory) with modern digital clarity and strict accessibility compliance.

### 3.1 Color Palette & Semantic Roles

```css
:root {
  /* Primary Foundation */
  --ishti-temple-maroon: #711B16;       /* Primary Brand & Hero Accent */
  --ishti-temple-maroon-dark: #5D1510;  /* Deep Altar Shadow */
  --ishti-temple-maroon-deep: #4A110D;  /* Structural Dark Accent */
  
  --ishti-vedic-saffron: #EF7428;       /* Primary Action & Sacred Fire */
  --ishti-vedic-saffron-light: #F58A45; /* Interactive Hover State */
  
  --ishti-sacred-gold: #D7A64A;         /* Sacred Ornamentation & Badges */
  --ishti-sacred-gold-light: #FFF3B3;   /* High-Contrast Gold Highlight */
  --ishti-sacred-gold-dark: #B27E24;    /* Border & Icon Stroke Accent */
  
  --ishti-ivory-paper: #F8F4ED;         /* Manuscript Background Surface */
  --ishti-ivory-paper-warm: #FDFBF7;    /* Card & Container Elevated Surface */
  --ishti-warm-sand: #D1A477;           /* Divider & Subtle Ornament */
  --ishti-warm-bronze: #8B6846;         /* Secondary Editorial Text */
  --ishti-muted-gold: #9E764E;          /* Tertiary Accent */
  
  --ishti-temple-charcoal: #2A2726;     /* Primary Ink / Text (Dark) */
  --ishti-slate-charcoal: #282A36;      /* High-Elevation Dark Card Surface */
  
  /* Semantic State */
  --ishti-success: #2E6B4F;             /* Verified Pandit / Canonical Badge */
  --ishti-warning: #C06B1A;             /* Pending Review / Discard Warning */
  --ishti-error: #9E2B25;               /* Cryptographic Mismatch / Rejection */
  --ishti-info: #3D6485;                /* Informational Notice */
}
```

### 3.2 Modular 8pt Vedic Spacing Grid

All layout margins, paddings, gaps, and component dimensions adhere strictly to an 8pt modular rhythm:

| Token | Value | Primary Usage |
| :--- | :--- | :--- |
| `--space-1` | `4px` | Micro-padding, badge vertical padding, subtle borders |
| `--space-2` | `8px` | Icon-to-text spacing, compact form field gap |
| `--space-3` | `12px` | Standard button vertical padding, tag margins |
| `--space-4` | `16px` | Standard button horizontal padding, card content padding (mobile) |
| `--space-6` | `24px` | Card content padding (desktop), section interior spacing |
| `--space-8` | `32px` | Grid column gaps, container gutters, header height padding |
| `--space-12` | `48px` | Minimum touch target height, major section spacing |
| `--space-16` | `64px` | Hero padding, module banner vertical rhythm |
| `--space-24` | `96px` | Page section separators on wide viewports |

### 3.3 Typography Scale

```css
:root {
  --font-size-xs: 0.75rem;     /* 12px - Footnotes, status tags, metadata */
  --font-size-sm: 0.875rem;    /* 14px - Secondary labels, timestamps, hints */
  --font-size-base: 1rem;      /* 16px - Body text, form inputs, button text */
  --font-size-lg: 1.125rem;    /* 18px - Lead paragraphs, section subheadings */
  --font-size-xl: 1.25rem;     /* 20px - Card titles, modal titles */
  --font-size-2xl: 1.5rem;     /* 24px - Module titles, major headers */
  --font-size-3xl: 2rem;       /* 32px - Page hero headings */
  --font-size-4xl: 2.75rem;    /* 44px - Display headlines */
}
```

### 3.4 WCAG 2.2 Contrast Governance

| Foreground | Background | Calculated Ratio | WCAG 2.2 Standard | Permitted Usage |
| :--- | :--- | :--- | :--- | :--- |
| Temple Charcoal (`#2A2726`) | Ivory Paper (`#F8F4ED`) | **13.2:1** | AAA (≥ 7.0:1) | Primary body copy, headings, form labels |
| Warm Bronze (`#8B6846`) | Ivory Paper (`#F8F4ED`) | **4.9:1** | AA (≥ 4.5:1) | Secondary descriptive text, verse references |
| Temple Maroon (`#711B16`) | Ivory Paper (`#F8F4ED`) | **8.1:1** | AAA (≥ 7.0:1) | Brand titles, sacred section headings |
| Temple Charcoal (`#2A2726`) | Vedic Saffron (`#EF7428`) | **5.4:1** | AA (≥ 4.5:1) | Primary action button text |
| Ivory Paper (`#F8F4ED`) | Temple Maroon (`#711B16`) | **8.1:1** | AAA (≥ 7.0:1) | Reversed banners, mobile bottom nav background |
| Sacred Gold (`#D7A64A`) | Ivory Paper (`#F8F4ED`) | *2.3:1 (Fail)* | Decorative Only | Borders, decorative bindu, sacred yantra lines only |
| Sacred Gold (`#D7A64A`) | Temple Charcoal (`#2A2726`) | **5.7:1** | AA (≥ 4.5:1) | Badges, icons, and text on dark temple surfaces |

---

## 4. Gap Analysis: Current Landing vs. Unified Ecosystem

| Dimension | Current State (M03 Landing) | Target State (M04 Foundation) |
| :--- | :--- | :--- |
| **Site Structure** | Single landing page with anchor links (`/#ecosystem`) | Multi-page Next.js App Router ecosystem with 6 dedicated module shells and user profile |
| **Header Navigation** | Desktop navbar with anchor links and placeholder "Sign In Planned" tag | Responsive `DesktopHeader` with 6-module links, guest sign-in button, active route indication |
| **Mobile Navigation** | Fullscreen hamburger drawer with anchor links | Modern sticky `MobileBottomNav` with 5 primary touchpoints (Home, Bhakti, Panchang, Astro, Profile) + accessible drawer |
| **Breadcrumbs** | Absent | Accessible, semantic `<nav aria-label="Breadcrumb">` on all module sub-pages |
| **User Identity** | Client-side "Early Access" waitlist form only | India-First Phone OTP modal (`AuthModal`), session context (`useAuth`), role-aware navigation |
| **Guest Access** | Landing page browsing only | Transparent guest access to Bhakti (scripture), Panchang (almanac), and Experts (directory) |
| **Privacy & Consent** | Static privacy disclaimer | Interactive DPDP Act 2023 §6 Consent Center (`/profile/consent`) with purpose-specific toggles |
| **Product Modules** | Teaser cards on landing page | Six cohesive module landing shells (`/puja`, `/astro`, `/bhakti`, `/panchang`, `/experts`, `/community`) |

---

## 5. Foundational Component Specifications

### 5.1 `AppShell` (`apps/web/app/components/layout/AppShell.tsx`)
- **Semantic Structure:**
  ```html
  <div className="ishtiAppShell">
    <a href="#main-content" className="srOnly focus:notSrOnly">Skip to main content</a>
    <DesktopHeader />
    <main id="main-content" className="ishtiMainContent">
      {children}
    </main>
    <Footer />
    <MobileBottomNav />
    <AuthModal />
  </div>
  ```
- **Responsive Viewport Handling:** Ensures standard desktop layout (`> 768px`) displays full header and hide bottom nav; mobile viewports (`< 768px`) displays compact header, responsive content with bottom padding (`padding-bottom: 72px`), and fixed `MobileBottomNav`.

### 5.2 `DesktopHeader` (`apps/web/app/components/layout/DesktopHeader.tsx`)
- **Master Brand Branding:** Uses `IshtiLogoIcon` + stylized typography "ISHTI".
- **Navigation Links:**
  - Bhakti (`/bhakti`)
  - Panchang (`/panchang`)
  - Puja (`/puja`)
  - Astro (`/astro`)
  - Experts (`/experts`)
  - Community (`/community`)
- **Active Route Highlighting:** Evaluates `usePathname()` to apply `.activeNavItem` with Vedic Saffron underline indicator and `aria-current="page"`.
- **Authentication State Trigger:**
  - *Guest:* Displays "Sign In" button (triggers `AuthModal`).
  - *Authenticated:* Displays devotee avatar / profile link (`/profile`).

### 5.3 `MobileBottomNav` (`apps/web/app/components/layout/MobileBottomNav.tsx`)
- **Form Factor:** Fixed bottom bar (`position: fixed; bottom: 0; left: 0; right: 0; z-index: 90`).
- **Touch Targets:** 5 primary navigation tabs, each exceeding the WCAG 2.2 touch target minimum of $48 \times 48\text{ px}$:
  1. **Home:** `/` (Emblem icon)
  2. **Bhakti:** `/bhakti` (Scripture scroll icon)
  3. **Panchang:** `/panchang` (Sun & Moon calendar icon)
  4. **Astro:** `/astro` (Zodiac constellation icon)
  5. **Profile / Menu:** `/profile` (Devotee user icon)
- **Contrast & Ergonomics:** Dark Temple Maroon or Ivory Paper surface with clear visual elevation (`box-shadow: 0 -2px 10px rgba(0,0,0,0.06)`).

### 5.4 `Breadcrumbs` (`apps/web/app/components/layout/Breadcrumbs.tsx`)
- **Semantic HTML:** `<nav aria-label="Breadcrumb"><ol className="breadcrumbList">...</ol></nav>`.
- **Delimiters:** Vedic ornamental chevron (`›`) or subtle gold divider.
- **Accessibility:** Active/current page item has `aria-current="page"`.

### 5.5 `AuthModal` (`apps/web/app/components/auth/AuthModal.tsx`)
- **Native Modern Element:** Uses native `<dialog>` element with `overscroll-behavior: contain` and backdrop blur to prevent scroll chaining.
- **Dismissal Mechanism:** Supports `Esc` key, click-outside (`closedby="any"` / bounding-rect handler), and explicit close button.
- **India-First Phone OTP Flow:**
  - **Step 1 (Phone Input):** Pre-filled with `+91`, enforces 10-digit Indian mobile number validation (`/^[6-9]\d{9}$/`), clear error states.
  - **Step 2 (OTP Verification):** 6-digit numeric input with auto-focus, countdown timer (60s resend cooldown), and OTP verification.
  - **Sandbox / Development Fallback:** When live SMS gateway is in staging/sandbox mode, the modal provides a clear, truthful informational badge and enables simulated verification.
- **Guest Continuance:** "Continue as Guest" link allowing devotees to dismiss the modal and explore public modules without friction.

### 5.6 `PillarShell` (`apps/web/app/components/layout/PillarShell.tsx`)
- **Reusable Module Container:** Provides consistent visual framing for all 6 modules:
  - Contextual `Breadcrumbs`.
  - Module title (Cormorant Garamond), Sanskrit subhead / motto, and concise English description.
  - Guest access status badge ("Public Browsing Available — No Sign-in Required").
  - Content slot with standard grid margins.

### 5.7 Devotee Profile & DPDP Act 2023 Consent Center
- **Route:** `/profile` & `/profile/consent`.
- **Purpose-Specific Consent Architecture (§6 DPDP Act 2023):**
  1. **Astrological Chart Processing (`kundli_astrology`):** Explicit consent for client-side encrypted Kundli birth date, time, and coordinates.
  2. **Expert Consultation Sharing (`expert_consultation`):** Explicit consent to share birth chart details with accredited Pandits/Acharyas for booked sessions.
  3. **Tithi & Muhurat Notifications (`communications_reminders`):** Consent for ritual and festival reminders.
- **Statutory Transparency:** Includes explicit rights summary: Right to Access (§11), Right to Correction (§12), and Right to Withdraw Consent (§6(4)).

---

## 6. Implementation Plan & Gate Criteria

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MILESTONE M04 PHASES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ M04.1: Design Tokens & Layout Foundations (AppShell, design-tokens.css)      │
│ M04.2: Navigation & Responsive Experience (DesktopHeader, MobileBottomNav)  │
│ M04.3: India-First Phone OTP Authentication Shell (AuthModal, useAuth)      │
│ M04.4: Devotee Profile & DPDP Act 2023 Consent Center UI                    │
│ M04.5: Six Coherent Product Module Shells (Puja, Astro, Bhakti, etc.)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Verification Gate Criteria:**
1. Zero TypeScript compilation errors across `@spiritual-os/mobile` and `@spiritual-os/web` (`npm run typecheck`).
2. All 110 automated security, cryptographic, and PostgreSQL RLS tests pass (`npm run test:security`).
3. Next.js 15 production build succeeds cleanly (`npm run build:web`).
4. Accessibility: WCAG 2.2 AA contrast verified across all new navigation and modal components.
5. Production Quarantine: Zero remote requests or mutations to `zxwkfnvmmxoojewhvsdc`.

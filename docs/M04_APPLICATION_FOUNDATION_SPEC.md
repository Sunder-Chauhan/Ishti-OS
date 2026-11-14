# ISHTI M04 — Application Foundation & Architecture Specification

**Milestone:** M04 (Preparation)  
**Project:** ISHTI (internal codename: `spiritual-OS`)  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Branch:** `main`  
**Status:** `ARCHITECTURE SPECIFICATION — IMPLEMENTATION READY PENDING M03.1 SIGN-OFF`

---

## 1. Executive Overview & Scope Boundaries

Milestone **M04** establishes the core application foundation for ISHTI. It bridges the verified backend database contracts and cryptographic security layer (M02/M03) with a cohesive, responsive, and accessible Next.js 15 web application shell and aligns with the Expo mobile application architecture.

### Architectural Ground Rule: Decoupling from Unverified Database State
To prevent development churn while remote staging reconciliation is under approval, M04 is architected with strict dependency inversion:
- **Mock / Offline Fallback Interfaces:** Application shell components interact with typed service contracts (`packages/types`) rather than direct database queries.
- **Server-Only Boundaries:** All direct Supabase calls, cryptographic operations, and rate limiting remain strictly isolated behind server action / route handler barriers.
- **Modular Pillar Isolation:** The 6 core product domains (ISHTI Puja, ISHTI Astro, ISHTI Bhakti, ISHTI Panchang, ISHTI Experts, ISHTI Community) are defined as bounded contexts that plug into the foundation shell without monolithic coupling.

---

## 2. Core Architecture Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ISHTI APPLICATION SHELL                            │
│  - Responsive Navigation (Desktop Header + Mobile Bottom Navigation)        │
│  - Theme & Typography Engine (Cormorant Garamond, Inter, Noto Sans)         │
│  - India-First Phone OTP & Guest Browsing Session Manager                  │
│  - DPDP Act 2023 Consent & Profile Preferences Center                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     WEB (Next.js 15 App)      │             │     MOBILE (Expo / RN)        │
│ - React 19 Server Components   │             │ - React Native Paper / Tamagui│
│ - Async Cookies (@supabase/ssr)│             │ - SecureStore Key Persistence │
│ - Semantic HTML & ARIA a11y   │             │ - Native Haptic & Gestures    │
└───────────────┬───────────────┘             └───────────────┬───────────────┘
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SHARED PACKAGES & SERVICE BOUNDARIES                  │
│  - packages/types: User, Canonical, Astro, Booking, RoleAudit, Consents      │
│  - packages/ui: Shared design tokens, color palette, WCAG 2.2 contrast      │
│  - apps/web/lib/crypto: AES-256-GCM envelope encryption ("server-only")     │
│  - apps/web/lib/security: Rate limiter & role escalation guards             │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Guest Browsing by Default:** Devotees can explore scripture catalog, search verified verses, inspect panchang dates, and browse accredited experts without signing up. Authentication is requested only when performing personalized actions (saving a birth chart, booking a pandit, or posting a query).
2. **India-First Identity:** Phone OTP via SMS is the primary sign-in mechanism; email is optional.
3. **Column-Level Cryptographic Privacy:** Astrological birth data (Kundli DOB, TOB, coordinates) is encrypted client-to-server with AES-256-GCM and user-bound AAD before touching persistent storage.
4. **Strict Module Independence:** Product modules never cross-query each other's private tables.

---

## 3. Next.js 15 Application Shell & Directory Structure

```
apps/web/
├── app/
│   ├── (auth)/                  # Authentication route group (Phone OTP, verify)
│   │   ├── login/
│   │   └── verify-otp/
│   ├── (dashboard)/             # Authenticated user dashboard
│   │   ├── profile/             # Profile management & consent preferences
│   │   └── kundli/              # Encrypted birth chart management
│   ├── (modules)/               # Decoupled product module route groups
│   │   ├── puja/                # ISHTI Puja (Offerings & rituals)
│   │   ├── astro/               # ISHTI Astro (Birth charts & consultations)
│   │   ├── bhakti/              # ISHTI Bhakti (Canonical scripture reader)
│   │   ├── panchang/            # ISHTI Panchang (Vedic almanac)
│   │   ├── experts/             # ISHTI Experts (Verified Acharyas)
│   │   └── community/           # ISHTI Community (Satsang & seva)
│   ├── layout.tsx               # Root layout: font injection, theme providers
│   ├── page.tsx                 # Public landing & ecosystem overview
│   └── globals.css              # ISHTI design tokens and Tailwind v4 base
├── components/
│   ├── navigation/              # Desktop Navbar, Mobile Navigation Bar, Drawer
│   ├── ui/                      # Base buttons, inputs, modals, cards, badges
│   ├── emblem/                  # ISHTI sacred geometric emblem & brand SVGs
│   └── feedback/                # Accessible toasts, alert banners, skeletons
└── lib/
    ├── auth/                    # Client & server auth utilities (@supabase/ssr)
    ├── crypto/                  # AES-256-GCM envelope encryption ("server-only")
    └── security/                # Rate limiter, role guards, proxy headers
```

---

## 4. Design System & ISHTI Branding Tokens

ISHTI’s visual identity balances timeless Vedic sacred geometry with modern, understated luxury.

### Color Tokens & WCAG 2.2 Contrast Standards:
```css
:root {
  /* Primary Foundation */
  --color-charcoal: #1B1816;       /* Temple Charcoal (Primary dark background) */
  --color-ivory: #F7F3EE;          /* Ivory Paper (Primary light surface) */
  --color-ivory-warm: #EFE9E0;     /* Warm Ivory (Card & container surface) */

  /* Sacred Accents */
  --color-saffron: #E07A2B;        /* Vedic Saffron (Primary action accent) */
  --color-gold: #C89B3C;           /* Antique Gold (Sacred ornamental accent) */
  --color-sage: #4B4F40;           /* Deepened Forest Sage (Accessible secondary text) */
  --color-terracotta: #A34828;     /* Terracotta (Warning & highlight accent) */
  --color-border-subtle: #E2DDD5;  /* Subtle dividing borders */
}
```

### Contrast Governance:
- **Normal Text on Ivory:** Temple Charcoal (`#1B1816` on `#F7F3EE`) yields **14.8:1** (exceeds WCAG AAA requirement of 7:1).
- **Secondary Text on Ivory:** Deepened Sage (`#4B4F40` on `#F7F3EE`) yields **7.09:1** (exceeds WCAG AAA requirement).
- **Antique Gold Usage:** Gold (`#C89B3C`) fails 4.5:1 on light Ivory. It is restricted to decorative emblems, borders, or text placed on dark Temple Charcoal (`4.92:1`, WCAG AA compliant).
- **Vedic Saffron Action Buttons:** Saffron buttons use Temple Charcoal text for high contrast (contrast ratio $\ge 5.2:1$).

### Typography Hierarchy:
- **Headings & Sacred Quotes:** *Cormorant Garamond* (Serif, refined classical elegance).
- **Interface & Body Text:** *Inter* (Clean, highly legible neo-grotesque sans-serif).
- **Sanskrit & Devanagari Corpus:** *Noto Sans Devanagari* (Accurate rendering of conjuncts, viramas, and Vedic accents).

---

## 5. Authentication & Onboarding Architecture

```
[Unauthenticated User] ──► Explores Public Corpus / Panchang / Pandits
                                  │
                       [User Initiates Booking or Kundli Save]
                                  │
                                  ▼
                       [Request Phone Number]
                                  │
                                  ▼
                       [Send 6-Digit SMS OTP via GoTrue]
                                  │
                                  ▼
                       [Devotee Enters OTP]
                                  │
                                  ▼
                       [GoTrue Verifies OTP]
                                  │
                                  ▼
           [Database Trigger: public.handle_new_user()]
           - Inserts public.profiles with role = 'devotee'
           - is_verified = FALSE
           - Metadata tampering prevented
                                  │
                                  ▼
                       [Prompt DPDP Consent Form]
                       - kundli_astrology consent
                       - expert_consultation consent
                                  │
                                  ▼
                       [Redirect to Requested Feature]
```

---

## 6. User Profile Experience & DPDP Act 2023 Consent Center

### Privacy & Rights Management:
1. **Consent Transparency (§6 DPDP Act 2023):**
   - The user profile features an interactive Consent Center where devotees can inspect and toggle individual purposes (`kundli_astrology`, `expert_consultation`, `marketing_updates`, `analytics`).
   - Every toggle creates an immutable record in `public.user_consents` containing `purpose`, `granted` (TRUE/FALSE), `consent_version`, and a one-way salted SHA-256 hash of the client IP.
2. **Right to Erasure (§12 DPDP Act 2023):**
   - An account deletion workflow triggers cascading deletion of `kundli_profiles`, `booking_requests`, and `user_consents` via database constraints (`ON DELETE CASCADE`).
   - Audit trail (`public.role_assignment_audit`) retains non-PII historical administrative logs with user ID set to tombstone UUID.

---

## 7. Responsive Navigation & Accessibility (a11y) Standards

### Desktop Navigation:
- **Top Header:** Fixed translucent header with backdrop blur (`backdrop-blur-md`). Transitions to solid Temple Charcoal or Ivory upon scroll.
- **Brand Emblem:** Sacred geometric ISHTI emblem linking to `/`.
- **Primary Links:** Bhakti (Scriptures), Panchang, Puja, Astro (Kundli), Experts.
- **Action Group:** Language toggle (`EN` / `HI` / `SA`), User Avatar / Sign-in trigger.

### Mobile Navigation:
- **Bottom Navigation Bar:** Fixed bottom bar with 5 primary tap targets (Home, Bhakti, Panchang, Astro, Profile).
- **Touch Target Sizing:** Minimum $48 \times 48\text{ px}$ interactive touch area across all touch targets.
- **Keyboard & Screen Reader Accessibility:**
  - `role="navigation"`, `aria-label="Main Navigation"`, `aria-current="page"` on active links.
  - Full keyboard focus trap in mobile navigation drawer.
  - Skip to main content link (`<a href="#main-content" className="sr-only focus:not-sr-only">`).

---

## 8. Bounded Context Separation for Product Modules

To avoid a monolithic architecture, product domains are strictly isolated:

| Product Module | Route Prefix | Primary Entities Owned | Cross-Module Interactions |
| :--- | :--- | :--- | :--- |
| **ISHTI Puja** | `/puja` | Ritual offerings, temple seva, samagri kits | Coordinates with Experts for officiating pandits |
| **ISHTI Astro** | `/astro` | `kundli_profiles`, birth charts, planetary positions | Coordinates with Experts for astrological consultations |
| **ISHTI Bhakti** | `/bhakti` | `scripture_catalog`, `canonical_verses`, audio chants | Standalone canonical corpus; zero write dependency |
| **ISHTI Panchang** | `/panchang` | Astronomical ephemeris, tithis, nakshatras, muhurtas | Feeds calendar dates to Puja and Astro |
| **ISHTI Experts** | `/experts` | `expert_profiles`, `consultation_slots`, `booking_requests` | Officiates pujas and conducts Kundli readings |
| **ISHTI Community** | `/community` | Satsang circles, temple notices, devotional forums | Devotee discussions bound by moderation rules |

---

## 9. Web / Mobile (Expo) Architecture Alignment

| Architectural Component | Next.js 15 Web Application | Expo / React Native Mobile Application |
| :--- | :--- | :--- |
| **Language & Typing** | TypeScript 5.8 | TypeScript 5.8 |
| **Routing Pattern** | Next.js App Router (`apps/web/app`) | Expo Router with file-based tabs (`apps/mobile/app`) |
| **Token Storage** | HttpOnly secure session cookies (`@supabase/ssr`) | SecureStore encrypted hardware keychain |
| **State & Data Fetching** | Server Actions + React Cache | React Query / TanStack Query |
| **Styling** | Tailwind CSS v4 + CSS variables | React Native StyleSheet / shared tokens |
| **Shared Contracts** | `packages/types` monorepo workspace | `packages/types` monorepo workspace |

---

## 10. Implementation Sequence for Milestone M04

```
Phase 1: Foundation Shell (Layout, Fonts, Navigation Header, Footer, a11y)
   │
   ▼
Phase 2: Authentication & Onboarding (Phone OTP modal, session middleware)
   │
   ▼
Phase 3: Devotee Profile & Consent Center (DPDP Act 2023 compliance UI)
   │
   ▼
Phase 4: ISHTI Bhakti (Canonical scripture reader & verified verse display)
   │
   ▼
Phase 5: ISHTI Astro (Encrypted Kundli creation & chart visualization)
   │
   ▼
Phase 6: ISHTI Experts & Booking (Accredited pandits & atomic slot booking)
```

**Approval Gate:** Implementation of M04 phases will commence immediately upon execution and verification of Milestone M03.1 staging reconciliation.

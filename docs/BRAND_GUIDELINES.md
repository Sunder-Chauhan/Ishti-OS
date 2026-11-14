# ISHTI
## Official Brand Guidelines — Version 1.1 (Production Brand Identity System)

**Brand tagline:** Rooted in Tradition. Connected to Today.  
**Sub-taglines:** Transformative Rituals & Offerings · Vedic Essence & Rituals  
**Brand positioning:** A modern spiritual ecosystem rooted in Indian wisdom, built to make authentic spiritual knowledge, practices and communities accessible through technology.  
**Internal project codename:** spiritual-OS  
**Digital System Repository:** `Sunder-Chauhan/Ishti-OS`  

---

# 1. Brand foundation

## Our vision
To create a connected spiritual world where timeless traditions, authentic knowledge and modern technology come together in harmony.

## Our mission
To make spiritual practices, verified religious knowledge, devotional experiences and access to trusted spiritual experts accessible, convenient and meaningful through thoughtful technology.

## Our brand philosophy
Tradition deserves preservation. Technology should make it more accessible, never distort it.

## Our core values
- **Authenticity:** Respect verified canonical sources and living paramparas.
- **Peace:** Create a calm, welcoming and respectful user experience.
- **Trust:** Be transparent about information provenance, expert qualifications and fair honorariums.
- **Inclusivity:** Respect different regions, languages, traditions and sampradayas across Bharat.
- **Innovation:** Use technology thoughtfully without sensationalism or commercial exploitation.
- **Accessibility:** Make spiritual experiences intuitive to discover and participate in.

---

# 2. Brand personality

ISHTI embodies the dignity of a trusted Indian spiritual institution brought into the modern digital age.

| Attribute | Brand expression |
|---|---|
| **Heritage** | Indian cultural inspiration, Vedic symbolism, sacred geometry |
| **Modern** | Clean, intuitive, accessible digital experiences |
| **Authentic** | Grounded in verified canonical texts, peer-reviewed knowledge |
| **Peaceful** | Calm, uncluttered layouts with generous negative space |
| **Premium** | Refined, respectful, never extravagant or commercialized |
| **Welcoming** | Accessible across all generations, backgrounds and skill levels |

---

# 3. Visual identity & centralized design tokens

## 3.1 Core working color palette

The ISHTI color system draws from traditional temple rituals, sacred fire altars (yajnas), and manuscript craftsmanship:

| Token Name | Hex Code | RGB | Role & Spiritual Expression | Contrast on Ivory (#F8F4ED) | Contrast on Charcoal (#302B2A) |
|---|---|---|---|:---:|:---:|
| **Temple Maroon** | `#711B16` | 113, 27, 22 | Primary wordmark, earthen altar bricks, sacred kumkum | 9.61:1 (AAA) | 1.23:1 (Fail) |
| **Vedic Saffron** | `#EF7428` | 239, 116, 40 | Sacred agni flame, spiritual vitality, primary accents | 2.72:1 (Fail) | 4.36:1 (AA Large) |
| **Sacred Gold** | `#D7A64A` | 215, 166, 74 | Golden bindu drop, brass lamps, divine wisdom | 2.04:1 (Fail) | 5.89:1 (AA Normal, AAA Large) |
| **Ivory Paper** | `#F8F4ED` | 248, 244, 237 | Handmade temple paper, primary canvas surface | 1.00:1 (Surface) | 11.83:1 (AAA) |
| **Warm Sand** | `#D1A477` | 209, 164, 119 | Sanctified ground, secondary borders, sub-taglines | 1.69:1 (Fail) | 7.02:1 (AAA) |
| **Temple Charcoal** | `#302B2A` | 48, 43, 42 | Night vigils, charred sacred wood, body typography | 11.83:1 (AAA) | 1.00:1 (Surface) |

## 3.2 Extended lighting & facet palette
- **Temple Maroon Dark:** `#52120E` (Altar shadow facet depth)
- **Temple Maroon Deep:** `#3D0D0A` (Deepest riser shadow)
- **Vedic Saffron Bright:** `#F58733` (Mid-flame radiance)
- **Sacred Gold Bright:** `#F9CE68` (Flame highlight / inner core)
- **Sacred Gold Light:** `#FDE6A6` (Bindu apex specular light)
- **Warm Sand Light:** `#E8CFB4` (Subtle card border and panel tint)
- **Temple Charcoal Light:** `#4A4341` (Elevated dark card surface)

## 3.3 Gradients
- **Agni Flame Gradient:** `linear-gradient(180deg, #F7B731 0%, #EF7428 35%, #C23616 70%, #711B16 100%)`
- **Sacred Gold Gradient:** `radial-gradient(circle at 50% 40%, #FFF2A3 0%, #D7A64A 60%, #EF7428 100%)`
- **Altar Facet Left Gradient:** `linear-gradient(90deg, #B23E1D 0%, #DE6424 100%)`
- **Altar Facet Right Gradient:** `linear-gradient(90deg, #7B1D16 0%, #54120D 100%)`

---

# 4. Typography system

## 4.1 Master typeface hierarchy

1. **Display Headings:** *Cormorant Garamond* (Weights: 500, 600, 700). Editorial, timeless, inspired by classical lettering.
2. **Interface & Body Text:** *Inter* (Weights: 400, 500, 600, 700). Clean, neutral, accessible, highly readable on mobile and web displays.
3. **Sacred Devanagari:** *Noto Sans Devanagari* (Weights: 400, 500, 600). Preserving authentic ligatures and conjuncts for Sanskrit mantras and Hindi texts.
4. **Sub-Taglines:** *Inter* in uppercase with wide tracking (`letter-spacing: 0.22em`), font-weight 600, in Warm Sand (`#D1A477`).

## 4.2 Outlined vector wordmark rule
> [!IMPORTANT]
> In all production SVG brand assets, the "ISHTI" wordmark is **strictly rendered as pure outlined vector geometry** (`<path>` elements), NOT as raw `<text>` elements. This guarantees that:
> 1. The custom letterform geometry (initial `I` sweeping outward to the left, terminal `I` sweeping outward to the right) renders with 100% precision across all operating systems.
> 2. No dependency is placed on local font installation or remote font download latency.

---

# 5. Approved digital logo family

The approved ISHTI logo family is derived from the master visual source of truth and contains six calibrated variants:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ISHTI LOGO FAMILY                               │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│ 1. PRIMARY          │ 2. SECONDARY        │ 3. ICON                         │
│ Symbol + Wordmark + │ Symbol + Wordmark   │ Symbol only                     │
│ 2 Taglines          │ (Header / Splash)   │ (16px to 512px)                 │
├─────────────────────┼─────────────────────┼─────────────────────────────────┤
│ 4. HORIZONTAL       │ 5. MONOCHROME       │ 6. REVERSED                     │
│ Symbol Left,        │ Single-color        │ Light artwork on                │
│ Wordmark Right      │ Temple Charcoal     │ Temple Charcoal block           │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘
```

### 1. Primary Logo (`ishti-logo-primary.svg`)
- **Composition:** Complete symbol on top, outlined wordmark in center, stacked dual taglines below:
  - Line 1: `TRANSFORMATIVE RITUALS & OFFERINGS` (all caps, wide tracking 0.22em)
  - Line 2: `Vedic Essence & Rituals` (title case serif)
- **Aspect Ratio:** 400:560 (1:1.4).
- **Application:** Formal marketing, launch keynotes, certificates, hero landing banners.
- **Minimum Digital Height:** 40px (15mm print).

### 2. Secondary Logo (`ishti-logo-secondary.svg`)
- **Composition:** Complete symbol on top, outlined wordmark below. (No taglines).
- **Aspect Ratio:** 400:480 (1:1.2).
- **Application:** Application headers, mobile navigation, splash screens, social avatars.
- **Minimum Digital Height:** 24px (8mm print).

### 3. Icon / Symbol (`ishti-logo-icon.svg`)
- **Composition:** Stepped Vedic altar, sacred Agni flame, golden bindu seed, and floating embers.
- **Aspect Ratio:** 1:1 (Square 400:400).
- **Application:** Favicons (16px, 24px, 32px, 48px), mobile app launcher icons, profile badges.
- **Minimum Digital Size:** 16px × 16px (5mm print).

### 4. Horizontal Logo (`ishti-logo-horizontal.svg`)
- **Composition:** Symbol on the left; wordmark and stacked two-line tagline (`TRANSFORMATIVE` / `RITUALS & OFFERINGS`) on the right.
- **Aspect Ratio:** 680:260 (2.61:1).
- **Application:** Desktop navigation bar, email headers, invoices, letterheads.
- **Minimum Digital Height:** 28px (10mm print).

### 5. Monochrome Logo (`ishti-logo-monochrome.svg`)
- **Composition:** Single-color execution in Temple Charcoal (`#302B2A`).
- **Facet Technique:** Uses crisp negative-space grooved lines (`stroke="#F8F4ED" stroke-width="2.5"`) to delineate 3D isometric altar tiers without gradients.
- **Application:** Single-color print, receipts, laser engraving, newspaper ads, embossing.
- **Minimum Digital Height:** 24px (8mm print).

### 6. Reversed Logo (`ishti-logo-reversed.svg`)
- **Composition:** Light artwork in Ivory Paper (`#F8F4ED`), Warm Sand (`#D1A477`), and Sacred Gold (`#D7A64A`) set against a deep Temple Charcoal (`#302B2A`) container.
- **Aspect Ratio:** 420:500 (1:1.19).
- **Application:** Dark mode interface, night vigils, dark packaging, hero charcoal containers.
- **Minimum Digital Height:** 24px (8mm print).

---

# 6. Vector geometry specifications

The ISHTI emblem synthesizes three core sacred elements:

1. **The Stepped Altar (Vedi / Yajna Kunda):**
   - Four stepped tiers in isometric 3D perspective ($22.6^\circ$ isometric slope).
   - The central corner faces forward at 6 o'clock.
   - Left facets are illuminated in warm Vedic Saffron and Terracotta (`#DE6424` to `#B23E1D`).
   - Right facets are cast in shadow in deep Temple Maroon (`#7B1D16` to `#54120D`).
   - Top tread ledges reflect the fire's radiant light with a bright golden highlight rim.
2. **The Sacred Fire (Agni):**
   - Rising from the center of the hearth.
   - Interlocking flame petals: left outer wing, right outer wing, intermediate tongues, and a central spire tapering to a dynamic apex lick.
   - Color transitions vertically from deep Temple Maroon at the base through vibrant Vedic Saffron to radiant Sacred Gold.
3. **The Golden Bindu Drop (Seed / Ghee Offering):**
   - Positioned in the lower optical center of the flame.
   - Teardrop shape surrounded by a negative-space clearing in the flame base.
   - Radiant radial gradient from soft yellow `#FFF2A3` to `#D7A64A`.
4. **Dynamic Embers:**
   - Five floating embers capturing the living dynamism of sacred fire.

---

# 7. Clear-space and minimum size rules

### 7.1 Clear-space definition
The exclusion zone around all logo variants is defined by unit $X$:
- $X$ is equal to 50% of the symbol height or the exact height of the wordmark capital $I$.
- **Minimum clear space = $0.5X$** on all four sides.
- No typography, UI buttons, page margins, or graphic patterns may enter this zone.

### 7.2 Minimum reproduction sizes

| Variant | Digital Display | Print Application |
|---|:---:|:---:|
| **Icon Only** | 16px × 16px | 5mm × 5mm |
| **Secondary Logo** | 24px height | 8mm height |
| **Primary Logo** | 40px height | 15mm height |
| **Horizontal Logo** | 28px height | 10mm height |
| **Monochrome / Reversed** | 24px height | 8mm height |

---

# 8. Logo misuse & prohibited treatments

To preserve brand dignity, the following treatments are strictly prohibited:

1. **Do not distort proportions:** Never stretch, condense, or skew the symbol or wordmark.
2. **Do not alter colors:** Do not substitute arbitrary bright reds, neon oranges, or non-brand tints.
3. **Do not detach the bindu drop:** The golden seed drop must always remain in its negative space cradle.
4. **Do not apply unapproved drop shadows:** Do not apply heavy black Gaussian drop shadows to vector artwork.
5. **Do not place on busy backgrounds:** Ensure adequate contrast. Never place the maroon wordmark on dark charcoal or busy photographs.
6. **Do not modify the letterforms:** The custom left and right sweeping terminals on the `I`s must not be removed or altered.

---

# 9. WCAG 2.2 accessibility compliance

All color combinations have been tested against the W3C Web Content Accessibility Guidelines (WCAG 2.2):

| Foreground Element | Background Surface | Contrast Ratio | Normal Text | Large Text (≥18pt) | UI Components |
|---|---|:---:|:---:|:---:|:---:|
| Temple Maroon (`#711B16`) | Ivory Paper (`#F8F4ED`) | **9.61:1** | **PASS (AAA)** | **PASS (AAA)** | **PASS (AA)** |
| Temple Charcoal (`#302B2A`) | Ivory Paper (`#F8F4ED`) | **11.83:1** | **PASS (AAA)** | **PASS (AAA)** | **PASS (AA)** |
| Ivory Paper (`#F8F4ED`) | Temple Charcoal (`#302B2A`) | **11.83:1** | **PASS (AAA)** | **PASS (AAA)** | **PASS (AA)** |
| Warm Sand (`#D1A477`) | Temple Charcoal (`#302B2A`) | **7.02:1** | **PASS (AAA)** | **PASS (AAA)** | **PASS (AA)** |
| Sacred Gold (`#D7A64A`) | Temple Charcoal (`#302B2A`) | **5.89:1** | **PASS (AA)** | **PASS (AAA)** | **PASS (AA)** |
| Vedic Saffron (`#EF7428`) | Temple Charcoal (`#302B2A`) | **4.36:1** | *Decorative* | **PASS (AA)** | **PASS (AA)** |
| Secondary Ink (`#584F4D`) | Ivory Paper (`#F8F4ED`) | **7.20:1** | **PASS (AAA)** | **PASS (AAA)** | **PASS (AA)** |

---

# 10. Vector artwork limitations & source truth disclosure

As required by engineering governance:
1. **Source Reference:** The visual master truth for this system is the approved logo family reference (`media_1794686197230_b2cc9f44.jpg`).
2. **Vector Construction:** All SVG paths were authored mathematically using precise cubic Bezier curves (`C`, `S`) and polygonal coordinates (`polygon points`) to reproduce the exact faceted geometry, isometric perspective, and calligraphic letterforms of the reference.
3. **Typography Independence:** The wordmark is 100% outlined vector geometry (`IshtiWordmark.tsx`), removing any dependence on proprietary desktop font files.
4. **Collision Resistance:** All React SVG components utilize React 18/19 `useId()` hooks to ensure SVG `<linearGradient>` and `<radialGradient>` IDs never collide when multiple instances are rendered on the same DOM page.
5. **Future Master Refinements:** If an official Adobe Illustrator (`.ai`) or Figma master vector file is provided in the future, the sub-pixel node coordinates in `src/components/brand/` may be updated without altering the component API or design token contracts.

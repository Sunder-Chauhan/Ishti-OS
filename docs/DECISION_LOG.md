# Decision Log
## 2026-11-13 — Local-first foundation
Decision: npm-workspaces monorepo named spiritual-OS; Next.js/TypeScript web; Expo/React Native/TypeScript mobile.
Status: scaffold only. Dependency compatibility must be verified during installation.
Open: Supabase setup, live provider, music licences, astrology engine/licence.
## 2026-11-13 — YUGON brand foundation
Decision: Public brand is YUGON. Web and mobile share the v1.0 palette, Cormorant Garamond, Inter and Noto Sans Devanagari. The repository name stays spiritual-OS.
Contrast: Antique Gold, Sage and Terracotta fail normal text on Ivory, so they are accents. Secondary text uses Sage deepened to #4B4F40 (7.09:1 on Ivory). Gold text is used only on Temple Charcoal (4.92:1).
Open: Final logo, app icon, spacing spec and legal approval.
## 2026-11-13 — Foundation Technical & Product Audit
Decision: Prioritise foundational architecture before building product modules. Partition database into 6 bounded contexts; enforce strict Row-Level Security (RLS); classify astrological birth data as High-Risk PII requiring column-level encryption; implement Phone OTP (India-first) + guest browsing; enforce a canonical knowledge ingestion pipeline with strict RAG bounding; implement DPDP Act 2023 compliance.
Status: Audit complete. Transitioning to Milestone M02.
## 2026-11-14 — Milestone M02 Backend Foundation & Data Security
Decision: Integrate Supabase via `@supabase/ssr` (Next.js 15 async cookie store) and `@supabase/supabase-js`. Encrypt Kundli birth records (DOB, TOB, coordinates) at rest with `pgcrypto`. Maintain strict RLS across all tables (public read for verified scriptures and active accredited pandits; user isolation for kundli and bookings). Implement honeypot-protected Early Access Server Action with truthful feedback explaining migration state.
Status: Contracts, clients, initial migration script, and early access form implemented and verified. Production build passes cleanly.
Open: Direct execution of migrations via Supabase SQL Editor / database password; SMS aggregator credentials.
## 2026-11-14 — Brand Migration to ISHTI & Security Remediation (Pre-Deployment)
Decision: Official public-facing brand name is migrated from interim codename YUGON to ISHTI across all web and mobile touchpoints, page metadata, navigation, footer, design system documents, and product families (ISHTI Puja, ISHTI Astro, ISHTI Bhakti, ISHTI Panchang, ISHTI Experts, ISHTI Community). Internal technical identifiers (`spiritual-OS` codename, package namespaces `@spiritual-os/*`, repository `Ishti-OS`) are preserved.
## 2026-11-14 — Second Security Audit & Critical Remediation
Decision: Resolve deep correctness and production security flaws identified in M02 pre-deployment review:
1. Eliminate recursive RLS on `public.profiles` by introducing `public.is_admin()` and `public.is_scholar()` SECURITY DEFINER helper functions with search_path hardening.
2. Establish a trusted administrative role assignment mechanism: create `public.role_assignment_audit` and `public.assign_user_role()`, ensuring service-role and admin operations succeed while client self-promotion is strictly blocked.
3. Replace superficial database byte checks with a production application-layer AES-256-GCM envelope encryption service (`apps/web/lib/crypto/kundli-encryption.ts`) utilizing fresh 96-bit IVs, 128-bit authentication tags, and user-bound AAD.
4. Replace in-memory rate limiting with an atomic, distributed PostgreSQL sliding-window table (`public.rate_limit_events`) and RPC function (`public.check_rate_limit()`) supporting proxy header extraction and dynamic cryptographic salting.
5. Fix booking lifecycle deadlock: replace naive table unique constraint with a partial unique index (`idx_unique_active_slot_booking WHERE status NOT IN ('cancelled', 'refunded')`), enabling cancelled/refunded consultation slots to be safely rebooked without destroying booking history.
6. Reassess scripture provenance: un-mark hardcoded verification on Rigveda 10.191.2 seed, setting `review_status = 'pending_peer_review'` and recording Griffith 1896 public-domain citation honestly without fabricated reviewers.
7. Correct DPDP Act 2023 terminology: separate statutory compliance obligations from internal ISHTI data sensitivity classifications (Level 4 — Highly Confidential).
Status: Expanded test suite (45 automated checks across static, unit, integration, and database simulation) passing 100%. Pre-deployment constraints preserved.

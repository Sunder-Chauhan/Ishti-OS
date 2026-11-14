-- ==============================================================================
-- YUGON (Ishti-OS) Milestone M02 Initial Database Schema
-- Bounded Contexts: Core Auth, DPDP Consent, Canonical Scripture Corpus,
-- Astro Kundli (PII Encrypted), Expert Network, Bookings, Early Access.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE AUTH & USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  email TEXT,
  full_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'devotee' CHECK (role IN ('devotee', 'expert_pandit', 'content_scholar', 'platform_admin')),
  language_preference TEXT NOT NULL DEFAULT 'hi',
  sampradaya_tradition TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for phone/email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Auto-sync profile on auth.users creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Devotee'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'devotee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. DPDP ACT 2023 CONSENT AUDIT LOG
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('kundli_astrology', 'expert_consultation', 'marketing_updates', 'analytics')),
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  ip_hash TEXT,
  user_agent TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id, purpose);

-- 4. CANONICAL SCRIPTURE CORPUS
CREATE TABLE IF NOT EXISTS public.scripture_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_iast TEXT NOT NULL,
  title_devanagari TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('veda', 'upanishad', 'purana', 'itihasa', 'darshana', 'stotra', 'agamas')),
  description TEXT NOT NULL,
  total_verses INTEGER,
  language TEXT NOT NULL DEFAULT 'sanskrit' CHECK (language IN ('sanskrit', 'prakrit', 'hindi')),
  status TEXT NOT NULL DEFAULT 'curated' CHECK (status IN ('curated', 'scholarly_review', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.canonical_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scripture_id UUID NOT NULL REFERENCES public.scripture_catalog(id) ON DELETE CASCADE,
  canto_kanda_mandal INTEGER,
  chapter_adhyaya_sukta INTEGER,
  verse_number INTEGER NOT NULL,
  devanagari TEXT NOT NULL,
  iast TEXT NOT NULL,
  word_for_word JSONB,
  translations JSONB NOT NULL DEFAULT '[]'::jsonb,
  meter_chandas TEXT,
  deity_devata TEXT,
  seer_rishi TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  review_status TEXT NOT NULL DEFAULT 'verified' CHECK (review_status IN ('verified', 'pending_peer_review', 'flagged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canonical_verses_scripture ON public.canonical_verses(scripture_id, verse_number);

-- Full-text search index on Devanagari and IAST
CREATE INDEX IF NOT EXISTS idx_canonical_verses_fts ON public.canonical_verses USING gin(
  to_tsvector('simple', devanagari || ' ' || iast)
);

-- Seed Rigveda 10.191.2 (Samjnana Sukta) as benchmark canonical verse
INSERT INTO public.scripture_catalog (id, slug, title_iast, title_devanagari, category, description, language, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'rigveda',
  'Rigveda Samhita',
  'ऋग्वेद संहिता',
  'veda',
  'The oldest canonical Vedic text containing 1,028 suktas across 10 mandalas.',
  'sanskrit',
  'curated'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.canonical_verses (
  id,
  scripture_id,
  canto_kanda_mandal,
  chapter_adhyaya_sukta,
  verse_number,
  devanagari,
  iast,
  translations,
  meter_chandas,
  deity_devata,
  seer_rishi,
  review_status
)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  10,
  191,
  2,
  'सं गच्छध्वं सं वदध्वं सं वो मनांसि जानताम् । देवा भागं यथा पूर्वे संजानाना उपासते ॥',
  'saṃ gacchadhvaṃ saṃ vadadhvaṃ saṃ vo manāṃsi jānatām | devā bhāgaṃ yathā pūrve saṃjānānā upāsate ||',
  '[{"language": "en", "translator": "Ralph T.H. Griffith / Rigveda 10.191.2", "text": "Meet together, speak together, let your minds be of one accord, as the devas of old sat together in harmony to receive their portion."},{"language": "hi", "translator": "Traditional Acharya Interpretation", "text": "तुम सब एक साथ मिलकर चलो, एक स्वर में बोलो, तुम्हारे मनों में एक जैसा ज्ञान हो, जिस प्रकार प्राचीन काल में देवगण एकमत होकर अपना यज्ञ भाग ग्रहण करते थे।"}]'::jsonb,
  'Anushtup',
  'Agni / Samjnana',
  'Samvanana Angirasa',
  'verified'
)
ON CONFLICT (id) DO NOTHING;

-- 5. ASTROLOGICAL PROFILES (KUNDLI) WITH PII ENCRYPTION
CREATE TABLE IF NOT EXISTS public.kundli_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  -- Tier-1 Sensitive Personal Data: Date of Birth, Time of Birth, Coordinates (Latitude/Longitude)
  encrypted_dob BYTEA NOT NULL,
  encrypted_tob BYTEA NOT NULL,
  encrypted_coordinates BYTEA NOT NULL,
  ayanamsha TEXT NOT NULL DEFAULT 'LAHIRI' CHECK (ayanamsha IN ('LAHIRI', 'RAMAN', 'KRISHNAMURTI_PADHDHATI', 'YUKTESHWAR')),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kundli_profiles_user ON public.kundli_profiles(user_id);

-- 6. EXPERT NETWORK & BOOKINGS
CREATE TABLE IF NOT EXISTS public.expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  languages TEXT[] NOT NULL DEFAULT '{Hindi, Sanskrit}',
  gurukul_or_institution TEXT,
  bio TEXT NOT NULL,
  hourly_fee_inr INTEGER NOT NULL DEFAULT 1100,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'documents_submitted', 'scholarly_vetted', 'accredited')),
  rating NUMERIC(3, 2),
  review_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consultation_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  slot_id UUID REFERENCES public.consultation_slots(id) ON DELETE RESTRICT,
  service_type TEXT NOT NULL CHECK (service_type IN ('online_consultation', 'in_person_puja', 'kundli_matching')),
  status TEXT NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'confirmed', 'completed', 'cancelled', 'refunded')),
  amount_inr INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EARLY ACCESS SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.early_access_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  preferred_tradition TEXT,
  interested_in TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'homepage',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT at_least_one_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_early_access_email ON public.early_access_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_early_access_phone ON public.early_access_subscribers(phone);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripture_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kundli_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_access_subscribers ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile; public can read basic info of experts
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Public can view verified expert profiles"
  ON public.profiles FOR SELECT
  USING (role = 'expert_pandit' AND is_verified = TRUE);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- DPDP Consents: Users can view and insert their own consents
CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Scripture Catalog: Public read access
CREATE POLICY "Public read scripture catalog"
  ON public.scripture_catalog FOR SELECT
  USING (status IN ('curated', 'scholarly_review'));

CREATE POLICY "Scholars and admins can manage scripture catalog"
  ON public.scripture_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('content_scholar', 'platform_admin')
    )
  );

-- Canonical Verses: Public read access for verified verses
CREATE POLICY "Public read verified verses"
  ON public.canonical_verses FOR SELECT
  USING (review_status = 'verified');

CREATE POLICY "Scholars and admins can manage verses"
  ON public.canonical_verses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('content_scholar', 'platform_admin')
    )
  );

-- Kundli Profiles: Strict isolation (owner-only)
CREATE POLICY "Owner-only select kundli"
  ON public.kundli_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner-only insert kundli"
  ON public.kundli_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner-only update kundli"
  ON public.kundli_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner-only delete kundli"
  ON public.kundli_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Expert Profiles: Public read for active experts
CREATE POLICY "Public read active experts"
  ON public.expert_profiles FOR SELECT
  USING (is_active = TRUE AND verification_status = 'accredited');

CREATE POLICY "Experts can update their own profile"
  ON public.expert_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Consultation Slots: Public can view unbooked slots of active experts
CREATE POLICY "Public view available slots"
  ON public.consultation_slots FOR SELECT
  USING (is_booked = FALSE);

-- Booking Requests: Devotee and Expert can view their bookings
CREATE POLICY "Devotees can view their bookings"
  ON public.booking_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Experts can view assigned bookings"
  ON public.booking_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expert_profiles
      WHERE expert_profiles.id = booking_requests.expert_id
      AND expert_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Devotees can create bookings"
  ON public.booking_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Early Access Subscribers: Anyone can submit early access; only platform admins can read
CREATE POLICY "Anyone can register for early access"
  ON public.early_access_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view early access subscribers"
  ON public.early_access_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

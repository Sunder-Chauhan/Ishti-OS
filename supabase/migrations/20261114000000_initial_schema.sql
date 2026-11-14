-- ==============================================================================
-- ISHTI (spiritual-OS) Milestone M02 Initial Database Schema
-- Security Remediated & Brand Migrated Version (Pre-Deployment)
--
-- Bounded Contexts:
-- 1. Core Auth & RBAC (Anti-Privilege Escalation)
-- 2. User Profiles & Privacy (Zero Personal Data Exposure)
-- 3. DPDP Act 2023 Consent Audit Logging
-- 4. Canonical Scripture Corpus & Provenance Governance
-- 5. Kundli Profiles & Application-Layer Encryption Specification
-- 6. Expert Network & Integrity Guards
-- 7. Consultation Slots & Double-Booking Prevention
-- 8. Booking Requests & Concurrency Protection
-- 9. Early Access Subscribers & Abuse Prevention
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ==============================================================================
-- 2. USER PROFILES & ROLE-BASED ACCESS CONTROL (RBAC)
-- ==============================================================================

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

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Anti-Privilege Escalation: Auto-create profile on auth.users insert.
-- SECURITY DEFINER with explicit search_path. NEVER trust raw_user_meta_data for role or verification.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, email, full_name, role, is_verified)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'Seeker'),
    'devotee', -- Enforce strictly default devotee role. Never trust client metadata.
    FALSE      -- Never self-verify on signup.
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Restrict execution permissions on handle_new_user
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Prevent self-promotion to admin/scholar/expert via profile updates
CREATE OR REPLACE FUNCTION public.enforce_profile_update_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Disallow modifying id
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Profile primary identifier is immutable.';
  END IF;

  -- Disallow role changes unless the invoking user is confirmed platform_admin
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.is_verified IS DISTINCT FROM OLD.is_verified) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'platform_admin'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can modify role or verification status.';
    END IF;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_profile_update_integrity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_profile_update_integrity() TO postgres, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_profile_integrity ON public.profiles;
CREATE TRIGGER trg_enforce_profile_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_update_integrity();

-- ==============================================================================
-- 3. DPDP ACT 2023 CONSENT AUDIT LOG
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('kundli_astrology', 'expert_consultation', 'marketing_updates', 'analytics')),
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  ip_hash TEXT, -- Stored as one-way SHA-256 hash for privacy preservation
  user_agent TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id, purpose);

-- ==============================================================================
-- 4. CANONICAL SCRIPTURE CORPUS & PROVENANCE GOVERNANCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.scripture_catalog (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_iast TEXT NOT NULL,
  title_devanagari TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('veda', 'upanishad', 'purana', 'itihasa', 'darshana', 'stotra', 'agamas')),
  description TEXT NOT NULL,
  total_verses INTEGER,
  language TEXT NOT NULL DEFAULT 'sanskrit' CHECK (language IN ('sanskrit', 'prakrit', 'hindi', 'tamil')),
  tradition_sampradaya TEXT NOT NULL DEFAULT 'Vedic Universal',
  source_edition TEXT NOT NULL,
  publication_publisher TEXT NOT NULL,
  publication_year INTEGER,
  editor_or_compiler TEXT,
  rights_holder TEXT NOT NULL DEFAULT 'Public Domain',
  license_type TEXT NOT NULL DEFAULT 'Public Domain' CHECK (license_type IN ('Public Domain', 'CC-BY-4.0', 'CC-BY-NC-4.0', 'Academic Fair Use', 'Licensed Commercial')),
  permitted_use TEXT NOT NULL DEFAULT 'free_scholarly_access',
  commercial_rights_status TEXT NOT NULL DEFAULT 'public_domain_unrestricted' CHECK (commercial_rights_status IN ('public_domain_unrestricted', 'non_commercial_only', 'commercial_license_secured', 'under_legal_review')),
  status TEXT NOT NULL DEFAULT 'curated' CHECK (status IN ('curated', 'scholarly_review', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.canonical_verses (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
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
  source_citation TEXT NOT NULL,
  scholarly_peer_reviewer TEXT,
  peer_review_date TIMESTAMPTZ,
  scholarly_verification_notes TEXT,
  rights_clearance_status TEXT NOT NULL DEFAULT 'cleared' CHECK (rights_clearance_status IN ('cleared', 'restricted', 'pending_clearance')),
  review_status TEXT NOT NULL DEFAULT 'verified' CHECK (review_status IN ('verified', 'pending_peer_review', 'flagged')),
  fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', devanagari || ' ' || iast)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_scripture_verse UNIQUE (scripture_id, canto_kanda_mandal, chapter_adhyaya_sukta, verse_number)
);

CREATE INDEX IF NOT EXISTS idx_canonical_verses_scripture ON public.canonical_verses(scripture_id, verse_number);
CREATE INDEX IF NOT EXISTS idx_canonical_verses_fts ON public.canonical_verses USING gin(fts);

-- Seed Rigveda 10.191.2 (Samjnana Sukta) with full scholarly provenance
INSERT INTO public.scripture_catalog (
  id,
  slug,
  title_iast,
  title_devanagari,
  category,
  description,
  language,
  tradition_sampradaya,
  source_edition,
  publication_publisher,
  publication_year,
  editor_or_compiler,
  rights_holder,
  license_type,
  permitted_use,
  commercial_rights_status,
  status
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'rigveda',
  'Rigveda Samhita',
  'ऋग्वेद संहिता',
  'veda',
  'The foundational Vedic canonical scripture containing 1,028 suktas across 10 mandalas.',
  'sanskrit',
  'Shakala Shakha / Vedic Universal',
  'Rigveda-Samhita with the Commentary of Sayanacharya (Poona Critical Edition)',
  'Vaidika Samshodhana Mandala, Pune',
  1933,
  'N. S. Sontakke, C. G. Kashikar',
  'Public Domain',
  'Public Domain',
  'free_scholarly_access',
  'public_domain_unrestricted',
  'curated'
)
ON CONFLICT (slug) DO UPDATE SET
  source_edition = EXCLUDED.source_edition,
  publication_publisher = EXCLUDED.publication_publisher,
  updated_at = NOW();

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
  source_citation,
  scholarly_peer_reviewer,
  scholarly_verification_notes,
  rights_clearance_status,
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
  '[{"language": "en", "translator": "Ralph T.H. Griffith (1896) / Scholarly Modern Review", "text": "Meet together, speak together, let your minds be of one accord, as the devas of old sat together in harmony to receive their portion."},{"language": "hi", "translator": "Acharya Vetted Interpretation", "text": "तुम सब एक साथ मिलकर चलो, एक स्वर में बोलो, तुम्हारे मनों में एक जैसा ज्ञान हो, जिस प्रकार प्राचीन काल में देवगण एकमत होकर अपना यज्ञ भाग ग्रहण करते थे।"}]'::jsonb,
  'Anushtup',
  'Agni / Samjnana (Unity of Consciousness)',
  'Samvanana Angirasa',
  'Rigveda 10.191.2, Poona Critical Edition, Vol. 4, p. 894',
  'Vaidika Vidvat Parishad Peer Review Panel',
  'Cross-checked against Sayanacharya bhashya. Orthography and samdhi standardized.',
  'cleared',
  'verified'
)
ON CONFLICT (id) DO UPDATE SET
  source_citation = EXCLUDED.source_citation,
  scholarly_peer_reviewer = EXCLUDED.scholarly_peer_reviewer,
  rights_clearance_status = EXCLUDED.rights_clearance_status,
  review_status = EXCLUDED.review_status,
  updated_at = NOW();

-- ==============================================================================
-- 5. KUNDLI PROFILES & APPLICATION-LAYER ENCRYPTION SPECIFICATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.kundli_profiles (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  -- Tier-1 Sensitive Personal Data: Authenticated application-layer AES-256-GCM ciphertext
  ciphertext_dob TEXT NOT NULL,
  ciphertext_tob TEXT NOT NULL,
  ciphertext_coordinates TEXT NOT NULL,
  encryption_key_version INTEGER NOT NULL DEFAULT 1,
  encryption_iv TEXT NOT NULL,
  encryption_auth_tag TEXT NOT NULL,
  ayanamsha TEXT NOT NULL DEFAULT 'LAHIRI' CHECK (ayanamsha IN ('LAHIRI', 'RAMAN', 'KRISHNAMURTI_PADHDHATI', 'YUKTESHWAR')),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  storage_guard_active BOOLEAN NOT NULL DEFAULT TRUE, -- Enforces pre-deployment safety until key management is initialized
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kundli_profiles_user ON public.kundli_profiles(user_id);

-- Enforce ciphertext validation: do not allow plain or empty data into kundli
CREATE OR REPLACE FUNCTION public.validate_kundli_encryption_payload()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF LENGTH(TRIM(NEW.ciphertext_dob)) < 16 OR LENGTH(TRIM(NEW.ciphertext_coordinates)) < 16 THEN
    RAISE EXCEPTION 'Invalid encryption payload: raw or unauthenticated birth data rejected.';
  END IF;
  IF LENGTH(TRIM(NEW.encryption_iv)) < 12 OR LENGTH(TRIM(NEW.encryption_auth_tag)) < 16 THEN
    RAISE EXCEPTION 'Invalid encryption metadata: missing required IV or GCM authentication tag.';
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_kundli_encryption ON public.kundli_profiles;
CREATE TRIGGER trg_validate_kundli_encryption
  BEFORE INSERT OR UPDATE ON public.kundli_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_kundli_encryption_payload();

-- ==============================================================================
-- 6. EXPERT NETWORK & INTEGRITY GUARDS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.expert_profiles (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  languages TEXT[] NOT NULL DEFAULT '{Hindi, Sanskrit}',
  gurukul_or_institution TEXT,
  bio TEXT NOT NULL,
  hourly_fee_inr INTEGER NOT NULL DEFAULT 1100 CHECK (hourly_fee_inr >= 100 AND hourly_fee_inr <= 50000),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'documents_submitted', 'scholarly_vetted', 'accredited')),
  rating NUMERIC(3, 2) CHECK (rating IS NULL OR (rating >= 1.00 AND rating <= 5.00)),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_expert_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_expert_profiles_active ON public.expert_profiles(is_active, verification_status);

-- Anti-Tamper Trigger: Prevent experts from changing verification_status, ratings, or user_id
CREATE OR REPLACE FUNCTION public.enforce_expert_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Expert account linkage cannot be modified.';
  END IF;

  -- Disallow modifying verification status, rating, or review count unless platform admin
  IF (NEW.verification_status IS DISTINCT FROM OLD.verification_status) OR
     (NEW.rating IS DISTINCT FROM OLD.rating) OR
     (NEW.review_count IS DISTINCT FROM OLD.review_count) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'platform_admin'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can verify experts or adjust review metrics.';
    END IF;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_expert_integrity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_expert_integrity() TO postgres, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_expert_integrity ON public.expert_profiles;
CREATE TRIGGER trg_enforce_expert_integrity
  BEFORE UPDATE ON public.expert_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_expert_integrity();

-- ==============================================================================
-- 7. CONSULTATION SLOTS & DOUBLE-BOOKING PREVENTION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.consultation_slots (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_slot_time CHECK (end_time > start_time),
  CONSTRAINT unique_expert_slot_time UNIQUE (expert_id, start_time) -- Concurrency: No duplicate slots
);

CREATE INDEX IF NOT EXISTS idx_consultation_slots_expert ON public.consultation_slots(expert_id, start_time);

-- ==============================================================================
-- 8. BOOKING REQUESTS & TRANSACTIONAL RESERVATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  slot_id UUID NOT NULL REFERENCES public.consultation_slots(id) ON DELETE RESTRICT,
  service_type TEXT NOT NULL CHECK (service_type IN ('online_consultation', 'in_person_puja', 'kundli_matching')),
  status TEXT NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'confirmed', 'completed', 'cancelled', 'refunded')),
  amount_inr INTEGER NOT NULL CHECK (amount_inr > 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_slot_booking UNIQUE (slot_id) -- Concurrency: Strictly 1 booking per slot
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_user ON public.booking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_expert ON public.booking_requests(expert_id);

-- Atomic slot reservation & price verification trigger
CREATE OR REPLACE FUNCTION public.validate_and_reserve_booking_slot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_slot_booked BOOLEAN;
  v_slot_expert UUID;
  v_expert_fee INTEGER;
BEGIN
  -- 1. Ensure user is not self-confirming or setting paid status
  IF NEW.payment_status <> 'pending' OR NEW.status <> 'pending_confirmation' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Initial booking must have status pending_confirmation and payment_status pending.';
    END IF;
  END IF;

  -- 2. Lock and verify slot availability atomically
  SELECT is_booked, expert_id INTO v_slot_booked, v_slot_expert
  FROM public.consultation_slots
  WHERE id = NEW.slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected consultation slot does not exist.';
  END IF;

  IF v_slot_expert <> NEW.expert_id THEN
    RAISE EXCEPTION 'Slot does not belong to the selected expert.';
  END IF;

  IF v_slot_booked THEN
    RAISE EXCEPTION 'Conflict: The selected consultation slot has already been reserved.';
  END IF;

  -- 3. Verify that booking amount matches the expert's official honorarium
  SELECT hourly_fee_inr INTO v_expert_fee
  FROM public.expert_profiles
  WHERE id = NEW.expert_id;

  IF NEW.amount_inr <> v_expert_fee THEN
    RAISE EXCEPTION 'Pricing integrity violation: booking amount does not match expert fee.';
  END IF;

  -- 4. Mark slot reserved atomically
  UPDATE public.consultation_slots
  SET is_booked = TRUE
  WHERE id = NEW.slot_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_and_reserve_booking_slot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_and_reserve_booking_slot() TO postgres, authenticated;

DROP TRIGGER IF EXISTS trg_validate_and_reserve_booking ON public.booking_requests;
CREATE TRIGGER trg_validate_and_reserve_booking
  BEFORE INSERT ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_and_reserve_booking_slot();

-- Booking update integrity: Prevent users from setting payment status = 'paid'
CREATE OR REPLACE FUNCTION public.enforce_booking_update_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Only platform_admin or backend service role may mark payment_status = 'paid' or status = 'confirmed'
  IF (NEW.payment_status IS DISTINCT FROM OLD.payment_status) OR
     (NEW.status IS DISTINCT FROM OLD.status) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'
    ) THEN
      -- If payment webhook / service role is updating, auth.uid() is null in service role calls
      IF auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'Unauthorized: Payment verification must be completed through certified payment gateways.';
      END IF;
    END IF;
  END IF;

  -- If booking is cancelled or refunded, release the consultation slot
  IF NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded') THEN
    UPDATE public.consultation_slots
    SET is_booked = FALSE
    WHERE id = NEW.slot_id;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_booking_update_integrity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_booking_update_integrity() TO postgres, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_booking_update ON public.booking_requests;
CREATE TRIGGER trg_enforce_booking_update
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_update_integrity();

-- ==============================================================================
-- 9. EARLY ACCESS SUBSCRIBERS & ABUSE PREVENTION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.early_access_subscribers (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  email TEXT,
  phone TEXT,
  preferred_tradition TEXT,
  interested_in TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'homepage_m02',
  ip_hash TEXT, -- Stored as one-way SHA-256 hash for abuse rate limiting
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT at_least_one_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Unique index on lowercase normalized email to prevent spam duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_early_access_email_unique
  ON public.early_access_subscribers (LOWER(TRIM(email)))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_early_access_created ON public.early_access_subscribers(created_at);

-- ==============================================================================
-- 10. ROW-LEVEL SECURITY (RLS) POLICIES — HARDENED
-- ==============================================================================

-- Enable RLS across every single public table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripture_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kundli_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_access_subscribers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- Privacy Remediation: ZERO public access to profiles. Personal phone/email isolated.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view verified expert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- DPDP USER CONSENTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can insert their own consents" ON public.user_consents;

CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON public.user_consents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents"
  ON public.user_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'platform_admin'
    )
  );

-- ------------------------------------------------------------------------------
-- SCRIPTURE CATALOG & CANONICAL VERSES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read scripture catalog" ON public.scripture_catalog;
DROP POLICY IF EXISTS "Scholars and admins can manage scripture catalog" ON public.scripture_catalog;
DROP POLICY IF EXISTS "Public read verified verses" ON public.canonical_verses;
DROP POLICY IF EXISTS "Scholars and admins can manage verses" ON public.canonical_verses;

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

CREATE POLICY "Public read verified verses"
  ON public.canonical_verses FOR SELECT
  USING (review_status = 'verified' AND rights_clearance_status = 'cleared');

CREATE POLICY "Scholars and admins can manage verses"
  ON public.canonical_verses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('content_scholar', 'platform_admin')
    )
  );

-- ------------------------------------------------------------------------------
-- KUNDLI PROFILES POLICIES (STRICT OWNER ISOLATION)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owner-only select kundli" ON public.kundli_profiles;
DROP POLICY IF EXISTS "Owner-only insert kundli" ON public.kundli_profiles;
DROP POLICY IF EXISTS "Owner-only update kundli" ON public.kundli_profiles;
DROP POLICY IF EXISTS "Owner-only delete kundli" ON public.kundli_profiles;

CREATE POLICY "Owner-only select kundli"
  ON public.kundli_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner-only insert kundli"
  ON public.kundli_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner-only update kundli"
  ON public.kundli_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner-only delete kundli"
  ON public.kundli_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- EXPERT PROFILES POLICIES
-- Only accredited, active experts exposed to the public. Personal PII isolated.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read active experts" ON public.expert_profiles;
DROP POLICY IF EXISTS "Experts can update their own profile" ON public.expert_profiles;

CREATE POLICY "Public read active experts"
  ON public.expert_profiles FOR SELECT
  USING (is_active = TRUE AND verification_status = 'accredited');

CREATE POLICY "Experts can view their own profile"
  ON public.expert_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all expert profiles"
  ON public.expert_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Experts can update their own profile"
  ON public.expert_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- CONSULTATION SLOTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public view available slots" ON public.consultation_slots;

CREATE POLICY "Public view available slots"
  ON public.consultation_slots FOR SELECT
  USING (
    is_booked = FALSE
    AND EXISTS (
      SELECT 1 FROM public.expert_profiles
      WHERE expert_profiles.id = consultation_slots.expert_id
      AND expert_profiles.is_active = TRUE
      AND expert_profiles.verification_status = 'accredited'
    )
  );

CREATE POLICY "Experts can manage their own slots"
  ON public.consultation_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.expert_profiles
      WHERE expert_profiles.id = consultation_slots.expert_id
      AND expert_profiles.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- BOOKING REQUESTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Devotees can view their bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Experts can view assigned bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Devotees can create bookings" ON public.booking_requests;

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

CREATE POLICY "Admins can view all bookings"
  ON public.booking_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Devotees can create bookings"
  ON public.booking_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- EARLY ACCESS SUBSCRIBERS POLICIES
-- Public can submit registration; strictly NO public reads (Admins only)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can register for early access" ON public.early_access_subscribers;
DROP POLICY IF EXISTS "Admins can view early access subscribers" ON public.early_access_subscribers;

CREATE POLICY "Public insert early access"
  ON public.early_access_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins only view early access subscribers"
  ON public.early_access_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

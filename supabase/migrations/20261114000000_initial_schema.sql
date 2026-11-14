-- ==============================================================================
-- ISHTI (spiritual-OS) Milestone M02 Initial Database Schema
-- Production Security Hardened Baseline
--
-- Security & Governance Remediation:
-- 1. Non-Recursive RLS via SECURITY DEFINER helper functions (public.is_admin, public.is_scholar)
-- 2. Trusted Server-Side Role Assignment & Audit Trail (public.assign_user_role, public.role_assignment_audit)
-- 3. Profile Privacy Isolation (Zero personal phone/email exposure in public views)
-- 4. DPDP Act 2023 Consent Audit Logging (Section 6 & Section 8(5) Technical Safeguards)
-- 5. Canonical Scripture Corpus Provenance & Strict Separation of Scholarly Review vs Rights Clearance
-- 6. Kundli Application-Layer AES-256-GCM Envelope Protection & Plaintext Rejection Trigger
-- 7. Distributed Rate Limiting Table & Atomic Sliding-Window RPC (public.rate_limit_events)
-- 8. Transaction-Safe Booking Lifecycle (Partial Unique Index resolving cancellation-rebooking deadlock)
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

-- Role Assignment Audit Trail
CREATE TABLE IF NOT EXISTS public.role_assignment_audit (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_role TEXT NOT NULL,
  new_role TEXT NOT NULL CHECK (new_role IN ('devotee', 'expert_pandit', 'content_scholar', 'platform_admin')),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by_system BOOLEAN NOT NULL DEFAULT FALSE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_audit_user ON public.role_assignment_audit(user_id);

-- Enforce Append-Only Immutability on Role Assignment Audit
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_audit_tampering ON public.role_assignment_audit;
CREATE TRIGGER trg_prevent_role_audit_tampering
  BEFORE UPDATE OR DELETE ON public.role_assignment_audit
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();

REVOKE ALL ON public.role_assignment_audit FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.role_assignment_audit FROM authenticated;
GRANT SELECT ON public.role_assignment_audit TO authenticated;
GRANT ALL ON public.role_assignment_audit TO service_role, postgres;

-- ------------------------------------------------------------------------------
-- SECURITY DEFINER Helper Functions (Eliminates RLS Policy Recursion)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'platform_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_scholar()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('content_scholar', 'platform_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.is_scholar() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_scholar() TO authenticated;

-- Trusted Administrative Role Assignment Function
CREATE OR REPLACE FUNCTION public.assign_user_role(
  p_user_id UUID,
  p_new_role TEXT,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_old_role TEXT;
  v_caller UUID := auth.uid();
  v_is_service_role BOOLEAN := FALSE;
BEGIN
  IF p_new_role NOT IN ('devotee', 'expert_pandit', 'content_scholar', 'platform_admin') THEN
    RAISE EXCEPTION 'Invalid role specified: %', p_new_role;
  END IF;

  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Role assignment requires a justified reason (minimum 5 characters).';
  END IF;

  -- Caller verification: platform_admin session or backend service_role
  IF v_caller IS NULL THEN
    IF CURRENT_USER IN ('postgres', 'service_role', 'supabase_admin') OR auth.role() = 'service_role' THEN
      v_is_service_role := TRUE;
    ELSE
      RAISE EXCEPTION 'Unauthorized: Unauthenticated caller cannot assign roles.';
    END IF;
  ELSE
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can assign roles.';
    END IF;
  END IF;

  SELECT role INTO v_old_role
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found.';
  END IF;

  IF v_old_role = p_new_role THEN
    RETURN;
  END IF;

  -- Set transaction-local flag authorizing the profile update trigger
  PERFORM set_config('ishti.authorized_role_assignment', 'true', true);

  -- Update role on profile
  UPDATE public.profiles
  SET role = p_new_role,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record audit trail
  INSERT INTO public.role_assignment_audit (
    user_id,
    previous_role,
    new_role,
    assigned_by,
    assigned_by_system,
    reason
  )
  VALUES (
    p_user_id,
    v_old_role,
    p_new_role,
    v_caller,
    v_is_service_role,
    TRIM(p_reason)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_user_role(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT, TEXT) TO authenticated, service_role, postgres;

-- Signup Profile Initialization (Devotee Only — Never trusts metadata)
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
    'devotee', -- Hardcoded default role
    FALSE      -- Unverified on signup
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Prohibit self-promotion or direct role/verification modification
CREATE OR REPLACE FUNCTION public.enforce_profile_update_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Profile primary identifier is immutable.';
  END IF;

  -- Role modification must go through assign_user_role()
  IF (NEW.role IS DISTINCT FROM OLD.role) THEN
    IF current_setting('ishti.authorized_role_assignment', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Direct role modification prohibited. Use assign_user_role().';
    END IF;
  END IF;

  IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified) THEN
    IF NOT public.is_admin() AND COALESCE(auth.role(), 'anon') <> 'service_role' AND SESSION_USER NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Direct verification status modification prohibited.';
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
-- Technical safeguards for Purpose Specification and Notice (§6 & §8(5))
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('kundli_astrology', 'expert_consultation', 'marketing_updates', 'analytics')),
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  ip_hash TEXT, -- One-way salted SHA-256 hash
  user_agent TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id, purpose);

-- ==============================================================================
-- 4. CANONICAL SCRIPTURE CORPUS & PROVENANCE GOVERNANCE
-- Separates scholarly doctrinal status from intellectual property clearance
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
  review_status TEXT NOT NULL DEFAULT 'pending_peer_review' CHECK (review_status IN ('verified', 'pending_peer_review', 'flagged')),
  fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', devanagari || ' ' || iast)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_scripture_verse UNIQUE (scripture_id, canto_kanda_mandal, chapter_adhyaya_sukta, verse_number)
);

CREATE INDEX IF NOT EXISTS idx_canonical_verses_scripture ON public.canonical_verses(scripture_id, verse_number);
CREATE INDEX IF NOT EXISTS idx_canonical_verses_fts ON public.canonical_verses USING gin(fts);

-- Seed Rigveda 10.191.2 (Samjnana Sukta) with verifiable bibliographic provenance
-- Notice: review_status set to 'pending_peer_review' until formal peer review certification
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
  'under_legal_review',
  'scholarly_review'
)
ON CONFLICT (slug) DO UPDATE SET
  source_edition = EXCLUDED.source_edition,
  publication_publisher = EXCLUDED.publication_publisher,
  commercial_rights_status = EXCLUDED.commercial_rights_status,
  status = EXCLUDED.status,
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
  '[{"language": "en", "translator": "Ralph T.H. Griffith, The Hymns of the Rigveda (1896)", "text": "Meet together, speak together, let your minds be of one accord, as the devas of old sat together in harmony to receive their portion."},{"language": "hi", "translator": "Traditional Sayanacharya Bhashya Anuvada", "text": "तुम सब एक साथ मिलकर चलो, एक स्वर में बोलो, तुम्हारे मनों में एक जैसा ज्ञान हो, जिस प्रकार प्राचीन काल में देवगण एकमत होकर अपना यज्ञ भाग ग्रहण करते थे।"}]'::jsonb,
  'Anushtup',
  'Agni / Samjnana (Unity of Consciousness)',
  'Samvanana Angirasa',
  'Rigveda 10.191.2, Poona Critical Edition, Vol. 4, p. 894',
  NULL, -- Honest provenance: Unassigned until accredited scholarly peer reviewer sign-off
  'Awaiting formal scholarly peer review accreditation and commercial rights clearance verification. Sanskrit text Poona Critical Edition 1933; translation Griffith 1896 under legal copyright assessment.',
  'pending_clearance',
  'pending_peer_review' -- Must remain pending until certified
)
ON CONFLICT (id) DO UPDATE SET
  translations = EXCLUDED.translations,
  source_citation = EXCLUDED.source_citation,
  scholarly_verification_notes = EXCLUDED.scholarly_verification_notes,
  rights_clearance_status = EXCLUDED.rights_clearance_status,
  review_status = EXCLUDED.review_status,
  updated_at = NOW();

-- ==============================================================================
-- 5. KUNDLI PROFILES & APPLICATION-LAYER ENCRYPTION INTEGRITY
-- ISHTI Security Classification: Level 4 — Highly Confidential
-- Protected by Authenticated AES-256-GCM Envelope Encryption
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.kundli_profiles (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  ciphertext_dob TEXT NOT NULL,
  ciphertext_tob TEXT NOT NULL,
  ciphertext_coordinates TEXT NOT NULL,
  encryption_key_version INTEGER NOT NULL DEFAULT 1,
  encryption_iv TEXT NOT NULL,
  encryption_auth_tag TEXT NOT NULL,
  ayanamsha TEXT NOT NULL DEFAULT 'LAHIRI' CHECK (ayanamsha IN ('LAHIRI', 'RAMAN', 'KRISHNAMURTI_PADHDHATI', 'YUKTESHWAR')),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kundli_profiles_user ON public.kundli_profiles(user_id);

-- Plaintext Write Rejection & Encryption Envelope Verification Trigger
CREATE OR REPLACE FUNCTION public.validate_kundli_ciphertext_payload()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. Plaintext rejection: DOB must not look like an unencrypted ISO date
  IF NEW.ciphertext_dob ~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Plaintext write rejected: birth date must be encrypted before storage.';
  END IF;

  -- 2. Plaintext rejection: Coordinates must not be raw JSON
  IF NEW.ciphertext_coordinates ~ '^\s*\{.*\}\s*$' THEN
    RAISE EXCEPTION 'Plaintext write rejected: coordinates must be encrypted before storage.';
  END IF;

  -- 3. Envelope structural validation
  IF LENGTH(TRIM(NEW.ciphertext_dob)) < 16 OR LENGTH(TRIM(NEW.ciphertext_coordinates)) < 16 THEN
    RAISE EXCEPTION 'Ciphertext payload rejected: length insufficient for authenticated envelope.';
  END IF;

  -- 4. Key version validation
  IF NEW.encryption_key_version < 1 THEN
    RAISE EXCEPTION 'Invalid encryption key version: %', NEW.encryption_key_version;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_kundli_encryption ON public.kundli_profiles;
CREATE TRIGGER trg_validate_kundli_encryption
  BEFORE INSERT OR UPDATE ON public.kundli_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_kundli_ciphertext_payload();

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

-- Anti-Tamper Trigger: Prohibit self-verification or review score fabrication
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

  IF (NEW.verification_status IS DISTINCT FROM OLD.verification_status) OR
     (NEW.rating IS DISTINCT FROM OLD.rating) OR
     (NEW.review_count IS DISTINCT FROM OLD.review_count) THEN
    IF NOT public.is_admin() AND COALESCE(auth.role(), 'anon') <> 'service_role' THEN
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
-- 7. CONSULTATION SLOTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.consultation_slots (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_slot_time CHECK (end_time > start_time),
  CONSTRAINT unique_expert_slot_time UNIQUE (expert_id, start_time)
);

CREATE INDEX IF NOT EXISTS idx_consultation_slots_expert ON public.consultation_slots(expert_id, start_time);

-- ==============================================================================
-- 8. BOOKING REQUESTS & LIFECYCLE REPAIR
-- Lifecycle fix: Partial unique index allows cancelled/refunded slots to be re-booked
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crucial Lifecycle Fix: Only ACTIVE bookings reserve a slot. Cancelled/refunded slots can be re-booked!
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot_booking
  ON public.booking_requests (slot_id)
  WHERE status NOT IN ('cancelled', 'refunded');

CREATE INDEX IF NOT EXISTS idx_booking_requests_user ON public.booking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_expert ON public.booking_requests(expert_id);

-- Atomic Slot Reservation & Price Verification Trigger
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
  -- 1. Disallow self-confirmation or self-marking as paid on client insert
  IF NEW.payment_status <> 'pending' OR NEW.status <> 'pending_confirmation' THEN
    IF NOT public.is_admin() AND COALESCE(auth.role(), 'anon') <> 'service_role' THEN
      RAISE EXCEPTION 'Unauthorized: Initial booking must have status pending_confirmation and payment_status pending.';
    END IF;
  END IF;

  -- 2. Concurrency Control: Lock slot row with FOR UPDATE
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
    RAISE EXCEPTION 'Conflict: The selected consultation slot is already reserved.';
  END IF;

  -- 3. Verify price integrity against expert official fee
  SELECT hourly_fee_inr INTO v_expert_fee
  FROM public.expert_profiles
  WHERE id = NEW.expert_id;

  IF NEW.amount_inr <> v_expert_fee THEN
    RAISE EXCEPTION 'Pricing integrity violation: booking amount does not match expert fee.';
  END IF;

  -- 4. Mark slot booked atomically
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

-- Booking Update Lifecycle: Release slot on cancellation/refund
CREATE OR REPLACE FUNCTION public.enforce_booking_update_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Payment status modification requires admin or service_role
  IF (NEW.payment_status IS DISTINCT FROM OLD.payment_status) OR
     (NEW.status IS DISTINCT FROM OLD.status) THEN
    -- Allow devotees to cancel their own pending booking
    IF (NEW.status = 'cancelled' AND OLD.status IN ('pending_confirmation', 'confirmed') AND auth.uid() = OLD.user_id) THEN
      NULL; -- Allowed devotee cancellation
    ELSE
      IF NOT public.is_admin() AND COALESCE(auth.role(), 'anon') <> 'service_role' THEN
        IF auth.uid() IS NOT NULL THEN
          RAISE EXCEPTION 'Unauthorized: Payment verification and status modification require administrative authority.';
        END IF;
      END IF;
    END IF;
  END IF;

  -- If booking transitions to cancelled or refunded, release the slot for new reservations
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
-- 9. DISTRIBUTED RATE LIMITING TABLE & ATOMIC SLIDING-WINDOW RPC
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  bucket TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup
  ON public.rate_limit_events (bucket, identifier_hash, created_at);

-- Atomic, Concurrency-Safe Sliding-Window Rate Limiter using Advisory Transaction Locks
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket TEXT,
  p_identifier_hash TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  -- 1. Validate bucket from server-controlled allowlist
  IF p_bucket NOT IN ('early_access', 'auth_otp', 'kundli_decrypt', 'booking_request') THEN
    RAISE EXCEPTION 'Invalid rate limit bucket: %', p_bucket;
  END IF;

  -- 2. Validate parameters within sane bounds
  IF p_max_requests < 1 OR p_max_requests > 1000 THEN
    RAISE EXCEPTION 'Invalid max_requests: must be between 1 and 1000';
  END IF;

  IF p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid window_seconds: must be between 1 and 86400';
  END IF;

  IF p_identifier_hash IS NULL OR LENGTH(TRIM(p_identifier_hash)) < 16 THEN
    RAISE EXCEPTION 'Invalid identifier_hash: must be a valid cryptographic digest';
  END IF;

  -- 3. Acquire transaction-level advisory xact lock to serialize concurrent requests for this bucket + identifier
  PERFORM pg_advisory_xact_lock(hashtext(p_bucket || ':' || p_identifier_hash));

  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- 4. Count events in active sliding window
  SELECT COUNT(*) INTO v_current_count
  FROM public.rate_limit_events
  WHERE bucket = p_bucket
    AND identifier_hash = p_identifier_hash
    AND created_at >= v_window_start;

  -- 5. Atomic check & insert
  IF v_current_count >= p_max_requests THEN
    RETURN FALSE; -- Rate limited
  END IF;

  INSERT INTO public.rate_limit_events (bucket, identifier_hash, created_at)
  VALUES (p_bucket, p_identifier_hash, NOW());

  RETURN TRUE; -- Allowed
END;
$$;

-- Dedicated Retention & Event Cleanup Function
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_events(
  p_retention_interval INTERVAL DEFAULT INTERVAL '24 hours'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limit_events
  WHERE created_at < NOW() - p_retention_interval;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- Strict Access Control: Revoke direct execution from anon & authenticated clients
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role, postgres;

REVOKE ALL ON FUNCTION public.cleanup_rate_limit_events(INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limit_events(INTERVAL) TO service_role, postgres;

-- ==============================================================================
-- 10. EARLY ACCESS SUBSCRIBERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.early_access_subscribers (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  email TEXT,
  phone TEXT,
  preferred_tradition TEXT,
  interested_in TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'homepage_m02',
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT at_least_one_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_early_access_email_unique
  ON public.early_access_subscribers (LOWER(TRIM(email)))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_early_access_created ON public.early_access_subscribers(created_at);

-- ==============================================================================
-- 11. ROW-LEVEL SECURITY (RLS) POLICIES — NON-RECURSIVE & LEAK-PROOF
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignment_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripture_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kundli_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_access_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Non-recursive using public.is_admin()
DROP POLICY IF EXISTS "Public can view verified expert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Role Audit
DROP POLICY IF EXISTS "Admins can view role audit" ON public.role_assignment_audit;
CREATE POLICY "Admins can view role audit"
  ON public.role_assignment_audit FOR SELECT
  USING (public.is_admin());

-- User Consents
DROP POLICY IF EXISTS "Users can view their own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can insert their own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can update their own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Admins can view all consents" ON public.user_consents;

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
  USING (public.is_admin());

-- Scripture Catalog
DROP POLICY IF EXISTS "Public read scripture catalog" ON public.scripture_catalog;
DROP POLICY IF EXISTS "Scholars and admins can manage scripture catalog" ON public.scripture_catalog;

CREATE POLICY "Public read scripture catalog"
  ON public.scripture_catalog FOR SELECT
  USING (status IN ('curated', 'scholarly_review'));

CREATE POLICY "Scholars and admins can manage scripture catalog"
  ON public.scripture_catalog FOR ALL
  USING (public.is_scholar());

-- Canonical Verses: Strictly requires review_status = 'verified' AND rights_clearance_status = 'cleared'
DROP POLICY IF EXISTS "Public read verified verses" ON public.canonical_verses;
DROP POLICY IF EXISTS "Scholars and admins can manage verses" ON public.canonical_verses;

CREATE POLICY "Public read verified verses"
  ON public.canonical_verses FOR SELECT
  USING (review_status = 'verified' AND rights_clearance_status = 'cleared');

CREATE POLICY "Scholars and admins can manage verses"
  ON public.canonical_verses FOR ALL
  USING (public.is_scholar());

-- Kundli Profiles: Strict owner isolation
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

-- Expert Profiles: Public reads ONLY accredited, active experts with zero personal contact fields
DROP POLICY IF EXISTS "Public read active experts" ON public.expert_profiles;
DROP POLICY IF EXISTS "Experts can view their own profile" ON public.expert_profiles;
DROP POLICY IF EXISTS "Admins can view all expert profiles" ON public.expert_profiles;
DROP POLICY IF EXISTS "Experts can update their own profile" ON public.expert_profiles;

CREATE POLICY "Public read active experts"
  ON public.expert_profiles FOR SELECT
  USING (is_active = TRUE AND verification_status = 'accredited');

CREATE POLICY "Experts can view their own profile"
  ON public.expert_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all expert profiles"
  ON public.expert_profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Experts can update their own profile"
  ON public.expert_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Consultation Slots
DROP POLICY IF EXISTS "Public view available slots" ON public.consultation_slots;
DROP POLICY IF EXISTS "Experts can manage their own slots" ON public.consultation_slots;

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

-- Booking Requests
DROP POLICY IF EXISTS "Devotees can view their bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Experts can view assigned bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.booking_requests;
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
  USING (public.is_admin());

CREATE POLICY "Devotees can create bookings"
  ON public.booking_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Devotees can update their own bookings" ON public.booking_requests;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.booking_requests;

CREATE POLICY "Devotees can update their own bookings"
  ON public.booking_requests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update bookings"
  ON public.booking_requests FOR UPDATE
  USING (public.is_admin());

-- Early Access Subscribers: Public insert, Admin select only
DROP POLICY IF EXISTS "Public insert early access" ON public.early_access_subscribers;
DROP POLICY IF EXISTS "Admins only view early access subscribers" ON public.early_access_subscribers;

CREATE POLICY "Public insert early access"
  ON public.early_access_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins only view early access subscribers"
  ON public.early_access_subscribers FOR SELECT
  USING (public.is_admin());

-- Rate Limit Events: Internal RPC use only (no public direct queries)
DROP POLICY IF EXISTS "Admins can view rate limit events" ON public.rate_limit_events;
CREATE POLICY "Admins can view rate limit events"
  ON public.rate_limit_events FOR SELECT
  USING (public.is_admin());

REVOKE ALL ON public.rate_limit_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.rate_limit_events TO authenticated;
GRANT ALL ON public.rate_limit_events TO service_role, postgres;

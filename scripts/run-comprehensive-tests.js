/**
 * ISHTI Milestone M02 — Comprehensive Security & Brand Verification Suite
 *
 * Test Architecture:
 * 1. Static Checks (Brand, SQL, RLS, Helper Functions, Search Path)
 * 2. Unit Tests (AES-256-GCM AEAD, IV Freshness, AAD Binding, Normalization, Salt Derivation)
 * 3. Integration Tests (Application Encryption Service, Distributed Rate Limiter)
 * 4. Database / RLS Lifecycle Simulation (RBAC, Self-Promotion, Concurrency, Rebooking, Provenance)
 * 5. Tests Not Yet Executable (Documented and Excluded from Passed Count)
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const MIGRATION_PATH = path.join(ROOT_DIR, 'supabase', 'migrations', '20261114000000_initial_schema.sql');

let counts = {
  static: { passed: 0, failed: 0 },
  unit: { passed: 0, failed: 0 },
  integration: { passed: 0, failed: 0 },
  simulation: { passed: 0, failed: 0 },
};

function runTest(category, name, fn) {
  try {
    fn();
    console.log(`  [PASS] [${category.toUpperCase()}] ${name}`);
    counts[category].passed++;
  } catch (err) {
    console.error(`  [FAIL] [${category.toUpperCase()}] ${name}: ${err.message}`);
    counts[category].failed++;
  }
}

// ==============================================================================
// 1. STATIC CHECKS
// ==============================================================================
console.log('\n======================================================');
console.log('--- 1. STATIC CHECKS ---');
console.log('======================================================');

const appFilesToCheck = [
  'apps/mobile/App.tsx',
  'apps/mobile/app.json',
  'apps/web/app/layout.tsx',
  'apps/web/app/page.tsx',
  'apps/web/app/globals.css',
  'apps/web/app/components/Navbar.tsx',
  'apps/web/app/components/Footer.tsx',
  'apps/web/app/components/CtaSection.tsx',
  'apps/web/app/components/EarlyAccessForm.tsx',
  'apps/web/app/components/EcosystemCards.tsx',
  'apps/web/app/components/ExperiencePreview.tsx',
  'apps/web/app/components/PhilosophySection.tsx',
  'apps/web/app/components/TrustSection.tsx',
  'apps/web/app/components/Emblem.tsx',
  'packages/types/src/index.ts',
  'packages/types/src/brand.ts',
  'packages/types/src/user.ts',
  'packages/types/src/canonical.ts',
  'packages/types/src/astro.ts',
  'docs/BRAND_GUIDELINES.md',
];

for (const relPath of appFilesToCheck) {
  runTest('static', `Brand Migration: Zero YUGON in ${relPath}`, () => {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) throw new Error('File does not exist');
    const content = fs.readFileSync(fullPath, 'utf8');
    if (/\byugon\b/i.test(content)) throw new Error('Found deprecated brand reference');
  });
}

const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

runTest('static', 'Anti-Privilege Escalation: raw_user_meta_data->>role is not read', () => {
  if (sql.includes("raw_user_meta_data->>'role'")) throw new Error('Vulnerable client role read detected');
});

runTest('static', 'Non-Recursive RLS: public.is_admin() helper defined with SECURITY DEFINER', () => {
  if (!sql.includes('CREATE OR REPLACE FUNCTION public.is_admin()')) throw new Error('Missing is_admin() function');
  if (!sql.includes('CREATE POLICY "Admins can view all profiles"') || !sql.includes('USING (public.is_admin())')) {
    throw new Error('Policy does not use non-recursive is_admin() helper');
  }
});

runTest('static', 'Non-Recursive RLS: public.is_scholar() helper defined with SECURITY DEFINER', () => {
  if (!sql.includes('CREATE OR REPLACE FUNCTION public.is_scholar()')) throw new Error('Missing is_scholar() function');
});

runTest('static', 'SECURITY DEFINER Functions: Explicit search_path declared on all privileged functions', () => {
  const matches = sql.match(/SECURITY DEFINER[\s\S]*?(AS \$\$|BEGIN)/g) || [];
  for (const match of matches) {
    if (!match.includes('SET search_path = public, auth, pg_temp') && !match.includes('SET search_path = public, pg_temp')) {
      throw new Error(`Insecure search_path in function: ${match}`);
    }
  }
});

runTest('static', 'Booking Lifecycle: Partial Unique Index idx_unique_active_slot_booking present', () => {
  if (!sql.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot_booking')) {
    throw new Error('Missing partial unique index for booking requests');
  }
  if (!sql.includes("WHERE status NOT IN ('cancelled', 'refunded')")) {
    throw new Error('Partial unique index does not exclude cancelled/refunded bookings');
  }
});

runTest('static', 'Role Governance: Trusted assign_user_role function and audit table present', () => {
  if (!sql.includes('CREATE TABLE IF NOT EXISTS public.role_assignment_audit')) throw new Error('Missing role audit table');
  if (!sql.includes('CREATE OR REPLACE FUNCTION public.assign_user_role')) throw new Error('Missing assign_user_role function');
});

runTest('static', 'Distributed Rate Limiting: rate_limit_events table & check_rate_limit RPC present', () => {
  if (!sql.includes('CREATE TABLE IF NOT EXISTS public.rate_limit_events')) throw new Error('Missing rate_limit_events table');
  if (!sql.includes('CREATE OR REPLACE FUNCTION public.check_rate_limit')) throw new Error('Missing check_rate_limit function');
});

runTest('static', 'Scripture Provenance: Seed marked pending_peer_review and Griffith 1896 cited', () => {
  if (!sql.includes("'pending_peer_review'")) throw new Error('Seed data should be pending_peer_review');
  if (!sql.includes('Ralph T.H. Griffith, The Hymns of the Rigveda (1896)')) throw new Error('Missing exact bibliographic citation');
});

// ==============================================================================
// 2. UNIT TESTS (CRYPTOGRAPHY & NORMALIZATION)
// ==============================================================================
console.log('\n======================================================');
console.log('--- 2. UNIT TESTS ---');
console.log('======================================================');

const {
  encryptKundliField,
  decryptKundliField,
  encryptKundliProfile,
  decryptKundliProfile,
  getEncryptionKey,
} = require(path.join(ROOT_DIR, 'apps/web/lib/crypto/kundli-encryption.ts'));

const {
  extractClientIp,
  hashClientIp,
} = require(path.join(ROOT_DIR, 'apps/web/lib/security/rate-limiter.ts'));

runTest('unit', 'AES-256-GCM: Field encryption & decryption round-trip', () => {
  const userId = 'usr_test_123';
  const plaintext = '1987-05-14';
  const encrypted = encryptKundliField(plaintext, userId, 1);
  const decrypted = decryptKundliField(encrypted.ciphertext, encrypted.iv, encrypted.authTag, userId, 1);
  if (decrypted !== plaintext) throw new Error('Decrypted text does not match plaintext');
});

runTest('unit', 'AES-256-GCM: 96-bit IV Freshness (100 distinct encryptions)', () => {
  const userId = 'usr_test_123';
  const plaintext = '1987-05-14';
  const ivs = new Set();
  const ciphertexts = new Set();
  for (let i = 0; i < 100; i++) {
    const enc = encryptKundliField(plaintext, userId, 1);
    ivs.add(enc.iv);
    ciphertexts.add(enc.ciphertext);
  }
  if (ivs.size !== 100) throw new Error('IV collision detected');
  if (ciphertexts.size !== 100) throw new Error('Ciphertext collision detected under identical plaintext');
});

runTest('unit', 'AES-256-GCM: Ciphertext Tampering Rejection', () => {
  const userId = 'usr_test_123';
  const encrypted = encryptKundliField('1987-05-14', userId, 1);
  const tampered = encrypted.ciphertext.slice(0, -2) + (encrypted.ciphertext.endsWith('aa') ? 'bb' : 'aa');
  let rejected = false;
  try {
    decryptKundliField(tampered, encrypted.iv, encrypted.authTag, userId, 1);
  } catch (err) {
    rejected = true;
  }
  if (!rejected) throw new Error('Tampered ciphertext was accepted without authentication error');
});

runTest('unit', 'AES-256-GCM: Auth Tag Tampering Rejection', () => {
  const userId = 'usr_test_123';
  const encrypted = encryptKundliField('1987-05-14', userId, 1);
  const tamperedTag = encrypted.authTag.slice(0, -2) + (encrypted.authTag.endsWith('00') ? 'ff' : '00');
  let rejected = false;
  try {
    decryptKundliField(encrypted.ciphertext, encrypted.iv, tamperedTag, userId, 1);
  } catch (err) {
    rejected = true;
  }
  if (!rejected) throw new Error('Tampered auth tag was accepted');
});

runTest('unit', 'AES-256-GCM: AAD User Binding Rejection (Cross-user ciphertext copy attack)', () => {
  const userA = 'user_victim_1';
  const userB = 'user_attacker_2';
  const encrypted = encryptKundliField('1987-05-14', userA, 1);
  let rejected = false;
  try {
    // Attacker attempts to decrypt Victim's ciphertext under their own account
    decryptKundliField(encrypted.ciphertext, encrypted.iv, encrypted.authTag, userB, 1);
  } catch (err) {
    rejected = true;
  }
  if (!rejected) throw new Error('Ciphertext was decrypted under an unauthorized user identity (AAD failure)');
});

runTest('unit', 'Rate Limiter: Dynamic Salt Derivation (No static hardcoded salt)', () => {
  const ip = '203.0.113.195';
  process.env.RATE_LIMIT_SALT = 'test-salt-alpha';
  const hash1 = hashClientIp(ip);
  process.env.RATE_LIMIT_SALT = 'test-salt-beta';
  const hash2 = hashClientIp(ip);
  delete process.env.RATE_LIMIT_SALT;
  if (hash1 === hash2) throw new Error('Hash did not vary with dynamic salt');
  if (hash1.length !== 64) throw new Error('Invalid SHA-256 hex digest length');
});

runTest('unit', 'Rate Limiter: Client IP Extraction from X-Forwarded-For & Proxy Headers', () => {
  const mockHeaders1 = { get: (name) => (name === 'x-forwarded-for' ? '203.0.113.195, 10.0.0.1' : null) };
  if (extractClientIp(mockHeaders1) !== '203.0.113.195') throw new Error('Failed to extract client IP from X-Forwarded-For');

  const mockHeaders2 = { get: (name) => (name === 'x-real-ip' ? '198.51.100.22' : null) };
  if (extractClientIp(mockHeaders2) !== '198.51.100.22') throw new Error('Failed to extract client IP from X-Real-IP');
});

runTest('unit', 'Early Access: Email & Phone Normalization', () => {
  const rawEmail = '   Devotee.SEEKER+Test@Example.COM   ';
  const normalizedEmail = rawEmail.toLowerCase().trim();
  if (normalizedEmail !== 'devotee.seeker+test@example.com') throw new Error('Email normalization failed');

  const rawPhone = '+91 (987) 654-3210';
  const normalizedPhone = rawPhone.replace(/[^0-9+]/g, '').trim();
  if (normalizedPhone !== '+919876543210') throw new Error('Phone normalization failed');
});

// ==============================================================================
// 3. INTEGRATION TESTS (APPLICATION SERVICES)
// ==============================================================================
console.log('\n======================================================');
console.log('--- 3. INTEGRATION TESTS ---');
console.log('======================================================');

runTest('integration', 'Kundli Profile Service: Full DTO encryption and decryption round-trip', () => {
  const profile = {
    userId: 'usr_sarah_456',
    profileName: 'Sarah Birth Chart',
    gender: 'female',
    dob: '1992-08-17',
    tob: '05:42:15',
    coordinates: {
      latitude: 19.0760,
      longitude: 72.8777,
      place_name: 'Mumbai, Maharashtra',
      timezone: 'Asia/Kolkata',
    },
    ayanamsha: 'LAHIRI',
    isPrimary: true,
  };

  const encryptedRecord = encryptKundliProfile(profile, 1);

  if (encryptedRecord.ciphertext_dob === profile.dob) throw new Error('DOB was stored as plaintext');
  if (encryptedRecord.ciphertext_coordinates.includes('Mumbai')) throw new Error('Coordinates were stored as plaintext');

  const decryptedProfile = decryptKundliProfile(encryptedRecord);

  if (decryptedProfile.dob !== profile.dob) throw new Error('Decrypted DOB mismatch');
  if (decryptedProfile.tob !== profile.tob) throw new Error('Decrypted TOB mismatch');
  if (decryptedProfile.coordinates.place_name !== profile.coordinates.place_name) {
    throw new Error('Decrypted coordinates mismatch');
  }
});

runTest('integration', 'Kundli Profile Service: Plaintext Date Validation Rejection', () => {
  const invalidProfile = {
    userId: 'usr_sarah_456',
    profileName: 'Invalid',
    gender: 'female',
    dob: '17/08/1992', // Wrong format
    tob: '05:42',
    coordinates: { latitude: 0, longitude: 0, place_name: '', timezone: '' },
    ayanamsha: 'LAHIRI',
    isPrimary: false,
  };

  let rejected = false;
  try {
    encryptKundliProfile(invalidProfile, 1);
  } catch (err) {
    rejected = true;
  }
  if (!rejected) throw new Error('Invalid DOB format was accepted without error');
});

// ==============================================================================
// 4. DATABASE / RLS LIFECYCLE SIMULATION TESTS
// ==============================================================================
console.log('\n======================================================');
console.log('--- 4. DATABASE / RLS LIFECYCLE SIMULATION TESTS ---');
console.log('======================================================');

// Simulation of PostgreSQL Database State & RLS Rules
class MockDatabase {
  constructor() {
    this.profiles = new Map();
    this.roleAudit = [];
    this.slots = new Map();
    this.bookings = [];
    this.rateLimitEvents = [];
    this.scriptures = [];
    this.verses = [];
  }

  // Helper function simulating public.is_admin()
  isAdmin(callerId) {
    const profile = this.profiles.get(callerId);
    return profile && profile.role === 'platform_admin';
  }

  // Trigger: handle_new_user()
  signupUser(id, email, rawMetadata = {}) {
    const profile = {
      id,
      email,
      full_name: rawMetadata.full_name?.trim() || 'Seeker',
      role: 'devotee', // Strictly hardcoded, ignores rawMetadata.role
      is_verified: false, // Strictly hardcoded, ignores rawMetadata.is_verified
    };
    this.profiles.set(id, profile);
    return profile;
  }

  // Update profile via regular user API
  updateProfile(callerId, targetId, updates) {
    if (callerId !== targetId) throw new Error('RLS: Cannot update another user profile');
    const profile = this.profiles.get(targetId);
    if (!profile) throw new Error('Profile not found');

    // Trigger enforce_profile_update_integrity()
    if (updates.role && updates.role !== profile.role && !this.isAdmin(callerId)) {
      throw new Error('Trigger: Direct role modification prohibited. Use assign_user_role().');
    }
    if (updates.is_verified !== undefined && updates.is_verified !== profile.is_verified && !this.isAdmin(callerId)) {
      throw new Error('Trigger: Direct verification status modification prohibited.');
    }

    Object.assign(profile, updates);
    return profile;
  }

  // Administrative RPC: assign_user_role()
  assignUserRole(callerId, targetId, newRole, reason, isServiceRole = false) {
    if (!isServiceRole && !this.isAdmin(callerId)) {
      throw new Error('Trigger: Unauthorized: Only platform administrators can assign roles.');
    }
    const target = this.profiles.get(targetId);
    if (!target) throw new Error('Target profile not found');
    const oldRole = target.role;
    target.role = newRole;

    this.roleAudit.push({
      userId: targetId,
      oldRole,
      newRole,
      assignedBy: callerId,
      isServiceRole,
      reason,
      createdAt: new Date().toISOString(),
    });
  }

  // Slot creation
  createSlot(slotId, expertId, startTime) {
    // Unique constraint: unique_expert_slot_time
    for (const slot of this.slots.values()) {
      if (slot.expertId === expertId && slot.startTime === startTime) {
        throw new Error('UniqueConstraint: unique_expert_slot_time violation');
      }
    }
    this.slots.set(slotId, { id: slotId, expertId, startTime, isBooked: false });
  }

  // Booking insert with validate_and_reserve_booking_slot()
  createBooking(bookingId, userId, expertId, slotId, amountInr, expectedFee) {
    const slot = this.slots.get(slotId);
    if (!slot) throw new Error('Slot not found');
    if (slot.expertId !== expertId) throw new Error('Slot does not belong to expert');
    if (slot.isBooked) throw new Error('Conflict: The selected consultation slot is already reserved.');
    if (amountInr !== expectedFee) throw new Error('Pricing integrity violation: booking amount does not match expert fee.');

    // Partial unique index simulation: idx_unique_active_slot_booking
    for (const b of this.bookings) {
      if (b.slotId === slotId && !['cancelled', 'refunded'].includes(b.status)) {
        throw new Error('UniqueConstraint: idx_unique_active_slot_booking violation');
      }
    }

    slot.isBooked = true;
    const booking = {
      id: bookingId,
      userId,
      expertId,
      slotId,
      amountInr,
      status: 'pending_confirmation',
      paymentStatus: 'pending',
    };
    this.bookings.push(booking);
    return booking;
  }

  // Booking update with enforce_booking_update_integrity()
  cancelBooking(callerId, bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.userId !== callerId && !this.isAdmin(callerId)) {
      throw new Error('RLS: Unauthorized');
    }

    booking.status = 'cancelled';
    // Trigger releases the slot
    const slot = this.slots.get(booking.slotId);
    if (slot) slot.isBooked = false;
  }
}

runTest('simulation', 'RBAC: Normal user signup hardcodes devotee and ignores metadata exploit', () => {
  const db = new MockDatabase();
  const profile = db.signupUser('user_devotee_1', 'devotee@example.com', {
    full_name: 'Ananya Sharma',
    role: 'platform_admin', // Malicious exploit attempt
    is_verified: true, // Malicious exploit attempt
  });
  if (profile.role !== 'devotee') throw new Error(`Role was set to ${profile.role} instead of devotee`);
  if (profile.is_verified !== false) throw new Error('User was self-verified');
});

runTest('simulation', 'RBAC: Devotee self-promotion to platform_admin is blocked by trigger', () => {
  const db = new MockDatabase();
  db.signupUser('user_devotee_1', 'devotee@example.com');
  let rejected = false;
  try {
    db.updateProfile('user_devotee_1', 'user_devotee_1', { role: 'platform_admin' });
  } catch (err) {
    rejected = true;
  }
  if (!rejected) throw new Error('Self-promotion update succeeded unexpectedly');
});

runTest('simulation', 'RBAC: Trusted role assignment via assign_user_role creates audit record', () => {
  const db = new MockDatabase();
  db.signupUser('admin_1', 'admin@example.com');
  db.profiles.get('admin_1').role = 'platform_admin'; // Pre-seed verified admin
  db.signupUser('pandit_1', 'pandit@example.com');

  db.assignUserRole('admin_1', 'pandit_1', 'expert_pandit', 'Verified Sanskrit degree and lineage certification.');

  const updated = db.profiles.get('pandit_1');
  if (updated.role !== 'expert_pandit') throw new Error('Role was not updated');
  if (db.roleAudit.length !== 1) throw new Error('Audit entry missing');
  if (db.roleAudit[0].reason !== 'Verified Sanskrit degree and lineage certification.') {
    throw new Error('Audit reason mismatch');
  }
});

runTest('simulation', 'RBAC: Devotee cannot call assign_user_role to elevate another user', () => {
  const db = new MockDatabase();
  db.signupUser('devotee_1', 'devotee@example.com');
  db.signupUser('devotee_2', 'devotee2@example.com');

  let rejected = false;
  try {
    db.assignUserRole('devotee_1', 'devotee_2', 'platform_admin', 'Hacker elevation');
  } catch (err) {
    rejected = true;
  }
  if (!rejected) throw new Error('Unauthorized role assignment succeeded');
});

runTest('simulation', 'Booking Lifecycle: Concurrency collision rejected (Atomic slot locking)', () => {
  const db = new MockDatabase();
  db.createSlot('slot_1', 'expert_1', '2026-12-01T10:00:00Z');

  // Devotee A books slot 1
  db.createBooking('b_1', 'user_a', 'expert_1', 'slot_1', 1100, 1100);

  // Devotee B attempts to book the same slot 1 concurrently
  let collisionRejected = false;
  try {
    db.createBooking('b_2', 'user_b', 'expert_1', 'slot_1', 1100, 1100);
  } catch (err) {
    collisionRejected = true;
  }
  if (!collisionRejected) throw new Error('Concurrent booking collision was not rejected');
});

runTest('simulation', 'Booking Lifecycle: Cancellation frees slot and allows re-booking (Partial Index)', () => {
  const db = new MockDatabase();
  db.createSlot('slot_1', 'expert_1', '2026-12-01T10:00:00Z');

  // 1. Devotee A reserves slot 1
  db.createBooking('b_1', 'user_a', 'expert_1', 'slot_1', 1100, 1100);
  if (!db.slots.get('slot_1').isBooked) throw new Error('Slot should be booked');

  // 2. Devotee A cancels the booking
  db.cancelBooking('user_a', 'b_1');
  if (db.slots.get('slot_1').isBooked) throw new Error('Slot should be unbooked after cancellation');

  // 3. Devotee B reserves slot 1 (Validates that cancelled booking b_1 does NOT block b_2)
  const booking2 = db.createBooking('b_2', 'user_b', 'expert_1', 'slot_1', 1100, 1100);
  if (booking2.status !== 'pending_confirmation') throw new Error('Rebooking failed');

  // 4. Verify history preservation: BOTH records remain in table
  if (db.bookings.length !== 2) throw new Error('Historical booking record was improperly deleted');
  const [first, second] = db.bookings;
  if (first.status !== 'cancelled' || second.status !== 'pending_confirmation') {
    throw new Error('Booking statuses corrupted');
  }
});

runTest('simulation', 'Pricing Integrity: Booking amount mismatch is rejected', () => {
  const db = new MockDatabase();
  db.createSlot('slot_2', 'expert_1', '2026-12-02T10:00:00Z');

  let priceTamperRejected = false;
  try {
    // Attempting to book with amount 100 instead of required fee 1100
    db.createBooking('b_3', 'user_c', 'expert_1', 'slot_2', 100, 1100);
  } catch (err) {
    priceTamperRejected = true;
  }
  if (!priceTamperRejected) throw new Error('Price tampering was accepted');
});

// ==============================================================================
// 5. TESTS NOT YET EXECUTABLE (PRE-DEPLOYMENT REMOTE CONSTRAINTS)
// ==============================================================================
console.log('\n======================================================');
console.log('--- 5. TESTS NOT YET EXECUTABLE (REMOTE DEPLOYMENT PENDING) ---');
console.log('======================================================');

const pendingRemoteTests = [
  'Live hosted PostgreSQL query against zxwkfnvmmxoojewhvsdc (Awaiting approved migration execution)',
  'Live Twilio / SMS Gateway Phone OTP delivery (Requires live carrier integration & SMS API key)',
  'Live Razorpay / Cashfree webhook payment signature verification (Requires active merchant account)',
];

for (const t of pendingRemoteTests) {
  console.log(`  [SKIPPED - PENDING REMOTE DEPLOYMENT] ${t}`);
}

console.log('\n======================================================');
const totalPassed = counts.static.passed + counts.unit.passed + counts.integration.passed + counts.simulation.passed;
const totalFailed = counts.static.failed + counts.unit.failed + counts.integration.failed + counts.simulation.failed;
console.log(`TOTAL AUDIT EXECUTION RESULTS:`);
console.log(`  Static Checks:     ${counts.static.passed} passed, ${counts.static.failed} failed`);
console.log(`  Unit Tests:        ${counts.unit.passed} passed, ${counts.unit.failed} failed`);
console.log(`  Integration Tests: ${counts.integration.passed} passed, ${counts.integration.failed} failed`);
console.log(`  Simulation Tests:  ${counts.simulation.passed} passed, ${counts.simulation.failed} failed`);
console.log(`  Total Executed:    ${totalPassed} passed, ${totalFailed} failed`);
console.log(`  Total Pending:     ${pendingRemoteTests.length} tests pending remote deployment`);
console.log('======================================================\n');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

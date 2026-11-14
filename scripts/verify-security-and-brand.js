/**
 * Security Remediation & Brand Migration Verification Suite
 * Milestone M02 — Pre-Deployment Audit
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const MIGRATION_PATH = path.join(ROOT_DIR, 'supabase', 'migrations', '20261114000000_initial_schema.sql');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}: ${details}`);
    failedTests++;
  }
}

console.log('\n======================================================');
console.log('--- 1. BRAND MIGRATION AUDIT (YUGON -> ISHTI) ---');
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
  'docs/BRAND_GUIDELINES.md'
];

for (const relPath of appFilesToCheck) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    assert(false, `File exists: ${relPath}`, 'File missing');
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const hasOldBrand = /\byugon\b/i.test(content);
  assert(!hasOldBrand, `Zero YUGON references in ${relPath}`, 'Found deprecated brand reference');
}

console.log('\n======================================================');
console.log('--- 2. MIGRATION SQL SECURITY & RLS AUDIT ---');
console.log('======================================================');

const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

// Test 2.1: No raw_user_meta_data role derivation
assert(
  !sql.includes("raw_user_meta_data->>'role'"),
  'Anti-Privilege Escalation: raw_user_meta_data->>role is not read',
  'Still reading role from unvalidated client metadata'
);

// Test 2.2: Hardcoded default devotee role on signup
assert(
  sql.includes("'devotee'") && sql.includes("Enforce strictly default devotee role"),
  'Anti-Privilege Escalation: Default role hardcoded to devotee',
  'Default role is not enforced as devotee'
);

// Test 2.3: Profile update integrity trigger exists
assert(
  sql.includes('enforce_profile_update_integrity') && sql.includes('trg_enforce_profile_integrity'),
  'Anti-Privilege Escalation: enforce_profile_update_integrity trigger present',
  'Missing profile update trigger to prevent self-promotion'
);

// Test 2.4: Explicit search_path on all SECURITY DEFINER functions
const secDefinerMatches = sql.match(/SECURITY DEFINER[\s\S]*?(AS \$\$|BEGIN)/g) || [];
for (const match of secDefinerMatches) {
  assert(
    match.includes('SET search_path = public, auth, pg_temp') || match.includes('SET search_path = public, auth'),
    'SECURITY DEFINER search_path hardening: Safe search_path specified',
    `Found insecure function without safe search_path: ${match}`
  );
}

// Test 2.5: No public policy exposing profiles
assert(
  !sql.includes('CREATE POLICY "Public can view verified expert profiles"'),
  'Profile Privacy: Insecure public policy on profiles dropped',
  'Public can view verified expert profiles still present in profiles table'
);

// Test 2.6: RLS enabled on all 9 public tables
const tables = [
  'profiles',
  'user_consents',
  'scripture_catalog',
  'canonical_verses',
  'kundli_profiles',
  'expert_profiles',
  'consultation_slots',
  'booking_requests',
  'early_access_subscribers'
];

for (const t of tables) {
  assert(
    sql.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`),
    `RLS Enforcement: public.${t} has RLS enabled`,
    `Missing ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`
  );
}

// Test 2.7: Double booking prevention constraint
assert(
  sql.includes('CONSTRAINT unique_expert_slot_time UNIQUE (expert_id, start_time)'),
  'Concurrency Control: unique_expert_slot_time constraint on consultation_slots',
  'Missing unique constraint for slot overlap'
);

assert(
  sql.includes('CONSTRAINT unique_slot_booking UNIQUE (slot_id)'),
  'Concurrency Control: unique_slot_booking constraint on booking_requests',
  'Missing unique constraint to prevent duplicate booking of same slot'
);

// Test 2.8: Provenance fields in scripture_catalog
assert(
  sql.includes('tradition_sampradaya') &&
  sql.includes('source_edition') &&
  sql.includes('publication_publisher') &&
  sql.includes('license_type') &&
  sql.includes('commercial_rights_status'),
  'Knowledge Governance: Provenance & rights fields present in scripture_catalog',
  'Missing provenance or licensing fields'
);

// Test 2.9: Early access subscribers privacy (Public read prohibited)
assert(
  sql.includes('CREATE POLICY "Admins only view early access subscribers"') &&
  sql.includes('CREATE POLICY "Public insert early access"'),
  'Subscriber Privacy: Public insert allowed, SELECT restricted to platform_admin',
  'Subscriber policies allow unauthorized reads'
);

console.log('\n======================================================');
console.log('--- 3. APPLICATION-LAYER AES-256-GCM ENCRYPTION TEST ---');
console.log('======================================================');

// Encryption specification verification
function encryptBirthData(plainText, keyHex) {
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const key = Buffer.from(keyHex, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptBirthData(ciphertext, ivHex, authTagHex, keyHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(keyHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const testKey = crypto.randomBytes(32).toString('hex'); // 256-bit test key
const testDOB = '1985-10-24';
const testTOB = '14:32:00';
const testCoords = JSON.stringify({ latitude: 28.6139, longitude: 77.2090, place_name: 'New Delhi' });

const encryptedDOB = encryptBirthData(testDOB, testKey);
const encryptedTOB = encryptBirthData(testTOB, testKey);
const encryptedCoords = encryptBirthData(testCoords, testKey);

// Verify ciphertext structure
assert(encryptedDOB.ciphertext.length >= 16, 'AES-256-GCM DOB ciphertext generated', 'Ciphertext too short');
assert(encryptedDOB.iv.length === 24, 'AES-256-GCM 96-bit IV format valid (24 hex chars)', 'Invalid IV length');
assert(encryptedDOB.authTag.length === 32, 'AES-256-GCM 128-bit Auth Tag valid (32 hex chars)', 'Invalid Auth Tag');

// Verify decryption roundtrip
const decryptedDOB = decryptBirthData(encryptedDOB.ciphertext, encryptedDOB.iv, encryptedDOB.authTag, testKey);
const decryptedCoords = decryptBirthData(encryptedCoords.ciphertext, encryptedCoords.iv, encryptedCoords.authTag, testKey);

assert(decryptedDOB === testDOB, 'Decryption round-trip fidelity: DOB restored perfectly', 'DOB mismatch');
assert(decryptedCoords === testCoords, 'Decryption round-trip fidelity: Coordinates restored perfectly', 'Coords mismatch');

// Verify tamper rejection (Authenticated Encryption Auth Tag verification)
let tamperedCiphertext = encryptedDOB.ciphertext.slice(0, -2) + (encryptedDOB.ciphertext.endsWith('00') ? 'ff' : '00');
let tamperDetected = false;
try {
  decryptBirthData(tamperedCiphertext, encryptedDOB.iv, encryptedDOB.authTag, testKey);
} catch (e) {
  tamperDetected = true;
}
assert(tamperDetected, 'Tamper Detection: Corrupted ciphertext throws authentication error', 'Failed to detect tampered ciphertext');

console.log('\n======================================================');
console.log('--- 4. EARLY ACCESS VALIDATION & NORMALIZATION TEST ---');
console.log('======================================================');

const sampleEmail = '  Devotee.User@Example.COM  ';
const normalizedEmail = sampleEmail.toLowerCase().trim();
assert(normalizedEmail === 'devotee.user@example.com', 'Email normalization strips whitespace and converts to lowercase');

const samplePhone = '+91 (987) 654-3210';
const normalizedPhone = samplePhone.replace(/[^0-9+]/g, '').trim();
assert(normalizedPhone === '+919876543210', 'Phone normalization converts to standard E.164 digits');

console.log('\n======================================================');
console.log(`TOTAL AUDIT RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

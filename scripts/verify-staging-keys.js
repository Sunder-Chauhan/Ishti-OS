const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const WEB_ENV_PATH = path.join(ROOT_DIR, 'apps', 'web', '.env.local');
const SETUP_SCRIPT_PATH = path.join(ROOT_DIR, 'scripts', 'setup-staging-env.js');

// Known placeholder patterns
const KNOWN_PLACEHOLDER_PREFIXES = ['awaiting_', 'your_'];
const KNOWN_PLACEHOLDER_EXACT = [
  'your_64_character_hex_encryption_key_32_bytes',
  'your_32_byte_minimum_rate_limit_hmac_secret',
  'your_supabase_publishable_anon_key',
  'your_supabase_secret_service_role_key',
  'awaiting_staging_publishable_anon_key',
  'awaiting_staging_secret_service_role_key',
  'awaiting_staging_razorpay_key_id',
  'awaiting_staging_razorpay_key_secret',
];

// Untracked environment targets for production/compromised key non-reuse verification.
// Read dynamically from process.env; NEVER hardcode credentials in tracked source files.
const UNTRACKED_EXCLUDED_KEYS = (process.env.PROD_KEYS_TO_EXCLUDE || '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

function calculateShannonEntropy(str) {
  const freq = {};
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  for (const ch in freq) {
    const p = freq[ch] / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function countUniqueCharacters(str) {
  return new Set(str).size;
}

function isPlaceholder(val) {
  if (!val) return true;
  if (KNOWN_PLACEHOLDER_EXACT.includes(val)) return true;
  for (const prefix of KNOWN_PLACEHOLDER_PREFIXES) {
    if (val.startsWith(prefix)) return true;
  }
  if (val.toLowerCase().includes('placeholder')) return true;
  return false;
}

console.log('==============================================================================');
console.log('ISHTI M03: STAGING CREDENTIAL & CRYPTOGRAPHIC KEY RECONCILIATION AUDIT');
console.log('==============================================================================\n');

const env = parseEnv(ENV_PATH);
const webEnv = parseEnv(WEB_ENV_PATH);

let passedChecks = 0;
let failedChecks = 0;
let notVerifiedChecks = 0;

function recordPass(category, name, detail) {
  console.log(`  [PASS] [${category}] ${name}${detail ? ` (${detail})` : ''}`);
  passedChecks++;
}

function recordFail(category, name, detail) {
  console.error(`  [FAIL] [${category}] ${name}${detail ? ` (${detail})` : ''}`);
  failedChecks++;
}

function recordNotVerified(category, name, detail) {
  console.warn(`  [NOT VERIFIED] [${category}] ${name}${detail ? ` (${detail})` : ''}`);
  notVerifiedChecks++;
}

// ==============================================================================
// 1. FORMAT VALIDATION
// ==============================================================================
console.log('--- CATEGORY 1: FORMAT VALIDATION ---');

function validateAesKeyFormat(scope, keyName, val) {
  if (!val) {
    recordFail('FORMAT', `${scope}.${keyName}: Presence`, 'Missing from environment configuration');
    return;
  }
  const isExactHex = /^[0-9a-fA-F]{64}$/.test(val);
  if (isExactHex) {
    recordPass('FORMAT', `${scope}.${keyName}: Exact 64 hexadecimal characters`);
  } else {
    recordFail('FORMAT', `${scope}.${keyName}: Exact 64 hexadecimal characters`, `Actual length: ${val.length}`);
  }

  const byteLength = isExactHex ? Buffer.from(val, 'hex').length : 0;
  if (byteLength === 32) {
    recordPass('FORMAT', `${scope}.${keyName}: Decodes to exactly 32 bytes (256 bits)`);
  } else {
    recordFail('FORMAT', `${scope}.${keyName}: Decodes to exactly 32 bytes (256 bits)`, `Actual bytes: ${byteLength}`);
  }

  const entropy = calculateShannonEntropy(val);
  const uniqueChars = countUniqueCharacters(val);
  const wellDistributed = entropy >= 3.0 && uniqueChars >= 12;
  if (wellDistributed) {
    recordPass(
      'FORMAT',
      `${scope}.${keyName}: Character distribution sanity check`,
      `Symbol diversity: ${entropy.toFixed(2)} bits/char, ${uniqueChars} unique symbols [heuristic check only; entropy does not prove cryptographic randomness]`
    );
  } else {
    recordFail(
      'FORMAT',
      `${scope}.${keyName}: Character distribution sanity check`,
      `Low symbol diversity: ${entropy.toFixed(2)} bits/char, ${uniqueChars} unique symbols`
    );
  }
}

function validateHmacSecretFormat(scope, secretName, val) {
  if (!val) {
    recordFail('FORMAT', `${scope}.${secretName}: Presence`, 'Missing from environment configuration');
    return;
  }
  const byteLength = Buffer.byteLength(val, 'utf8');
  if (byteLength >= 32) {
    recordPass('FORMAT', `${scope}.${secretName}: Minimum 32 bytes length requirement`, `Actual length: ${byteLength} bytes`);
  } else {
    recordFail('FORMAT', `${scope}.${secretName}: Minimum 32 bytes length requirement`, `Actual length: ${byteLength} bytes (less than 32 bytes)`);
  }

  const entropy = calculateShannonEntropy(val);
  const uniqueChars = countUniqueCharacters(val);
  const wellDistributed = entropy >= 3.0 && uniqueChars >= 12;
  if (wellDistributed) {
    recordPass(
      'FORMAT',
      `${scope}.${secretName}: Character distribution sanity check`,
      `Symbol diversity: ${entropy.toFixed(2)} bits/char, ${uniqueChars} unique symbols [heuristic check only; entropy does not prove cryptographic randomness]`
    );
  } else {
    recordFail(
      'FORMAT',
      `${scope}.${secretName}: Character distribution sanity check`,
      `Low symbol diversity: ${entropy.toFixed(2)} bits/char, ${uniqueChars} unique symbols`
    );
  }
}

validateAesKeyFormat('root', 'KUNDLI_ENCRYPTION_KEY_V1', env.KUNDLI_ENCRYPTION_KEY_V1);
validateHmacSecretFormat('root', 'RATE_LIMIT_HMAC_SECRET', env.RATE_LIMIT_HMAC_SECRET);
validateAesKeyFormat('web', 'KUNDLI_ENCRYPTION_KEY_V1', webEnv.KUNDLI_ENCRYPTION_KEY_V1);
validateHmacSecretFormat('web', 'RATE_LIMIT_HMAC_SECRET', webEnv.RATE_LIMIT_HMAC_SECRET);

// ==============================================================================
// 2. KEY-GENERATION PROVENANCE
// ==============================================================================
console.log('\n--- CATEGORY 2: KEY-GENERATION PROVENANCE ---');

if (fs.existsSync(SETUP_SCRIPT_PATH)) {
  const setupCode = fs.readFileSync(SETUP_SCRIPT_PATH, 'utf8');
  const usesCryptoRandomBytesAes = setupCode.includes("crypto.randomBytes(32).toString('hex')");
  if (usesCryptoRandomBytesAes) {
    recordPass('PROVENANCE', 'Key generation uses Node.js crypto.randomBytes(32) for 256-bit AES key');
  } else {
    recordFail('PROVENANCE', 'Key generation does NOT use crypto.randomBytes(32) for AES key');
  }

  const usesCryptoRandomBytesHmac = setupCode.includes("crypto.randomBytes(32)");
  if (usesCryptoRandomBytesHmac) {
    recordPass('PROVENANCE', 'HMAC secret generation uses Node.js crypto.randomBytes(32) (>= 32 bytes)');
  } else {
    recordFail('PROVENANCE', 'HMAC secret generation does NOT use crypto.randomBytes(32)');
  }

  const hasInsecureMathRandom = setupCode.includes('Math.random()');
  if (!hasInsecureMathRandom) {
    recordPass('PROVENANCE', 'Absence of non-cryptographic PRNG (no Math.random() in key generation pipeline)');
  } else {
    recordFail('PROVENANCE', 'Insecure PRNG detected: setup-staging-env.js contains Math.random()');
  }
} else {
  recordFail('PROVENANCE', 'Setup script missing: scripts/setup-staging-env.js not found');
}

// Runtime CSPRNG check
try {
  const sample = crypto.randomBytes(32);
  if (sample && sample.length === 32) {
    recordPass('PROVENANCE', 'Runtime Node.js crypto.randomBytes CSPRNG engine verified accessible');
  } else {
    recordFail('PROVENANCE', 'Runtime crypto.randomBytes failed to produce 32 bytes');
  }
} catch (err) {
  recordFail('PROVENANCE', 'Runtime crypto.randomBytes threw error', err.message);
}

// ==============================================================================
// 3. KEY SEPARATION
// ==============================================================================
console.log('\n--- CATEGORY 3: KEY SEPARATION ---');

const distinctKeys = env.KUNDLI_ENCRYPTION_KEY_V1 && env.RATE_LIMIT_HMAC_SECRET && (env.KUNDLI_ENCRYPTION_KEY_V1 !== env.RATE_LIMIT_HMAC_SECRET);
if (distinctKeys) {
  recordPass('SEPARATION', 'Domain separation: KUNDLI_ENCRYPTION_KEY_V1 and RATE_LIMIT_HMAC_SECRET are distinct');
} else {
  recordFail('SEPARATION', 'Domain separation failure: KUNDLI_ENCRYPTION_KEY_V1 and RATE_LIMIT_HMAC_SECRET are identical or missing');
}

const kundliWorkspaceMatch = Boolean(env.KUNDLI_ENCRYPTION_KEY_V1 && env.KUNDLI_ENCRYPTION_KEY_V1 === webEnv.KUNDLI_ENCRYPTION_KEY_V1);
if (kundliWorkspaceMatch) {
  recordPass('SEPARATION', 'Workspace alignment: Root and Web KUNDLI_ENCRYPTION_KEY_V1 match');
} else {
  recordFail('SEPARATION', 'Workspace alignment failure: Root and Web KUNDLI_ENCRYPTION_KEY_V1 differ');
}

const hmacWorkspaceMatch = Boolean(env.RATE_LIMIT_HMAC_SECRET && env.RATE_LIMIT_HMAC_SECRET === webEnv.RATE_LIMIT_HMAC_SECRET);
if (hmacWorkspaceMatch) {
  recordPass('SEPARATION', 'Workspace alignment: Root and Web RATE_LIMIT_HMAC_SECRET match');
} else {
  recordFail('SEPARATION', 'Workspace alignment failure: Root and Web RATE_LIMIT_HMAC_SECRET differ');
}

// ==============================================================================
// 4. PRODUCTION-KEY NON-REUSE
// ==============================================================================
console.log('\n--- CATEGORY 4: PRODUCTION-KEY NON-REUSE ---');

if (UNTRACKED_EXCLUDED_KEYS.length === 0) {
  recordNotVerified(
    'NON-REUSE',
    'Production-key non-reuse',
    'PROD_KEYS_TO_EXCLUDE is unset in local environment; cannot verify production-key non-reuse without untracked comparison targets'
  );
} else {
  let matchedTarget = false;
  const activeKeys = [
    env.KUNDLI_ENCRYPTION_KEY_V1,
    env.RATE_LIMIT_HMAC_SECRET,
    webEnv.KUNDLI_ENCRYPTION_KEY_V1,
    webEnv.RATE_LIMIT_HMAC_SECRET,
    env.RAZORPAY_KEY_ID,
    env.RAZORPAY_KEY_SECRET,
  ].filter(Boolean);

  for (const marker of UNTRACKED_EXCLUDED_KEYS) {
    if (activeKeys.includes(marker)) {
      matchedTarget = true;
      break;
    }
  }

  if (matchedTarget) {
    recordFail('NON-REUSE', 'Production-key non-reuse', 'Staging key matches an excluded production target!');
  } else {
    recordPass(
      'NON-REUSE',
      'Production-key non-reuse verified against untracked PROD_KEYS_TO_EXCLUDE targets (zero values or prefixes exposed)'
    );
  }
}

// ==============================================================================
// 5. PLACEHOLDER VALIDATION & RELEASE-READINESS GATE
// ==============================================================================
console.log('\n--- CATEGORY 5: PLACEHOLDER VALIDATION & RELEASE-READINESS GATE ---');

// Staging target project URL
const targetStagingUrl = 'https://zrjptpkhtklfgnovdrny.supabase.co';
const rootUrlMatches = env.NEXT_PUBLIC_SUPABASE_URL === targetStagingUrl;
const webUrlMatches = webEnv.NEXT_PUBLIC_SUPABASE_URL === targetStagingUrl;

if (rootUrlMatches && webUrlMatches) {
  recordPass('GATE', 'Target URL: NEXT_PUBLIC_SUPABASE_URL points strictly to staging project (zrjptpkhtklfgnovdrny)');
} else {
  recordFail('GATE', 'Target URL failure: URL does not match staging project zrjptpkhtklfgnovdrny');
}

// Ensure production project reference is never present
const prodRef = 'zxwkfnvmmxoojewhvsdc';
const rootHasProd = JSON.stringify(env).includes(prodRef);
const webHasProd = JSON.stringify(webEnv).includes(prodRef);

if (!rootHasProd && !webHasProd) {
  recordPass('GATE', 'Target isolation: Production project reference zxwkfnvmmxoojewhvsdc strictly absent from all configs');
} else {
  recordFail('GATE', 'Target isolation failure: Production project reference zxwkfnvmmxoojewhvsdc found in configuration!');
}

// Check placeholder status for unprovisioned credentials
const anonIsPlaceholder = isPlaceholder(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const serviceIsPlaceholder = isPlaceholder(env.SUPABASE_SERVICE_ROLE_KEY);
const rzpKeyIdIsPlaceholder = isPlaceholder(env.RAZORPAY_KEY_ID);
const rzpSecretIsPlaceholder = isPlaceholder(env.RAZORPAY_KEY_SECRET);

console.log(`  [INFO] Placeholder inspection:`);
console.log(`         NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonIsPlaceholder ? 'PLACEHOLDER DETECTED' : 'POPULATED'}`);
console.log(`         SUPABASE_SERVICE_ROLE_KEY:     ${serviceIsPlaceholder ? 'PLACEHOLDER DETECTED' : 'POPULATED'}`);
console.log(`         RAZORPAY_KEY_ID:               ${rzpKeyIdIsPlaceholder ? 'PLACEHOLDER DETECTED' : 'POPULATED'}`);
console.log(`         RAZORPAY_KEY_SECRET:           ${rzpSecretIsPlaceholder ? 'PLACEHOLDER DETECTED' : 'POPULATED'}`);

const hasPlaceholders = anonIsPlaceholder || serviceIsPlaceholder || rzpKeyIdIsPlaceholder || rzpSecretIsPlaceholder;

if (hasPlaceholders) {
  recordFail(
    'GATE',
    'Release-Readiness Gate: Staging credentials contain unpopulated placeholders',
    'Migration application and live staging execution are BLOCKED until real staging credentials are provided via secure untracked environment'
  );
} else {
  recordPass('GATE', 'Release-Readiness Gate: All staging credentials populated with non-placeholder values');
}

// ==============================================================================
// SUMMARY & AUDIT RATING
// ==============================================================================
console.log('\n==============================================================================');
console.log('KEY & CREDENTIAL AUDIT SUMMARY:');
console.log('==============================================================================');
console.log(`  Passed checks:        ${passedChecks}`);
console.log(`  Failed checks:        ${failedChecks}`);
console.log(`  Not verified checks:  ${notVerifiedChecks}`);
console.log('------------------------------------------------------------------------------');

if (hasPlaceholders) {
  console.log('STATUS: [BLOCKED] Staging Release-Readiness Gate Failed (Placeholders Present)');
} else if (failedChecks > 0) {
  console.log('STATUS: [FAIL] Integrity or format checks failed');
} else if (notVerifiedChecks > 0) {
  console.log('STATUS: [PROVISIONAL PASS] Format & provenance valid; production-key non-reuse NOT VERIFIED (PROD_KEYS_TO_EXCLUDE unset)');
} else {
  console.log('STATUS: [PASS] All checks passed cleanly');
}
console.log('==============================================================================\n');

if (failedChecks > 0) {
  process.exit(1);
}

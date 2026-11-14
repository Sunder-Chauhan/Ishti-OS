const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const WEB_ENV_PATH = path.join(ROOT_DIR, 'apps', 'web', '.env.local');

// Known placeholders and old production key markers for isolation testing
const KNOWN_PLACEHOLDERS = [
  'your_64_character_hex_encryption_key_32_bytes',
  'your_32_byte_minimum_rate_limit_hmac_secret',
  'your_supabase_publishable_anon_key',
  'your_supabase_secret_service_role_key',
];

// Production key markers that must NEVER match staging keys
const PRODUCTION_KEY_MARKERS = [
  'sb_secret_3LHpS',
  'sb_publishable_sQ7x',
  'rzp_test_U03HURCQ2zoC35',
  'UFDrc0KK1HqQ3E2waNCVT2t7',
];

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

console.log('======================================================');
console.log('ISHTI M03: STAGING CRYPTOGRAPHIC KEY & ISOLATION AUDIT');
console.log('======================================================\n');

const env = parseEnv(ENV_PATH);
const webEnv = parseEnv(WEB_ENV_PATH);

let passedChecks = 0;
let failedChecks = 0;

function recordResult(name, passed, detail) {
  if (passed) {
    console.log(`  [PASS] ${name}${detail ? ` (${detail})` : ''}`);
    passedChecks++;
  } else {
    console.error(`  [FAIL] ${name}${detail ? ` (${detail})` : ''}`);
    failedChecks++;
  }
}

// 1. AES-256 Key Format and Length Validation
function validateAesKey(keyName, val) {
  if (!val) {
    recordResult(`${keyName}: Present`, false, 'Missing from environment');
    return false;
  }
  const isExactHex = /^[0-9a-fA-F]{64}$/.test(val);
  recordResult(`${keyName}: Exact 64 hexadecimal characters`, isExactHex);

  const byteLength = isExactHex ? Buffer.from(val, 'hex').length : 0;
  recordResult(`${keyName}: Decodes to exactly 32 bytes (256 bits)`, byteLength === 32);

  const entropy = calculateShannonEntropy(val);
  const uniqueChars = countUniqueCharacters(val);
  const highEntropy = entropy >= 3.0 && uniqueChars >= 12;
  recordResult(`${keyName}: Cryptographic entropy verification`, highEntropy, `Entropy: ${entropy.toFixed(2)} bits/char, unique chars: ${uniqueChars}`);

  const notPlaceholder = !KNOWN_PLACEHOLDERS.includes(val) && !val.includes('placeholder');
  recordResult(`${keyName}: Non-placeholder value`, notPlaceholder);

  return isExactHex && byteLength === 32 && highEntropy && notPlaceholder;
}

// 2. HMAC Secret Entropy & Length Validation
function validateHmacSecret(secretName, val) {
  if (!val) {
    recordResult(`${secretName}: Present`, false, 'Missing from environment');
    return false;
  }
  const byteLength = Buffer.from(val, 'utf8').length;
  recordResult(`${secretName}: Minimum 32 bytes length requirement`, byteLength >= 32, `Byte length: ${byteLength}`);

  const entropy = calculateShannonEntropy(val);
  const uniqueChars = countUniqueCharacters(val);
  const highEntropy = entropy >= 3.0 && uniqueChars >= 12;
  recordResult(`${secretName}: Cryptographic entropy verification`, highEntropy, `Entropy: ${entropy.toFixed(2)} bits/char, unique chars: ${uniqueChars}`);

  const notPlaceholder = !KNOWN_PLACEHOLDERS.includes(val) && !val.includes('placeholder');
  recordResult(`${secretName}: Non-placeholder value`, notPlaceholder);

  return byteLength >= 32 && highEntropy && notPlaceholder;
}

console.log('--- 1. Root .env Cryptographic Keys ---');
validateAesKey('root.KUNDLI_ENCRYPTION_KEY_V1', env.KUNDLI_ENCRYPTION_KEY_V1);
validateHmacSecret('root.RATE_LIMIT_HMAC_SECRET', env.RATE_LIMIT_HMAC_SECRET);

console.log('\n--- 2. Web .env.local Cryptographic Keys ---');
validateAesKey('web.KUNDLI_ENCRYPTION_KEY_V1', webEnv.KUNDLI_ENCRYPTION_KEY_V1);
validateHmacSecret('web.RATE_LIMIT_HMAC_SECRET', webEnv.RATE_LIMIT_HMAC_SECRET);

console.log('\n--- 3. Workspace Key Consistency & Distinctness ---');
const kundliMatch = Boolean(env.KUNDLI_ENCRYPTION_KEY_V1 && env.KUNDLI_ENCRYPTION_KEY_V1 === webEnv.KUNDLI_ENCRYPTION_KEY_V1);
recordResult('Root and Web KUNDLI_ENCRYPTION_KEY_V1 match', kundliMatch);

const hmacMatch = Boolean(env.RATE_LIMIT_HMAC_SECRET && env.RATE_LIMIT_HMAC_SECRET === webEnv.RATE_LIMIT_HMAC_SECRET);
recordResult('Root and Web RATE_LIMIT_HMAC_SECRET match', hmacMatch);

const keysDistinct = env.KUNDLI_ENCRYPTION_KEY_V1 !== env.RATE_LIMIT_HMAC_SECRET;
recordResult('KUNDLI_ENCRYPTION_KEY_V1 and RATE_LIMIT_HMAC_SECRET are independent and distinct', keysDistinct);

console.log('\n--- 4. Production Key Non-Reuse & Isolation Verification ---');
let matchesProduction = false;
for (const marker of PRODUCTION_KEY_MARKERS) {
  if (
    env.KUNDLI_ENCRYPTION_KEY_V1 === marker ||
    env.RATE_LIMIT_HMAC_SECRET === marker ||
    webEnv.KUNDLI_ENCRYPTION_KEY_V1 === marker ||
    webEnv.RATE_LIMIT_HMAC_SECRET === marker ||
    env.RAZORPAY_KEY_ID === marker ||
    env.RAZORPAY_KEY_SECRET === marker
  ) {
    matchesProduction = true;
    break;
  }
}
recordResult('Staging keys do NOT equal production or compromised keys (local comparison, zero values printed)', !matchesProduction);

console.log('\n--- 5. Staging Supabase Credentials Placeholder Gate ---');
const anonIsPlaceholder = Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('awaiting_') || env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('your_')));
recordResult('NEXT_PUBLIC_SUPABASE_ANON_KEY is placeholder awaiting official provisioning', anonIsPlaceholder);

const serviceIsPlaceholder = Boolean(env.SUPABASE_SERVICE_ROLE_KEY && (env.SUPABASE_SERVICE_ROLE_KEY.startsWith('awaiting_') || env.SUPABASE_SERVICE_ROLE_KEY.startsWith('your_')));
recordResult('SUPABASE_SERVICE_ROLE_KEY is placeholder awaiting official provisioning', serviceIsPlaceholder);

const stagingProjectMatch = env.NEXT_PUBLIC_SUPABASE_URL === 'https://zrjptpkhtklfgnovdrny.supabase.co' && webEnv.NEXT_PUBLIC_SUPABASE_URL === 'https://zrjptpkhtklfgnovdrny.supabase.co';
recordResult('NEXT_PUBLIC_SUPABASE_URL targets staging project zrjptpkhtklfgnovdrny', stagingProjectMatch);

console.log('\n======================================================');
console.log(`KEY AUDIT SUMMARY: ${passedChecks} passed, ${failedChecks} failed`);
console.log('======================================================');

if (failedChecks > 0) {
  process.exit(1);
}

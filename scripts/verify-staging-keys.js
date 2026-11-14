const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const WEB_ENV_PATH = path.join(ROOT_DIR, 'apps', 'web', '.env.local');

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

console.log('=== STAGING CRYPTOGRAPHIC KEY VERIFICATION ===');

const env = parseEnv(ENV_PATH);
const webEnv = parseEnv(WEB_ENV_PATH);

function verifyKey(name, val, minBytes, exactHex) {
  if (!val) {
    console.error(`  [FAIL] ${name}: Missing from environment`);
    return false;
  }
  if (val.includes('your_') || val.includes('placeholder') || val.includes('awaiting_')) {
    console.error(`  [FAIL] ${name}: Contains placeholder value`);
    return false;
  }
  if (exactHex) {
    const isHex = /^[0-9a-fA-F]{64}$/.test(val);
    if (!isHex) {
      console.error(`  [FAIL] ${name}: Expected exact 64 hexadecimal characters (32 bytes)`);
      return false;
    }
    const byteLength = Buffer.from(val, 'hex').length;
    if (byteLength !== 32) {
      console.error(`  [FAIL] ${name}: Parsed buffer byte length is ${byteLength}, expected 32 bytes`);
      return false;
    }
    console.log(`  [PASS] ${name}: Validated as 32-byte hexadecimal key (64 hex characters)`);
    return true;
  } else {
    const byteLength = Buffer.from(val, 'utf8').length;
    if (byteLength < minBytes) {
      console.error(`  [FAIL] ${name}: Length is ${byteLength} bytes, below required minimum of ${minBytes} bytes`);
      return false;
    }
    console.log(`  [PASS] ${name}: Validated as secure secret (byte length: ${byteLength} >= ${minBytes} bytes minimum)`);
    return true;
  }
}

console.log('\nChecking root .env:');
const rootKundliOk = verifyKey('KUNDLI_ENCRYPTION_KEY_V1', env.KUNDLI_ENCRYPTION_KEY_V1, 32, true);
const rootHmacOk = verifyKey('RATE_LIMIT_HMAC_SECRET', env.RATE_LIMIT_HMAC_SECRET, 32, false);

console.log('\nChecking apps/web/.env.local:');
const webKundliOk = verifyKey('KUNDLI_ENCRYPTION_KEY_V1', webEnv.KUNDLI_ENCRYPTION_KEY_V1, 32, true);
const webHmacOk = verifyKey('RATE_LIMIT_HMAC_SECRET', webEnv.RATE_LIMIT_HMAC_SECRET, 32, false);

console.log('\nChecking Target Project References:');
const rootUrlOk = env.NEXT_PUBLIC_SUPABASE_URL === 'https://zrjptpkhtklfgnovdrny.supabase.co';
const webUrlOk = webEnv.NEXT_PUBLIC_SUPABASE_URL === 'https://zrjptpkhtklfgnovdrny.supabase.co';
console.log(`  [${rootUrlOk ? 'PASS' : 'FAIL'}] root .env NEXT_PUBLIC_SUPABASE_URL points to staging zrjptpkhtklfgnovdrny`);
console.log(`  [${webUrlOk ? 'PASS' : 'FAIL'}] apps/web/.env.local NEXT_PUBLIC_SUPABASE_URL points to staging zrjptpkhtklfgnovdrny`);

const allOk = rootKundliOk && rootHmacOk && webKundliOk && webHmacOk && rootUrlOk && webUrlOk;
console.log('\n==============================================');
console.log('STAGING KEY AUDIT RESULT:', allOk ? 'ALL KEYS VERIFIED' : 'FAILED');
console.log('==============================================');
if (!allOk) process.exit(1);

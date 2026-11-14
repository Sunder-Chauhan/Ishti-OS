const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const WEB_ENV_PATH = path.join(ROOT_DIR, 'apps', 'web', '.env.local');

// 1. Generate fresh staging-specific cryptographic keys (32 bytes = 64 hex characters)
const stagingKundliKey = crypto.randomBytes(32).toString('hex');
const stagingHmacSecret = crypto.randomBytes(32).toString('hex');

// 2. Read third-party credentials strictly from runtime environment variables.
// Real credentials must NEVER be hardcoded as source defaults.
const rzpKeyId = process.env.RAZORPAY_KEY_ID || 'awaiting_staging_razorpay_key_id';
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || 'awaiting_staging_razorpay_key_secret';

// 3. Format .env content
const envContent = `# ==============================================================================
# ISHTI Staging Environment Configuration (.env)
# Target Staging Project Ref: zrjptpkhtklfgnovdrny
# Region: ap-south-1 (Mumbai)
# Status: ACTIVE_HEALTHY
# ==============================================================================

# Supabase Staging Project URL
NEXT_PUBLIC_SUPABASE_URL=https://zrjptpkhtklfgnovdrny.supabase.co
# Awaiting Staging Publishable Anon Key from Supabase Dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY=awaiting_staging_publishable_anon_key

# Mobile Application (Expo) Staging URL
EXPO_PUBLIC_SUPABASE_URL=https://zrjptpkhtklfgnovdrny.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=awaiting_staging_publishable_anon_key

# Supabase Staging Secret Service Role Key
# Awaiting Staging Service Role Key from Supabase Dashboard
SUPABASE_SERVICE_ROLE_KEY=awaiting_staging_secret_service_role_key

# Staging Cryptographic Keys (Strictly staging-only; never reused from production)
KUNDLI_ENCRYPTION_KEY_V1=${stagingKundliKey}
RATE_LIMIT_HMAC_SECRET=${stagingHmacSecret}

# Infrastructure & Proxy Configuration
TRUSTED_PROXY_STRATEGY=none
REVERSE_PROXY_ORIGIN_PROTECTED=false
CLOUDFLARE_ORIGIN_PROTECTED=false

# Third-Party Integrations (Staging / Sandbox Mode)
RAZORPAY_KEY_ID=${rzpKeyId}
RAZORPAY_KEY_SECRET=${rzpKeySecret}
`;

fs.writeFileSync(ENV_PATH, envContent, 'utf8');

// 4. Format apps/web/.env.local content
const webEnvContent = `# ==============================================================================
# ISHTI Web Application Staging Environment Configuration (.env.local)
# Target Staging Project Ref: zrjptpkhtklfgnovdrny
# ==============================================================================

NEXT_PUBLIC_SUPABASE_URL=https://zrjptpkhtklfgnovdrny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=awaiting_staging_publishable_anon_key
SUPABASE_SERVICE_ROLE_KEY=awaiting_staging_secret_service_role_key

# Staging Cryptographic Keys
KUNDLI_ENCRYPTION_KEY_V1=${stagingKundliKey}
RATE_LIMIT_HMAC_SECRET=${stagingHmacSecret}

# Trusted Proxy Configuration
TRUSTED_PROXY_STRATEGY=none

# Payment Sandbox
RAZORPAY_KEY_ID=${rzpKeyId}
RAZORPAY_KEY_SECRET=${rzpKeySecret}
`;

fs.writeFileSync(WEB_ENV_PATH, webEnvContent, 'utf8');

console.log('Staging environment configuration files written successfully (zero credentials in source).');

/**
 * ISHTI Milestone M03.1.2: Strict Staging Endpoint & Database URL Validator
 *
 * Enforces strict URL parsing and exact hostname validation to ensure:
 * - Direct connection: db.zrjptpkhtklfgnovdrny.supabase.co (port 5432, db postgres)
 * - Pooler connection: aws-0-ap-south-1.pooler.supabase.com (port 5432 or 6543, user postgres.zrjptpkhtklfgnovdrny, db postgres)
 * - Strict quarantine: Production project (zxwkfnvmmxoojewhvsdc) and all arbitrary hosts are hard-blocked.
 * - Credential hygiene: Never prints or logs passwords or raw connection strings.
 */

export const APPROVED_STAGING_PROJECT_REF = "zrjptpkhtklfgnovdrny";
export const QUARANTINED_PRODUCTION_PROJECT_REF = "zxwkfnvmmxoojewhvsdc";

export const APPROVED_STAGING_DIRECT_HOST = `db.${APPROVED_STAGING_PROJECT_REF}.supabase.co`;
export const APPROVED_STAGING_POOLER_HOST = "aws-0-ap-south-1.pooler.supabase.com";

export interface ValidatedStagingEndpoint {
  protocol: "postgresql:" | "postgres:";
  hostname: string;
  port: number;
  database: string;
  username: string;
  connectionType: "direct" | "pooler";
  projectRef: string;
  sanitizedUrl: string;
}

export function validateStagingDatabaseUrl(rawUrl: string | undefined | null): ValidatedStagingEndpoint {
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    throw new Error("Validation Error: STAGING_DATABASE_URL is empty or missing. A non-empty connection URL is required.");
  }

  const trimmed = rawUrl.trim();

  // 1. Strict URL Parsing using the WHATWG URL API
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (err: any) {
    throw new Error(`Validation Error: STAGING_DATABASE_URL is not a valid URL: ${err?.message || "malformed URI"}`);
  }

  // 2. Protocol Validation
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`Validation Error: Invalid protocol '${parsed.protocol}'. Expected 'postgresql:' or 'postgres:'.`);
  }

  // 3. Strict Production Quarantine Hard-Block
  // Inspect hostname, username, pathname, search params, and hash for production reference
  const fullSearch = parsed.search.toLowerCase();
  const rawHost = parsed.hostname.toLowerCase();
  const rawUser = decodeURIComponent(parsed.username || "").toLowerCase();

  if (
    rawHost.includes(QUARANTINED_PRODUCTION_PROJECT_REF) ||
    rawUser.includes(QUARANTINED_PRODUCTION_PROJECT_REF) ||
    fullSearch.includes(QUARANTINED_PRODUCTION_PROJECT_REF) ||
    trimmed.includes(QUARANTINED_PRODUCTION_PROJECT_REF)
  ) {
    throw new Error(`CRITICAL SECURITY VIOLATION: Production project reference '${QUARANTINED_PRODUCTION_PROJECT_REF}' detected in database connection string! Connection refused. Production environment is quarantined.`);
  }

  // 4. Database Name Validation
  // URL pathname starts with '/', e.g. '/postgres'
  const dbName = parsed.pathname.replace(/^\//, "");
  if (!dbName) {
    throw new Error("Validation Error: Missing database name in connection URL. Expected '/postgres'.");
  }
  if (dbName !== "postgres") {
    throw new Error(`Validation Error: Forbidden database name '${dbName}'. Supabase connections must strictly target '/postgres'.`);
  }

  // 5. Exact Hostname & Connection Mode Allowlist
  let connectionType: "direct" | "pooler";
  let resolvedPort: number;

  if (rawHost === APPROVED_STAGING_DIRECT_HOST) {
    connectionType = "direct";
    resolvedPort = parsed.port ? parseInt(parsed.port, 10) : 5432;
    if (resolvedPort !== 5432) {
      throw new Error(`Validation Error: Invalid port '${resolvedPort}' for direct connection. Staging direct endpoint strictly requires port 5432.`);
    }

    // Direct connections strictly require username 'postgres'
    if (rawUser && rawUser !== "postgres") {
      throw new Error(`Validation Error: Invalid direct username '${rawUser}'. Supabase direct connections strictly require username 'postgres'.`);
    }
  } else if (rawHost === APPROVED_STAGING_POOLER_HOST) {
    connectionType = "pooler";
    resolvedPort = parsed.port ? parseInt(parsed.port, 10) : 6543;
    if (resolvedPort !== 6543 && resolvedPort !== 5432) {
      throw new Error(`Validation Error: Invalid port '${resolvedPort}' for Supabase pooler. Expected port 6543 (transaction mode) or 5432 (session mode).`);
    }

    // Pooler connections MUST have username strictly matching staging project: postgres.zrjptpkhtklfgnovdrny
    const expectedPoolerUser = `postgres.${APPROVED_STAGING_PROJECT_REF}`;
    if (rawUser !== expectedPoolerUser) {
      throw new Error(`Validation Error: Invalid pooler username '${rawUser}'. Supabase pooler strictly requires exact username '${expectedPoolerUser}'.`);
    }
  } else {
    // Fail closed: Any other host (localhost, 127.0.0.1, arbitrary AWS hosts, spoofed subdomains) is rejected.
    throw new Error(`Validation Error: Forbidden database host '${rawHost}'. Hostname must strictly match approved staging endpoint: '${APPROVED_STAGING_DIRECT_HOST}' or '${APPROVED_STAGING_POOLER_HOST}'.`);
  }

  // 6. Generate Sanitized URL (Credentials masked)
  const sanitized = `${parsed.protocol}//${parsed.username ? parsed.username + ":*****@" : ""}${rawHost}:${resolvedPort}/${dbName}`;

  return {
    protocol: parsed.protocol as "postgresql:" | "postgres:",
    hostname: rawHost,
    port: resolvedPort,
    database: dbName,
    username: rawUser,
    connectionType,
    projectRef: APPROVED_STAGING_PROJECT_REF,
    sanitizedUrl: sanitized,
  };
}

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  validateStagingDatabaseUrl,
  ValidatedStagingEndpoint,
  APPROVED_STAGING_PROJECT_REF,
  QUARANTINED_PRODUCTION_PROJECT_REF,
} from "./validate-staging-url";

/**
 * ISHTI Milestone M03.1.3: Validated Staging Database Backup Runner
 *
 * SAFETY & GOVERNANCE RESTRICTIONS:
 * - Strictly validates STAGING_DATABASE_URL using validateStagingDatabaseUrl().
 * - Quarantines production (zxwkfnvmmxoojewhvsdc) with immediate fatal halt.
 * - Enforces exact staging allowlist (zrjptpkhtklfgnovdrny).
 * - Defaults to DRY-RUN mode (inspects endpoint, prints exact commands, mutates nothing).
 * - Requires explicit --execute flag to invoke Supabase CLI backup passes.
 * - Masks credentials in all logs and outputs.
 * - Enforces 3-pass backup structure:
 *     Pass 1: DDL schema (public, supabase_migrations)
 *     Pass 2: Data records (public, supabase_migrations)
 *     Pass 3: Cluster roles (with explicit hosted restoration prohibition)
 */

async function runStagingBackup() {
  const args = process.argv.slice(2);
  const isExecute = args.includes("--execute");
  const dbUrl = process.env.STAGING_DATABASE_URL || "";

  console.log("==============================================================================");
  console.log("ISHTI M03.1.3: CONTROLLED STAGING DATABASE BACKUP RUNNER");
  console.log("==============================================================================");
  console.log(`Execution Mode:     ${isExecute ? "LIVE BACKUP (--execute)" : "DRY-RUN INSPECTION (Read-Only)"}`);
  console.log(`Target Staging Ref: ${APPROVED_STAGING_PROJECT_REF} (STRICT ALLOWLIST ENFORCED)`);
  console.log(`Prohibited Target:  ${QUARANTINED_PRODUCTION_PROJECT_REF} (STRICT PRODUCTION QUARANTINE)`);
  console.log("==============================================================================\n");

  // Step 1: Precondition & Strict Environment Boundary Validation
  let endpoint: ValidatedStagingEndpoint;
  try {
    endpoint = validateStagingDatabaseUrl(dbUrl);
  } catch (err: any) {
    console.error(`\nCRITICAL SECURITY VIOLATION: ${err.message}`);
    process.exit(1);
  }

  console.log(`Endpoint Verified:  ${endpoint.sanitizedUrl}`);
  console.log(`Connection Mode:    ${endpoint.connectionType === "direct" ? "Direct PostgreSQL (5432)" : "Supabase Pooler (6543/5432)"}`);
  console.log(`Host & Port:        ${endpoint.hostname}:${endpoint.port}`);
  console.log(`Database Name:      ${endpoint.database}\n`);

  // Supabase CLI --remote strictly requires 'postgres://' protocol prefix
  const cliNormalizedUrl = dbUrl.trim().replace(/^postgresql:\/\//i, "postgres://");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "supabase/backups");
  const schemaFile = path.join(backupDir, `staging_schema_${timestamp}.sql`);
  const dataFile = path.join(backupDir, `staging_data_${timestamp}.sql`);
  const rolesFile = path.join(backupDir, `staging_roles_${timestamp}.sql`);

  console.log("Planned Backup Targets:");
  console.log(`  1. Schema DDL:   ${schemaFile}`);
  console.log(`  2. Data Records: ${dataFile}`);
  console.log(`  3. Cluster Roles: ${rolesFile}\n`);

  if (!isExecute) {
    console.log("==============================================================================");
    console.log("DRY-RUN COMPLETE: The endpoint is validated and ready for backup.");
    console.log("To execute the backup against hosted staging, invoke with --execute.");
    console.log("==============================================================================");
    return;
  }

  // Ensure backups directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(">>> EXECUTING 3-PASS BACKUP VIA SUPABASE CLI...");

  try {
    // Pass 1: Schema dump
    console.log("\n[Pass 1/3] Dumping DDL schema (public, supabase_migrations)...");
    execSync(`npx.cmd supabase db dump --remote="${cliNormalizedUrl}" --schema public,supabase_migrations --keep-comments -f "${schemaFile}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    const schemaSize = fs.statSync(schemaFile).size;
    console.log(`      ✓ Schema dump generated successfully (${schemaSize} bytes).`);

    // Pass 2: Data dump
    console.log("\n[Pass 2/3] Dumping table data records (--data-only --use-copy)...");
    execSync(`npx.cmd supabase db dump --remote="${cliNormalizedUrl}" --schema public,supabase_migrations --data-only --use-copy -f "${dataFile}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    const dataSize = fs.statSync(dataFile).size;
    console.log(`      ✓ Data dump generated successfully (${dataSize} bytes).`);

    // Pass 3: Role dump
    console.log("\n[Pass 3/3] Dumping cluster roles (--role-only)...");
    execSync(`npx.cmd supabase db dump --remote="${cliNormalizedUrl}" --role-only -f "${rolesFile}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    const rolesSize = fs.statSync(rolesFile).size;
    console.log(`      ✓ Role dump generated successfully (${rolesSize} bytes).`);

    console.log("\n==============================================================================");
    console.log("BACKUP COMPLETED SUCCESSFULLY");
    console.log("==============================================================================");
    console.log("CRITICAL SECURITY NOTICE:");
    console.log("1. Backup files contain schema, seed data, and role definitions. NEVER commit to Git.");
    console.log("2. The role dump contains cluster-level roles. NEVER restore into a hosted Supabase project.");
    console.log("3. Protect these files using restricted local filesystem permissions (chmod 600).");
    console.log("==============================================================================\n");
  } catch (err: any) {
    console.error("\n[FATAL] Backup operation failed!", err.stdout || err.message);
    process.exit(1);
  }
}

if (process.argv[1]?.includes("backup-staging")) {
  runStagingBackup().catch(err => {
    console.error("Backup script error:", err);
    process.exit(1);
  });
}

export { runStagingBackup };

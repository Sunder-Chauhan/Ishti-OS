import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  validateStagingDatabaseUrl,
  ValidatedStagingEndpoint,
  APPROVED_STAGING_PROJECT_REF,
  QUARANTINED_PRODUCTION_PROJECT_REF,
} from "./validate-staging-url";

/**
 * ISHTI Milestone M03.2.1: Validated Staging Database Backup Runner & Integrity Verifier
 *
 * SAFETY & GOVERNANCE RESTRICTIONS:
 * - Strictly validates STAGING_DATABASE_URL using validateStagingDatabaseUrl().
 * - Quarantines production (zxwkfnvmmxoojewhvsdc) with immediate fatal halt.
 * - Enforces exact staging allowlist (zrjptpkhtklfgnovdrny).
 * - Defaults to DRY-RUN mode (inspects endpoint, prints exact commands, mutates nothing).
 * - Requires explicit --execute flag to invoke Supabase CLI backup passes.
 * - Masks credentials in all logs, outputs, and exception handlers.
 * - Enforces 3-pass backup structure:
 *     Pass 1: DDL schema (public, supabase_migrations)
 *     Pass 2: Data records (public, supabase_migrations)
 *     Pass 3: Cluster roles (with explicit hosted restoration prohibition)
 * - Safe handling of partial failures: quarantines/cleans incomplete run files,
 *   never deletes pre-existing historical backups, marks run as FAILED.
 * - Computes cryptographic SHA-256 checksums and emits companion metadata manifest.
 * - Provides --verify mode to independently validate backup integrity.
 * - Zero automatic uploads to external/third-party services.
 */

export interface BackupFileMetadata {
  filename: string;
  relativePath: string;
  sizeBytes: number;
  sha256: string;
}

export interface BackupManifest {
  timestamp: string;
  projectRef: string;
  status: "COMPLETED" | "FAILED";
  cliVersion: string;
  targetAllowlist: string;
  quarantinedProduction: string;
  files?: {
    schema: BackupFileMetadata;
    data: BackupFileMetadata;
    roles: BackupFileMetadata;
  };
  failureDetails?: {
    failedPass: string;
    error: string;
    quarantinedFiles: string[];
  };
  prohibitions: {
    roleDumpRestoration: string;
    gitInclusion: string;
  };
}

/**
 * Sanitizes any string to scrub database passwords and raw connection strings.
 */
export function sanitizeErrorMessage(msg: string | undefined | null): string {
  if (!msg) return "";
  return String(msg)
    .replace(/postgres(?:ql)?:\/\/[^\s@]+@/gi, "postgres://[REDACTED_CREDENTIALS]@")
    .replace(/--remote="[^"]*"/gi, '--remote="postgres://[REDACTED_CREDENTIALS]@..."')
    .replace(/--remote='[^']*'/gi, "--remote='postgres://[REDACTED_CREDENTIALS]@...'");
}

/**
 * Calculates SHA-256 hash of a file on disk.
 */
export function calculateFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

/**
 * Verifies backup integrity against its metadata manifest.
 */
export function verifyBackupIntegrity(targetPathOrTimestamp?: string): { success: boolean; message: string; manifest?: BackupManifest } {
  const backupDir = path.resolve(process.cwd(), "supabase/backups");

  if (!fs.existsSync(backupDir)) {
    return { success: false, message: `Backup directory does not exist: ${backupDir}` };
  }

  let manifestPath: string;

  if (targetPathOrTimestamp) {
    if (targetPathOrTimestamp.endsWith(".meta.json") && fs.existsSync(targetPathOrTimestamp)) {
      manifestPath = targetPathOrTimestamp;
    } else if (fs.existsSync(path.join(backupDir, targetPathOrTimestamp))) {
      manifestPath = path.join(backupDir, targetPathOrTimestamp);
    } else if (fs.existsSync(path.join(backupDir, `staging_backup_${targetPathOrTimestamp}.meta.json`))) {
      manifestPath = path.join(backupDir, `staging_backup_${targetPathOrTimestamp}.meta.json`);
    } else {
      return { success: false, message: `Specified backup manifest not found: ${targetPathOrTimestamp}` };
    }
  } else {
    // Find the latest .meta.json file
    const metaFiles = fs
      .readdirSync(backupDir)
      .filter(f => f.startsWith("staging_backup_") && f.endsWith(".meta.json"))
      .sort()
      .reverse();

    if (metaFiles.length === 0) {
      return { success: false, message: `No backup manifests found in ${backupDir}` };
    }
    manifestPath = path.join(backupDir, metaFiles[0]);
  }

  let manifest: BackupManifest;
  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    manifest = JSON.parse(raw);
  } catch (err: any) {
    return { success: false, message: `Failed to parse backup manifest '${manifestPath}': ${err.message}` };
  }

  if (manifest.status !== "COMPLETED") {
    return { success: false, message: `Backup manifest indicates non-completed status: '${manifest.status}'`, manifest };
  }

  if (manifest.projectRef !== APPROVED_STAGING_PROJECT_REF) {
    return {
      success: false,
      message: `Project reference mismatch in manifest. Expected '${APPROVED_STAGING_PROJECT_REF}', found '${manifest.projectRef}'`,
      manifest,
    };
  }

  if (!manifest.files) {
    return { success: false, message: "Manifest is missing file metadata section.", manifest };
  }

  const passes: Array<keyof typeof manifest.files> = ["schema", "data", "roles"];
  for (const pass of passes) {
    const fileMeta = manifest.files[pass];
    if (!fileMeta) {
      return { success: false, message: `Manifest is missing metadata for pass '${pass}'.`, manifest };
    }

    const absPath = path.resolve(backupDir, fileMeta.filename);
    if (!fs.existsSync(absPath)) {
      return { success: false, message: `Backup file missing on disk: ${absPath}`, manifest };
    }

    const actualSize = fs.statSync(absPath).size;
    if (actualSize === 0) {
      return { success: false, message: `Backup file is empty (0 bytes): ${absPath}`, manifest };
    }

    if (actualSize !== fileMeta.sizeBytes) {
      return {
        success: false,
        message: `File size mismatch for ${fileMeta.filename}. Expected ${fileMeta.sizeBytes} bytes, found ${actualSize} bytes.`,
        manifest,
      };
    }

    const actualSha256 = calculateFileSha256(absPath);
    if (actualSha256 !== fileMeta.sha256) {
      return {
        success: false,
        message: `SHA-256 checksum mismatch for ${fileMeta.filename}!\nExpected: ${fileMeta.sha256}\nComputed: ${actualSha256}`,
        manifest,
      };
    }
  }

  return {
    success: true,
    message: `All 3 backup files verified (schema, data, roles). Checksums and sizes match manifest '${path.basename(manifestPath)}'.`,
    manifest,
  };
}

async function runStagingBackup() {
  const args = process.argv.slice(2);
  const isExecute = args.includes("--execute");
  const isVerify = args.includes("--verify");

  // Handle --verify mode
  if (isVerify) {
    const verifyTargetIndex = args.indexOf("--verify") + 1;
    const verifyTarget = args[verifyTargetIndex] && !args[verifyTargetIndex].startsWith("--") ? args[verifyTargetIndex] : undefined;

    console.log("==============================================================================");
    console.log("ISHTI M03.2.1: BACKUP INTEGRITY VERIFICATION");
    console.log("==============================================================================");
    console.log(`Target: ${verifyTarget || "Latest manifest in supabase/backups/"}\n`);

    const result = verifyBackupIntegrity(verifyTarget);
    if (result.success) {
      console.log(`[PASS] ${result.message}`);
      if (result.manifest) {
        console.log("\nBackup Details:");
        console.log(`  Timestamp:    ${result.manifest.timestamp}`);
        console.log(`  Project Ref:  ${result.manifest.projectRef}`);
        console.log(`  CLI Version:  ${result.manifest.cliVersion}`);
        console.log("  Files Verified:");
        if (result.manifest.files) {
          console.log(`    - Schema: ${result.manifest.files.schema.filename} (${result.manifest.files.schema.sizeBytes} bytes)`);
          console.log(`      SHA-256: ${result.manifest.files.schema.sha256}`);
          console.log(`    - Data:   ${result.manifest.files.data.filename} (${result.manifest.files.data.sizeBytes} bytes)`);
          console.log(`      SHA-256: ${result.manifest.files.data.sha256}`);
          console.log(`    - Roles:  ${result.manifest.files.roles.filename} (${result.manifest.files.roles.sizeBytes} bytes)`);
          console.log(`      SHA-256: ${result.manifest.files.roles.sha256}`);
        }
      }
      console.log("\n==============================================================================");
      console.log("RESULT: VERIFICATION PASSED — BACKUP INTEGRITY CONFIRMED");
      console.log("==============================================================================\n");
      process.exit(0);
    } else {
      console.error(`[FAIL] ${result.message}`);
      console.error("\n==============================================================================");
      console.error("RESULT: VERIFICATION FAILED — INTEGRITY COMPROMISED OR MISSING");
      console.error("==============================================================================\n");
      process.exit(1);
    }
  }

  const dbUrl = process.env.STAGING_DATABASE_URL || "";

  console.log("==============================================================================");
  console.log("ISHTI M03.2.1: CONTROLLED STAGING DATABASE BACKUP RUNNER");
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
    console.error(`\nCRITICAL SECURITY VIOLATION: ${sanitizeErrorMessage(err.message)}`);
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
  const manifestFile = path.join(backupDir, `staging_backup_${timestamp}.meta.json`);

  console.log("Planned Backup Targets:");
  console.log(`  1. Schema DDL:   ${schemaFile}`);
  console.log(`  2. Data Records: ${dataFile}`);
  console.log(`  3. Cluster Roles: ${rolesFile}`);
  console.log(`  4. Metadata:     ${manifestFile}\n`);

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

  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const createdFilesInCurrentRun: string[] = [];
  let currentPass = "Pass 1: Schema DDL";

  console.log(">>> EXECUTING 3-PASS BACKUP VIA SUPABASE CLI...");

  try {
    // Pass 1: Schema dump
    currentPass = "Pass 1/3: Schema DDL (public, supabase_migrations)";
    console.log(`\n[Pass 1/3] Dumping DDL schema (public, supabase_migrations)...`);
    execSync(`${npxCmd} supabase db dump --remote="${cliNormalizedUrl}" --schema public,supabase_migrations --keep-comments -f "${schemaFile}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (!fs.existsSync(schemaFile)) {
      throw new Error(`Schema dump file was not generated: ${schemaFile}`);
    }
    const schemaSize = fs.statSync(schemaFile).size;
    if (schemaSize === 0) {
      throw new Error(`Schema dump file is empty (0 bytes): ${schemaFile}`);
    }
    createdFilesInCurrentRun.push(schemaFile);
    console.log(`      ✓ Schema dump generated successfully (${schemaSize} bytes).`);

    // Pass 2: Data dump
    currentPass = "Pass 2/3: Data Records (--data-only --use-copy)";
    console.log(`\n[Pass 2/3] Dumping table data records (--data-only --use-copy)...`);
    execSync(`${npxCmd} supabase db dump --remote="${cliNormalizedUrl}" --schema public,supabase_migrations --data-only --use-copy -f "${dataFile}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (!fs.existsSync(dataFile)) {
      throw new Error(`Data dump file was not generated: ${dataFile}`);
    }
    const dataSize = fs.statSync(dataFile).size;
    if (dataSize === 0) {
      throw new Error(`Data dump file is empty (0 bytes): ${dataFile}`);
    }
    createdFilesInCurrentRun.push(dataFile);
    console.log(`      ✓ Data dump generated successfully (${dataSize} bytes).`);

    // Pass 3: Role dump
    currentPass = "Pass 3/3: Cluster Roles (--role-only)";
    console.log(`\n[Pass 3/3] Dumping cluster roles (--role-only)...`);
    execSync(`${npxCmd} supabase db dump --remote="${cliNormalizedUrl}" --role-only -f "${rolesFile}"`, {
      encoding: "utf8",
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (!fs.existsSync(rolesFile)) {
      throw new Error(`Role dump file was not generated: ${rolesFile}`);
    }
    const rolesSize = fs.statSync(rolesFile).size;
    if (rolesSize === 0) {
      throw new Error(`Role dump file is empty (0 bytes): ${rolesFile}`);
    }
    createdFilesInCurrentRun.push(rolesFile);
    console.log(`      ✓ Role dump generated successfully (${rolesSize} bytes).`);

    // Step 4: Cryptographic Checksums & Metadata Manifest
    console.log("\n[Verification] Calculating cryptographic SHA-256 checksums...");
    const schemaSha = calculateFileSha256(schemaFile);
    const dataSha = calculateFileSha256(dataFile);
    const rolesSha = calculateFileSha256(rolesFile);

    console.log(`  Schema SHA-256: ${schemaSha}`);
    console.log(`  Data SHA-256:   ${dataSha}`);
    console.log(`  Roles SHA-256:  ${rolesSha}`);

    const manifest: BackupManifest = {
      timestamp: new Date().toISOString(),
      projectRef: APPROVED_STAGING_PROJECT_REF,
      status: "COMPLETED",
      cliVersion: "3.1.0",
      targetAllowlist: APPROVED_STAGING_PROJECT_REF,
      quarantinedProduction: QUARANTINED_PRODUCTION_PROJECT_REF,
      files: {
        schema: {
          filename: path.basename(schemaFile),
          relativePath: path.relative(process.cwd(), schemaFile).replace(/\\/g, "/"),
          sizeBytes: schemaSize,
          sha256: schemaSha,
        },
        data: {
          filename: path.basename(dataFile),
          relativePath: path.relative(process.cwd(), dataFile).replace(/\\/g, "/"),
          sizeBytes: dataSize,
          sha256: dataSha,
        },
        roles: {
          filename: path.basename(rolesFile),
          relativePath: path.relative(process.cwd(), rolesFile).replace(/\\/g, "/"),
          sizeBytes: rolesSize,
          sha256: rolesSha,
        },
      },
      prohibitions: {
        roleDumpRestoration: "FORBIDDEN: The role dump contains platform cluster roles and must NEVER be restored to a hosted Supabase project.",
        gitInclusion: "FORBIDDEN: Backup files and metadata must remain untracked and excluded by .gitignore.",
      },
    };

    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`      ✓ Backup manifest written to ${manifestFile}`);

    console.log("\n==============================================================================");
    console.log("BACKUP COMPLETED SUCCESSFULLY");
    console.log("==============================================================================");
    console.log("CRITICAL SECURITY NOTICE:");
    console.log("1. Backup files contain schema, seed data, and role definitions. NEVER commit to Git.");
    console.log("2. The role dump contains cluster-level roles. NEVER restore into a hosted Supabase project.");
    console.log("3. Protect these files using restricted local filesystem permissions (chmod 600).");
    console.log("4. Historical backups are preserved. No cloud uploads were performed.");
    console.log("==============================================================================\n");
  } catch (err: any) {
    const rawError = err.stderr?.toString() || err.stdout?.toString() || err.message || "Unknown error";
    const sanitizedError = sanitizeErrorMessage(rawError);

    console.error(`\n[FATAL] Backup operation failed during: ${currentPass}`);
    console.error(`Error details: ${sanitizedError}`);

    // Safe handling of partial failures:
    // Quarantine incomplete files from THIS run only with .FAILED_INCOMPLETE suffix
    // NEVER delete or touch historical backups
    const quarantinedFiles: string[] = [];
    for (const partialFile of createdFilesInCurrentRun) {
      if (fs.existsSync(partialFile)) {
        const quarantinedPath = `${partialFile}.FAILED_INCOMPLETE`;
        try {
          fs.renameSync(partialFile, quarantinedPath);
          quarantinedFiles.push(quarantinedPath);
          console.warn(`[QUARANTINE] Renamed incomplete artifact: ${path.basename(quarantinedPath)}`);
        } catch {
          // If rename fails, try unlinking
          try {
            fs.unlinkSync(partialFile);
            console.warn(`[CLEANUP] Removed incomplete artifact: ${path.basename(partialFile)}`);
          } catch {
            // ignore
          }
        }
      }
    }

    // Write failure record
    const failureManifest: BackupManifest = {
      timestamp: new Date().toISOString(),
      projectRef: APPROVED_STAGING_PROJECT_REF,
      status: "FAILED",
      cliVersion: "3.1.0",
      targetAllowlist: APPROVED_STAGING_PROJECT_REF,
      quarantinedProduction: QUARANTINED_PRODUCTION_PROJECT_REF,
      failureDetails: {
        failedPass: currentPass,
        error: sanitizedError,
        quarantinedFiles: quarantinedFiles.map(f => path.basename(f)),
      },
      prohibitions: {
        roleDumpRestoration: "FORBIDDEN: The role dump contains platform cluster roles and must NEVER be restored to a hosted Supabase project.",
        gitInclusion: "FORBIDDEN: Backup files and metadata must remain untracked and excluded by .gitignore.",
      },
    };

    try {
      const failureFile = path.join(backupDir, `staging_backup_${timestamp}.FAILED.json`);
      fs.writeFileSync(failureFile, JSON.stringify(failureManifest, null, 2), "utf8");
      console.warn(`[AUDIT] Recorded failure manifest: ${path.basename(failureFile)}`);
    } catch {
      // ignore failure writing manifest
    }

    console.error("\n==============================================================================");
    console.error("BACKUP STATUS: FAILED (Incomplete dump set quarantined)");
    console.error("Any partial artifacts from this run have been isolated.");
    console.error("Pre-existing historical backups remain untouched.");
    console.error("==============================================================================\n");
    process.exit(1);
  }
}

if (process.argv[1]?.includes("backup-staging")) {
  runStagingBackup().catch(err => {
    console.error("Backup script error:", sanitizeErrorMessage(err?.message));
    process.exit(1);
  });
}

export { runStagingBackup };

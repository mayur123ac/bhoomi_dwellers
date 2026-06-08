#!/usr/bin/env node
// scripts/run-migrations.js
// ─────────────────────────────────────────────────────────────────────────────
// Runs all Phase 1 SaaS migrations in order against the configured DATABASE_URL.
//
// Usage (from inside frontend/ folder):
//   node scripts/run-migrations.js
//
// The script is safe to run multiple times — all migrations use IF NOT EXISTS
// and idempotency guards.
//
// ⚠️  IMPORTANT: Before running, make sure DATABASE_URL in .env.local points
//    to your NEW SaaS database (e.g. bhoomi_crm_saas), NOT the original
//    bhoomi_crm database.
// ─────────────────────────────────────────────────────────────────────────────

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("ERROR: .env.local not found. Run this from inside the frontend/ folder.");
  process.exit(1);
}

const envVars = {};
fs.readFileSync(envPath, "utf8")
  .split("\n")
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    let val = trimmed.slice(eqIndex + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  });

const DATABASE_URL = envVars["DATABASE_URL"];
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found in .env.local");
  process.exit(1);
}

// ── Safety check ──────────────────────────────────────────────────────────────
// Warn if the URL still points to the original bhoomi_crm database
if (DATABASE_URL.includes("/bhoomi_crm") && !DATABASE_URL.includes("/bhoomi_crm_saas")) {
  console.warn("\n⚠️  WARNING: DATABASE_URL appears to point to the ORIGINAL bhoomi_crm database.");
  console.warn("   The migrations will still run, but you should be using a NEW database.");
  console.warn("   Update DATABASE_URL in .env.local to bhoomi_crm_saas before running.\n");
  // Continue anyway — the user may have intentionally set up in the same DB
}

console.log("DATABASE_URL:", DATABASE_URL.replace(/:\/\/[^@]+@/, "://***@")); // mask credentials

// ── Migration files in order ──────────────────────────────────────────────────
const MIGRATIONS_DIR = path.join(process.cwd(), "scripts", "migrations");
const MIGRATION_FILES = [
  "001_create_organizations.sql",
  "002_add_organization_id_to_all_tables.sql",
  "002b_add_organization_id_remaining_tables.sql",
  "003_refactor_users_table.sql",
  "004_seed_first_organization.sql",
  "006_create_audit_logs.sql",
  "007_create_platform_tables.sql",
  "008_add_ai_infrastructure.sql",
  "009_enterprise_lead_architecture.sql",
  "010_enterprise_fixes.sql",
];

async function runMigrations() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  console.log("\n════════════════════════════════════════════════════");
  console.log("  Phase 1 — Multi-Tenant SaaS Migration Runner");
  console.log("════════════════════════════════════════════════════\n");

  for (let i = 0; i < MIGRATION_FILES.length; i++) {
    const fileName = MIGRATION_FILES[i];
    const filePath = path.join(MIGRATIONS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      await pool.end();
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, "utf8");

    console.log(`\n[${i + 1}/${MIGRATION_FILES.length}] Running: ${fileName}`);
    console.log("─".repeat(56));

    const client = await pool.connect();
    try {
      // Run the migration SQL
      await client.query(sql);
      console.log(`✅ ${fileName} — completed successfully.`);
    } catch (err) {
      console.error(`\n❌ FAILED: ${fileName}`);
      console.error("Error:", err.message);
      console.error("\nFull error:", err);
      client.release();
      await pool.end();
      process.exit(1);
    } finally {
      client.release();
    }
  }

  await pool.end();

  console.log("\n════════════════════════════════════════════════════");
  console.log("✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY");
  console.log("════════════════════════════════════════════════════");
  console.log("\nNext steps:");
  console.log("  1. Restart your Next.js dev server (npm run dev)");
  console.log("  2. Log in — your session will now include organizationId");
  console.log("  3. Test existing dashboard pages — they should still work");
  console.log("  4. Check /api/organizations to see your first org registered");
  console.log("\n");
}

runMigrations().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

#!/usr/bin/env node
// scripts/migrations/005_hash_existing_passwords.js
// ─────────────────────────────────────────────────────────────────────────────
// One-time script to bcrypt-hash all plaintext passwords in bhoomi_crm_saas.
//
// Usage (from inside frontend/ folder):
//   node scripts/migrations/005_hash_existing_passwords.js
//
// SAFE: Only updates rows where the password does NOT already start with "$2b$"
// (the bcrypt hash prefix). Re-running is safe — already-hashed rows are skipped.
// ─────────────────────────────────────────────────────────────────────────────

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("ERROR: .env.local not found. Run from inside frontend/ folder.");
  process.exit(1);
}

const envVars = {};
fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
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

const BCRYPT_ROUNDS = 12;

async function hashPasswords() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  console.log("\n════════════════════════════════════════════════════");
  console.log("  Phase 2A — bcrypt Password Migration");
  console.log("════════════════════════════════════════════════════\n");

  try {
    // Fetch all users with plaintext passwords (not already bcrypt-hashed)
    const { rows: users } = await client.query(
      `SELECT id, email, password FROM users
       WHERE password IS NOT NULL
         AND password NOT LIKE '$2b$%'
         AND password NOT LIKE '$2a$%'`
    );

    console.log(`Found ${users.length} user(s) with plaintext passwords to hash.\n`);

    if (users.length === 0) {
      console.log("✅ All passwords are already hashed. Nothing to do.");
      return;
    }

    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const hashed = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
        await client.query(
          `UPDATE users SET password = $1 WHERE id = $2`,
          [hashed, user.id]
        );
        console.log(`  ✅ Hashed password for: ${user.email}`);
        success++;
      } catch (err) {
        console.error(`  ❌ Failed for ${user.email}: ${err.message}`);
        failed++;
      }
    }

    console.log("\n════════════════════════════════════════════════════");
    console.log(`✅ Migration complete: ${success} hashed, ${failed} failed.`);
    console.log("════════════════════════════════════════════════════\n");

    if (failed > 0) {
      console.warn("⚠️  Some passwords could not be hashed. Re-run the script to retry failed rows.");
    }

  } finally {
    client.release();
    await pool.end();
  }
}

hashPasswords().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

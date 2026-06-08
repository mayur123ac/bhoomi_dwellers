#!/usr/env node
// scripts/seed-super-admin.js
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("ERROR: .env.local not found.");
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
  console.error("ERROR: DATABASE_URL not found.");
  process.exit(1);
}

const args = process.argv.slice(2);
const name = args[0];
const email = args[1];
const password = args[2];

if (!name || !email || !password) {
  console.error("Usage: node scripts/seed-super-admin.js <Name> <Email> <Password>");
  console.error("Example: node scripts/seed-super-admin.js \"Super Admin\" admin@nexora.io mysecurepwd");
  process.exit(1);
}

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const existing = await pool.query("SELECT id FROM super_admins WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      console.log(`❌ Super Admin with email ${email} already exists.`);
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 12);
    
    await pool.query(
      "INSERT INTO super_admins (name, email, password_hash) VALUES ($1, $2, $3)",
      [name, email, hash]
    );

    console.log(`✅ Successfully seeded Super Admin: ${email}`);
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await pool.end();
  }
}

seed();

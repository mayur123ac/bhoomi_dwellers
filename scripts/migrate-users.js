// scripts/migrate-users.js
// ─────────────────────────────────────────────────────────────
// Run ONCE from inside the frontend/ folder:
//   node scripts/migrate-users.js
//
// Requires: DATABASE_URL and MONGODB_URI inside .env.local
// ─────────────────────────────────────────────────────────────

const { MongoClient } = require("mongodb");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// ── Load .env.local manually ──────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌  .env.local not found. Run this from inside the frontend/ folder.");
  process.exit(1);
}

const envVars = {};
fs.readFileSync(envPath, "utf8")
  .split("\n")
  .forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    envVars[key] = val;
  });

const MONGODB_URI  = envVars.MONGODB_URI;
const DATABASE_URL = envVars.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not found in .env.local");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL not found in .env.local");
  process.exit(1);
}

// ── Main migration ────────────────────────────────────────────
const pool = new Pool({ connectionString: DATABASE_URL });

async function migrate() {
  console.log("\n🚀  Starting migration: MongoDB  →  PostgreSQL\n");

  console.log("Connecting to MongoDB Atlas...");
  const mongo = new MongoClient(MONGODB_URI);
  await mongo.connect();
  console.log("✓  MongoDB connected");

  const db = mongo.db(); // DB name comes from the URI
  const pgClient = await pool.connect();

  try {
    await pgClient.query("BEGIN");

    // ────────────────────────────────────────────────────────
    // STEP 1 — Migrate Roles
    // ────────────────────────────────────────────────────────
    console.log("\n[1/2] Migrating roles...");
    const roles = await db.collection("roles").find({}).toArray();
    console.log(`  Found ${roles.length} role(s) in MongoDB`);

    for (const r of roles) {
      await pgClient.query(
        `INSERT INTO roles (name)
         VALUES ($1)
         ON CONFLICT (name) DO NOTHING`,
        [r.name]
      );
      console.log(`  ✓  Role migrated: "${r.name}"`);
    }

    // ────────────────────────────────────────────────────────
    // STEP 2 — Migrate Users
    // ────────────────────────────────────────────────────────
    console.log("\n[2/2] Migrating users...");
    const users = await db.collection("users").find({}).toArray();
    console.log(`  Found ${users.length} user(s) in MongoDB`);

    for (const u of users) {
      await pgClient.query(
        `INSERT INTO users (name, username, email, password, role, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE
           SET name      = EXCLUDED.name,
               username  = EXCLUDED.username,
               password  = EXCLUDED.password,
               role      = EXCLUDED.role,
               is_active = EXCLUDED.is_active`,
        [
          u.name      || "Unknown",
          u.username  || null,
          u.email,
          u.password  || "changeme",
          u.role      || "Employee",
          u.isActive  !== undefined ? u.isActive : true,
          u.createdAt || new Date(),
        ]
      );
      console.log(`  ✓  User migrated: ${u.email}  (role: ${u.role})`);
    }

    await pgClient.query("COMMIT");

    console.log("\n✅  Migration complete!");
    console.log("────────────────────────────────────────────────");
    console.log("Next steps:");
    console.log("  1. Replace the 3 API route files (employees, roles, sales-manager)");
    console.log("  2. Test login, receptionist dropdown, and employee management");
    console.log("  3. Once confirmed, delete lib/models/User.ts and lib/models/Role.ts");
    console.log("  4. Remove MONGODB_URI from .env.local");
    console.log("────────────────────────────────────────────────\n");

  } catch (err) {
    await pgClient.query("ROLLBACK");
    console.error("\n❌  Migration FAILED — all changes rolled back");
    console.error("Error:", err.message || err);
    process.exit(1);
  } finally {
    pgClient.release();
    await pool.end();
    await mongo.close();
  }
}

migrate();
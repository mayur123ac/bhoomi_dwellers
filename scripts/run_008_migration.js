const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");
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

async function runMigrations() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const sql = fs.readFileSync(path.join(process.cwd(), "scripts", "migrations", "008_add_ai_infrastructure.sql"), "utf8");

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`✅ 008_add_ai_infrastructure.sql — completed successfully.`);
  } catch (err) {
    console.error(`\n❌ FAILED`);
    console.error("Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();

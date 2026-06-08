const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");
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
const pool = new Pool({ connectionString: DATABASE_URL });

async function cleanup() {
  try {
    const result = await pool.query(`
      DELETE FROM site_visits a USING site_visits b
      WHERE a.id > b.id
        AND a.organization_id = b.organization_id
        AND a.lead_id = b.lead_id
        AND a.visit_date = b.visit_date
        AND a.status != 'cancelled'
        AND b.status != 'cancelled';
    `);
    console.log(`Deleted ${result.rowCount} duplicate site visits`);

    const sql = fs.readFileSync(path.join(process.cwd(), "scripts", "migrations", "010_enterprise_fixes.sql"), "utf8");
    await pool.query(sql);
    console.log("010 applied successfully");
  } catch (e) {
    console.error("Failed", e);
  } finally {
    pool.end();
  }
}

cleanup();

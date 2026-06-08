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

const pool = new Pool({ connectionString: envVars["DATABASE_URL"] });

async function test() {
  const orgId = '26fde71a-b1df-42f7-b59a-7e59ab7987eb'; // typical UUID
  try {
    const res = await pool.query(
      `SELECT * FROM walkin_enquiries 
       WHERE organization_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [orgId, 10000, 0]
    );
    console.log("Walkin Enquiries OK");
  } catch (e) {
    console.error("Walkin Enquiries Error:", e.message);
  }
  pool.end();
}

test();

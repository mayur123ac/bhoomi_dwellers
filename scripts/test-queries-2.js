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
  try {
    const res = await pool.query("SELECT * FROM walkin_enquiries LIMIT 1");
    console.log("Walkin Enquiries OK");
  } catch (e) {
    console.error("Walkin Enquiries Error:", e.message);
  }

  try {
    const res = await pool.query("SELECT * FROM follow_ups LIMIT 1");
    console.log("Followups OK");
  } catch (e) {
    console.error("Followups Error:", e.message);
  }

  pool.end();
}

test();

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
    const res = await pool.query(`SELECT * FROM users 
       WHERE organization_id = '00000000-0000-0000-0000-000000000000' AND (LOWER(role) LIKE '%site%head%' 
          OR LOWER(role) = 'site_head') 
       ORDER BY name ASC`);
    console.log("Site Head OK:", res.rows);
  } catch (e) {
    console.error("Site Head Error:", e.message);
  }

  try {
    const res = await pool.query(`SELECT id, name
       FROM users
       WHERE organization_id = '00000000-0000-0000-0000-000000000000'
         AND LOWER(role) = 'sales manager'
         AND is_active = true
       ORDER BY name ASC`);
    console.log("Sales Manager OK:", res.rows);
  } catch (e) {
    console.error("Sales Manager Error:", e.message);
  }

  try {
    const res = await pool.query(`SELECT id, name, username, email, role, is_active as "isActive"
       FROM users
       WHERE organization_id = '00000000-0000-0000-0000-000000000000'
         AND LOWER(role) = 'receptionist'
         AND is_active = true
       ORDER BY name ASC`);
    console.log("Receptionist OK:", res.rows);
  } catch (e) {
    console.error("Receptionist Error:", e.message);
  }
  
  try {
    const res = await pool.query(`SELECT
        l.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',         f.id,
              'message',    f.message,
              'created_by', f.created_by_name,
              'created_at', f.created_at
            ) ORDER BY f.created_at
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) AS follow_ups
      FROM leads l
      LEFT JOIN follow_ups f ON f.lead_id = l.id
      WHERE l.organization_id = '00000000-0000-0000-0000-000000000000' GROUP BY l.id ORDER BY l.created_at DESC LIMIT 10 OFFSET 0`);
    console.log("Walkin Enquiries OK");
  } catch (e) {
    console.error("Walkin Enquiries Error:", e.message);
  }

  pool.end();
}

test();

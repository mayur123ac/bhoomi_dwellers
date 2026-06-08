const { Pool } = require('pg');
const fs = require('fs');

const envVars = {};
fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    let val = trimmed.slice(eqIndex + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  });

const pool = new Pool({ connectionString: envVars['DATABASE_URL'] });

async function run() {
  const tablesRes = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log("TABLES:", tablesRes.rows.map(r => r.table_name).join(", "));

  const leads = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads'`);
  console.log("LEADS COLUMNS:", leads.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));

  const users = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`);
  console.log("USERS COLUMNS:", users.rows.map(r => `${r.column_name} (${r.data_type})`).join(", "));
  
  pool.end();
}
run();

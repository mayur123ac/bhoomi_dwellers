const { Pool } = require('pg');
const fs = require('fs');

async function introspect() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const dbUrlMatch = envFile.match(/DATABASE_URL=(.+)/);
  if (!dbUrlMatch) throw new Error("No DATABASE_URL found");
  
  let dbUrl = dbUrlMatch[1].trim();
  // remove quotes if any
  dbUrl = dbUrl.replace(/^["']|["']$/g, '');

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase') || dbUrl.includes('neon') ? { rejectUnauthorized: false } : false,
  });

  try {
    const schema = 'public';

    // 1. Get Tables
    const tablesRes = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
    `, [schema]);
    
    const tables = tablesRes.rows.map(r => r.table_name);
    
    // 2. Get Columns
    const columnsRes = await pool.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = $1
    `, [schema]);

    // 3. Get Constraints (PK, UNIQUE, FK)
    const constraintsRes = await pool.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        tc.constraint_type,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = $1
    `, [schema]);

    // 4. Get Indexes
    const indexesRes = await pool.query(`
      SELECT
        tablename as table_name,
        indexname as index_name,
        indexdef as index_def
      FROM pg_indexes
      WHERE schemaname = $1
    `, [schema]);

    const result = {
      tables: tables.map(t => {
        const cols = columnsRes.rows.filter(c => c.table_name === t);
        const consts = constraintsRes.rows.filter(c => c.table_name === t);
        const idxs = indexesRes.rows.filter(i => i.table_name === t);
        
        return {
          name: t,
          columns: cols,
          constraints: consts,
          indexes: idxs
        };
      })
    };

    fs.writeFileSync('C:/Users/Mayur/.gemini/antigravity-ide/brain/6c04e601-a545-4313-8348-d13bac6bd60c/scratch/schema.json', JSON.stringify(result, null, 2));
    console.log("Schema extraction complete.");

  } catch (error) {
    console.error("Introspection Error:", error);
  } finally {
    await pool.end();
  }
}

introspect();

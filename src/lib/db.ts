// lib/db.ts
// ─────────────────────────────────────────────
// PostgreSQL connection using the 'pg' library
// npm install pg @types/pg
// ─────────────────────────────────────────────

import { Pool, PoolClient } from "pg";

// Singleton pool — reused across requests in Next.js
let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // OR use individual env vars:
      // host:     process.env.PGHOST,
      // port:     Number(process.env.PGPORT) || 5432,
      // database: process.env.PGDATABASE,
      // user:     process.env.PGUSER,
      // password: process.env.PGPASSWORD,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }   // required for Supabase / Railway / Neon
        : false,
      max: 10,          // max pool size
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("error", (err) => {
      console.error("[DB] Unexpected pool error", err);
    });
  }
  return pool;
}

// Convenience: run a single query
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

// Convenience: run multiple queries in a transaction
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
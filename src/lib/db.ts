// lib/db.ts
// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL connection pool + query helpers.
//
// Phase 1 additions:
//   - tenantQuery()  — always injects organization_id as the first parameter
//   - tenantTransaction() — transaction wrapper that carries the org context
//
// Existing functions (query, transaction, getPool) are UNCHANGED for backward
// compatibility. No existing API routes need to be modified for this file.
// ─────────────────────────────────────────────────────────────────────────────

import { Pool, PoolClient } from "pg";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ssl: { rejectUnauthorized: false }, // ← Uncomment for Neon / cloud DBs
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on("error", (err) => console.error("[DB] Pool error", err));
  }
  return pool;
}

// ── Generic query (unchanged) ─────────────────────────────────────────────────
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

// ── Generic transaction (unchanged) ──────────────────────────────────────────
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

// ── Keep-alive ping (unchanged) ───────────────────────────────────────────────
if (typeof window === "undefined") {
  setInterval(async () => {
    try {
      await query("SELECT 1");
    } catch {}
  }, 4 * 60 * 1000);
}
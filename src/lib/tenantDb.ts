// src/lib/tenantDb.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tenant-Scoped Database Abstraction Layer
// 
// This file is the ONLY approved database access mechanism for tenant-facing 
// API routes. It guarantees that the `organization_id` is always passed as the 
// first parameter ($1) to all queries, making it structurally impossible to 
// write a cross-tenant query by accident.
// ─────────────────────────────────────────────────────────────────────────────

import { PoolClient } from "pg";
import { getPool } from "./db";

// ── Tenant-scoped query ───────────────────────────────────────────────────────
/**
 * Runs a SQL query that is pre-scoped to a single tenant organization.
 *
 * The organization_id is ALWAYS injected as $1. Your SQL must reference
 * `organization_id = $1` as a condition, and any additional params
 * start at $2.
 *
 * @example
 * const leads = await tenantQuery(
 *   session.organizationId,
 *   `SELECT * FROM leads WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
 *   [limit, offset]
 * );
 */
export async function tenantQuery<T = any>(
  organizationId: string,
  text: string,
  params: any[] = []
): Promise<T[]> {
  if (!organizationId) {
    throw new Error(
      "[tenantQuery] organizationId is required. Did you forget to include it in the session?"
    );
  }

  const client = await getPool().connect();
  try {
    const result = await client.query(text, [organizationId, ...params]);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

// ── Tenant-scoped transaction ─────────────────────────────────────────────────
/**
 * Wraps multiple operations in a single transaction. The organizationId is 
 * provided once and passed through to the callback.
 *
 * @example
 * await tenantTransaction(session.organizationId, async (client, orgId) => {
 *   await client.query(`INSERT INTO leads (organization_id, name) VALUES ($1, $2)`, [orgId, leadName]);
 *   await client.query(`UPDATE upload_batches SET row_count = row_count + 1 WHERE id = $1 AND organization_id = $2`, [batchId, orgId]);
 * });
 */
export async function tenantTransaction<T>(
  organizationId: string,
  fn: (client: PoolClient, organizationId: string) => Promise<T>
): Promise<T> {
  if (!organizationId) {
    throw new Error("[tenantTransaction] organizationId is required.");
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client, organizationId);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

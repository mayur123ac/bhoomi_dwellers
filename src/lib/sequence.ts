import { query } from "./db";

/**
 * Enterprise Sequence Generator
 * Safely generates sequential numbers for a specific tenant and entity type.
 * Uses atomic Postgres ON CONFLICT DO UPDATE to guarantee race-condition safety.
 *
 * @param organizationId The UUID of the tenant
 * @param entityType The sequence category (e.g., 'lead', 'invoice')
 * @param count Number of sequences needed (defaults to 1). Useful for bulk inserts.
 * @returns Array of sequence numbers
 */
export async function getNextSequence(
  organizationId: string,
  entityType: string,
  count: number = 1
): Promise<number[]> {
  if (count <= 0) return [];

  // Atomic insert/update that reserves a block of 'count' numbers and returns the starting number
  const sql = `
    INSERT INTO tenant_sequences (organization_id, entity_type, next_value)
    VALUES ($1, $2, $3 + 1)
    ON CONFLICT (organization_id, entity_type)
    DO UPDATE SET next_value = tenant_sequences.next_value + $3
    RETURNING next_value - $3 AS start_value;
  `;

  const rows = await query(sql, [organizationId, entityType, count]) as any[];
  if (!rows || rows.length === 0) {
    throw new Error(`Failed to generate sequence for ${entityType}`);
  }

  const startValue = parseInt(rows[0].start_value, 10);
  
  // Return an array of the reserved numbers
  return Array.from({ length: count }, (_, i) => startValue + i);
}

import { query } from "./db";

export interface CrmUpdate {
  id: number;
  version: string;
  title: string;
  description: string | null;
  category: string | null;
  features: string[] | any;
  is_important: boolean;
  created_by: string | null;
  created_at: Date;
}

export async function createCrmUpdate(data: {
  version: string;
  title: string;
  description?: string;
  category?: string;
  features?: any;
  is_important?: boolean;
  created_by?: string;
  organizationId: string;
}) {
  const sql = `
    INSERT INTO crm_updates 
      (version, title, description, category, features, is_important, created_by, organization_id)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const params = [
    data.version,
    data.title,
    data.description || null,
    data.category || null,
    data.features ? JSON.stringify(data.features) : null,
    data.is_important || false,
    data.created_by || null,
    data.organizationId,
  ];

  const result = await query<CrmUpdate>(sql, params);
  return result[0];
}

export async function getCrmUpdates(organizationId: string) {
  const sql = `
    SELECT * FROM crm_updates 
    WHERE organization_id = $1
    ORDER BY created_at DESC;
  `;
  return await query<CrmUpdate>(sql, [organizationId]);
}

export async function markUpdateAsRead(userId: number, updateId: number, organizationId: string) {
  // We double check the update actually belongs to this org before marking it read
  const check = await query(`SELECT id FROM crm_updates WHERE id = $1 AND organization_id = $2`, [updateId, organizationId]);
  if (check.length === 0) return false;

  const sql = `
    INSERT INTO crm_update_reads (user_id, update_id, organization_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, update_id) DO NOTHING
    RETURNING *;
  `;
  await query(sql, [userId, updateId, organizationId]);
  return true;
}

export async function getUpdatesWithReadStatus(userId: number, organizationId: string) {
  const sql = `
    SELECT 
      u.*,
      CASE WHEN r.read_at IS NOT NULL THEN true ELSE false END as has_read
    FROM crm_updates u
    LEFT JOIN crm_update_reads r 
      ON u.id = r.update_id AND r.user_id = $1
    WHERE u.organization_id = $2
    ORDER BY u.created_at DESC;
  `;
  
  return await query<CrmUpdate & { has_read: boolean }>(sql, [userId, organizationId]);
}

export async function updateCrmUpdate(id: number, data: {
  version: string;
  title: string;
  description?: string;
  category?: string;
  features?: any;
  is_important?: boolean;
  organizationId: string;
}) {
  const sql = `
    UPDATE crm_updates 
    SET 
      version = $1, 
      title = $2, 
      description = $3, 
      category = $4, 
      features = $5, 
      is_important = $6
    WHERE id = $7 AND organization_id = $8
    RETURNING *;
  `;

  const params = [
    data.version,
    data.title,
    data.description || null,
    data.category || null,
    data.features ? JSON.stringify(data.features) : null,
    data.is_important || false,
    id,
    data.organizationId,
  ];

  const result = await query<CrmUpdate>(sql, params);
  return result[0];
}

export async function deleteCrmUpdate(id: number, organizationId: string) {
  const sql = `DELETE FROM crm_updates WHERE id = $1 AND organization_id = $2 RETURNING id;`;
  const result = await query<{ id: number }>(sql, [id, organizationId]);
  return result.length > 0;
}

import { tenantQuery, tenantTransaction } from '../tenantDb';

export type LeadFilters = {
  stage?: string;
  source?: string;
  assignedExecutiveId?: number;
  project?: string;
  leadTemperature?: string;
  limit?: number;
  offset?: number;
};

export const leadRepository = {
  async getLeads(organizationId: string, filters: LeadFilters = {}) {
    let query = `
      SELECT l.*, 
             u.name as assigned_executive_name, 
             m.name as assigned_manager_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_executive_id = u.id
      LEFT JOIN users m ON l.assigned_manager_id = m.id
      WHERE l.organization_id = $1
    `;
    const params: any[] = [];
    let paramIndex = 2;

    if (filters.stage) {
      query += ` AND l.current_stage = $${paramIndex++}`;
      params.push(filters.stage);
    }
    if (filters.source) {
      query += ` AND l.source = $${paramIndex++}`;
      params.push(filters.source);
    }
    if (filters.assignedExecutiveId) {
      query += ` AND l.assigned_executive_id = $${paramIndex++}`;
      params.push(filters.assignedExecutiveId);
    }
    if (filters.project) {
      query += ` AND l.project_interested = $${paramIndex++}`;
      params.push(filters.project);
    }
    if (filters.leadTemperature) {
      query += ` AND l.lead_temperature = $${paramIndex++}`;
      params.push(filters.leadTemperature);
    }

    query += ` ORDER BY l.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }
    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    return await tenantQuery(organizationId, query, params);
  },

  async getLeadById(organizationId: string, leadId: number) {
    const query = `
      SELECT l.*, 
             u.name as assigned_executive_name, 
             m.name as assigned_manager_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_executive_id = u.id
      LEFT JOIN users m ON l.assigned_manager_id = m.id
      WHERE l.organization_id = $1 AND l.id = $2
    `;
    const leads = await tenantQuery(organizationId, query, [leadId]);
    return leads[0] || null;
  },

  async updateLeadStage(organizationId: string, leadId: number, newStage: string, probability: number) {
    const query = `
      UPDATE leads
      SET previous_stage = current_stage,
          current_stage = $2,
          conversion_probability = $3,
          updated_at = NOW()
      WHERE organization_id = $1 AND id = $4
      RETURNING *
    `;
    const result = await tenantQuery(organizationId, query, [newStage, probability, leadId]);
    return result[0];
  },

  async updateLeadAssignment(organizationId: string, leadId: number, executiveId: number | null, managerId: number | null) {
    const query = `
      UPDATE leads
      SET assigned_executive_id = $2,
          assigned_manager_id = $3,
          updated_at = NOW()
      WHERE organization_id = $1 AND id = $4
      RETURNING *
    `;
    const result = await tenantQuery(organizationId, query, [executiveId, managerId, leadId]);
    return result[0];
  },

  async logStageChange(params: {
    leadId: number;
    organizationId: string;
    oldStage: string | null;
    newStage: string;
    changedBy?: number;
  }) {
    const text = `
      INSERT INTO lead_stage_history (lead_id, old_stage, new_stage, changed_by, organization_id)
      VALUES ($2, $3, $4, $5, $1)
    `;
    await tenantQuery(params.organizationId, text, [
      params.leadId,
      params.oldStage,
      params.newStage,
      params.changedBy || null
    ]);
  },

  async logAssignment(params: {
    leadId: number;
    organizationId: string;
    previousOwnerId: number | null;
    newOwnerId: number | null;
    reason?: string;
    assignedBy?: number;
  }) {
    const text = `
      INSERT INTO lead_assignments (lead_id, previous_owner_id, new_owner_id, reason, assigned_by, organization_id)
      VALUES ($2, $3, $4, $5, $6, $1)
    `;
    await tenantQuery(params.organizationId, text, [
      params.leadId,
      params.previousOwnerId,
      params.newOwnerId,
      params.reason || null,
      params.assignedBy || null
    ]);
  }
};

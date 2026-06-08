import { tenantQuery } from '../tenantDb';

export type ActivityPayload = {
  leadId: number;
  organizationId: string;
  eventType: string;
  userId?: number | null;
  metadata?: any;
};

export const activityService = {
  /**
   * Logs an activity to the global timeline
   */
  async logActivity(payload: ActivityPayload) {
    const text = `
      INSERT INTO activities (lead_id, event_type, user_id, metadata, organization_id)
      VALUES ($2, $3, $4, $5, $1)
      RETURNING *
    `;
    const params = [
      payload.leadId,
      payload.eventType,
      payload.userId || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    ];
    
    const result = await tenantQuery(payload.organizationId, text, params);
    return result[0];
  },

  /**
   * Retrieves the activity timeline for a lead
   */
  async getLeadTimeline(organizationId: string, leadId: number) {
    const text = `
      SELECT a.*, u.name as user_name
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.organization_id = $1 AND a.lead_id = $2
      ORDER BY a.created_at DESC
    `;
    return await tenantQuery(organizationId, text, [leadId]);
  }
};

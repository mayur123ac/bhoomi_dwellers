import { query } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export interface AIUsageLog {
  organizationId: string;
  userId?: string;
  feature: string;
  tokensUsed: number;
  modelUsed: string;
  metadata?: any;
}

/**
 * Checks if a tenant has enough AI credits to perform an action.
 */
export async function checkAiQuota(organizationId: string): Promise<boolean> {
  const result = await query(
    `SELECT ai_credits, ai_credits_used FROM organizations WHERE id = $1 AND status = 'active'`,
    [organizationId]
  );

  if (result.length === 0) {
    throw new NotFoundError("Organization not found or inactive");
  }

  const { ai_credits, ai_credits_used } = result[0];
  
  // If ai_credits is null, it might mean unlimited, but let's assume a hard limit for now
  if (ai_credits !== null && parseInt(ai_credits_used) >= parseInt(ai_credits)) {
    throw new ForbiddenError("AI token quota exceeded for this billing cycle");
  }

  return true;
}

/**
 * Logs AI usage and increments the tenant's used credits.
 */
export async function logAiUsage(log: AIUsageLog): Promise<void> {
  const { organizationId, userId, feature, tokensUsed, modelUsed, metadata } = log;

  // Run in a transaction to ensure consistency
  await query('BEGIN');
  try {
    // 1. Insert detailed log
    await query(
      `INSERT INTO ai_usage_logs (organization_id, user_id, feature, tokens_used, model_used, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [organizationId, userId || null, feature, tokensUsed, modelUsed, metadata ? JSON.stringify(metadata) : null]
    );

    // 2. Increment organization usage counter
    await query(
      `UPDATE organizations 
       SET ai_credits_used = ai_credits_used + $1
       WHERE id = $2`,
      [tokensUsed, organizationId]
    );

    await query('COMMIT');
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to log AI usage:', error);
    // We don't necessarily throw here to avoid failing the user request 
    // just because logging failed, but we log it internally.
  }
}

import { activityService } from '../services/activityService';
import { leadRepository } from '../repositories/leadRepository';

export type LeadEventPayload = {
  leadId: number;
  organizationId: string;
  userId?: number;
  metadata?: any;
};

export type StageChangedPayload = LeadEventPayload & {
  oldStage: string | null;
  newStage: string;
};

export type AssignedPayload = LeadEventPayload & {
  previousOwnerId: number | null;
  newOwnerId: number | null;
  reason?: string;
};

class LeadEventEmitter {
  async emitLeadCreated(payload: LeadEventPayload) {
    // Log activity
    await activityService.logActivity({
      leadId: payload.leadId,
      organizationId: payload.organizationId,
      userId: payload.userId,
      eventType: 'Lead Created',
      metadata: payload.metadata,
    });
  }

  async emitStageChanged(payload: StageChangedPayload) {
    // 1. Log to lead_stage_history
    await leadRepository.logStageChange({
      leadId: payload.leadId,
      organizationId: payload.organizationId,
      oldStage: payload.oldStage,
      newStage: payload.newStage,
      changedBy: payload.userId,
    });

    // 2. Log activity
    await activityService.logActivity({
      leadId: payload.leadId,
      organizationId: payload.organizationId,
      userId: payload.userId,
      eventType: 'Stage Changed',
      metadata: {
        oldStage: payload.oldStage,
        newStage: payload.newStage,
        ...payload.metadata,
      },
    });
  }

  async emitAssigned(payload: AssignedPayload) {
    // 1. Log assignment
    await leadRepository.logAssignment({
      leadId: payload.leadId,
      organizationId: payload.organizationId,
      previousOwnerId: payload.previousOwnerId,
      newOwnerId: payload.newOwnerId,
      reason: payload.reason,
      assignedBy: payload.userId,
    });

    // 2. Log activity
    await activityService.logActivity({
      leadId: payload.leadId,
      organizationId: payload.organizationId,
      userId: payload.userId,
      eventType: 'Lead Assigned',
      metadata: {
        previousOwnerId: payload.previousOwnerId,
        newOwnerId: payload.newOwnerId,
        reason: payload.reason,
        ...payload.metadata,
      },
    });
  }
}

export const leadEvents = new LeadEventEmitter();

import { leadRepository } from '../repositories/leadRepository';
import { leadEvents } from '../events/leadEvents';

export const leadAssignmentService = {
  async assignLead(params: {
    leadId: number;
    organizationId: string;
    executiveId: number | null;
    managerId: number | null;
    reason?: string;
    assignedBy: number;
  }) {
    const lead = await leadRepository.getLeadById(params.organizationId, params.leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const previousOwnerId = lead.assigned_executive_id;

    // Update in DB
    const updatedLead = await leadRepository.updateLeadAssignment(
      params.organizationId,
      params.leadId,
      params.executiveId,
      params.managerId
    );

    // Dispatch event
    await leadEvents.emitAssigned({
      leadId: params.leadId,
      organizationId: params.organizationId,
      userId: params.assignedBy,
      previousOwnerId: previousOwnerId,
      newOwnerId: params.executiveId,
      reason: params.reason
    });

    return updatedLead;
  }
};

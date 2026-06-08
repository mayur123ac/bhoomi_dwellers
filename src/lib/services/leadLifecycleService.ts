import { leadRepository } from '../repositories/leadRepository';
import { leadEvents } from '../events/leadEvents';

export const PIPELINE_STAGES = [
  'New Lead',
  'Contacted',
  'Interested',
  'Site Visit Scheduled',
  'Site Visit Done',
  'Negotiation',
  'Booked',
  'Lost / Inactive'
];

export const leadLifecycleService = {
  getProbabilityForStage(stage: string): number {
    const probabilities: Record<string, number> = {
      'New Lead': 10,
      'Contacted': 20,
      'Interested': 40,
      'Site Visit Scheduled': 50,
      'Site Visit Done': 70,
      'Negotiation': 85,
      'Booked': 100,
      'Lost / Inactive': 0
    };
    return probabilities[stage] || 0;
  },

  async changeStage(params: {
    leadId: number;
    organizationId: string;
    newStage: string;
    userId: number;
  }) {
    if (!PIPELINE_STAGES.includes(params.newStage)) {
      throw new Error(`Invalid stage: ${params.newStage}`);
    }

    const lead = await leadRepository.getLeadById(params.organizationId, params.leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    if (lead.current_stage === params.newStage) {
      return lead; // No change needed
    }

    const oldStage = lead.current_stage;
    const probability = this.getProbabilityForStage(params.newStage);

    // Update in DB
    const updatedLead = await leadRepository.updateLeadStage(
      params.organizationId,
      params.leadId,
      params.newStage,
      probability
    );

    // Dispatch event
    await leadEvents.emitStageChanged({
      leadId: params.leadId,
      organizationId: params.organizationId,
      userId: params.userId,
      oldStage: oldStage,
      newStage: params.newStage
    });

    return updatedLead;
  }
};

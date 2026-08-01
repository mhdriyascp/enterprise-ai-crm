// =============================================================================
// Opportunity Service — Domain enums.
// =============================================================================

export const OPPORTUNITY_STAGES = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

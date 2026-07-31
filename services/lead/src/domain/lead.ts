// =============================================================================
// Lead Service — Domain enums.
// =============================================================================

export const LEAD_SOURCES = [
  'website',
  'referral',
  'social',
  'email',
  'cold_call',
  'event',
  'partner',
  'other',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'unqualified',
  'converted',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// =============================================================================
// Contact Service — Domain enums.
// =============================================================================

export const CONTACT_STATUSES = ['active', 'inactive'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

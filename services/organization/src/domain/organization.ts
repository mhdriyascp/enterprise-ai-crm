// =============================================================================
// Organization Service — Domain enums.
// =============================================================================

export const COMPANY_SIZES = ['solo', 'small', 'medium', 'large', 'enterprise'] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const ORGANIZATION_STATUSES = ['active', 'inactive', 'archived'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

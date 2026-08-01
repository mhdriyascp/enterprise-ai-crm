// =============================================================================
// Customer Service — Domain enums and constants.
// These mirror the shared @crm/types Customer definition and the Prisma enums,
// providing a single source of truth for validation.
// =============================================================================

export const CUSTOMER_STATUSES = ['active', 'inactive', 'prospect', 'churned'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const COMPANY_SIZES = ['solo', 'small', 'medium', 'large', 'enterprise'] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

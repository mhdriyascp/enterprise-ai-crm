// =============================================================================
// Integration Service — Domain enums and constants.
// These mirror the Prisma enums, providing a single source of truth for
// validation.
// =============================================================================

export const INTEGRATION_PROVIDERS = [
  'slack',
  'google_workspace',
  'microsoft365',
  'stripe',
  'hubspot',
  'salesforce',
  'zapier',
  'webhook',
] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const INTEGRATION_STATUSES = ['connected', 'disconnected', 'error'] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const INTEGRATION_EVENT_TYPES = [
  'connected',
  'disconnected',
  'test',
  'sync',
  'webhook',
] as const;
export type IntegrationEventType = (typeof INTEGRATION_EVENT_TYPES)[number];

export const INTEGRATION_EVENT_STATUSES = ['success', 'failure'] as const;
export type IntegrationEventStatus = (typeof INTEGRATION_EVENT_STATUSES)[number];

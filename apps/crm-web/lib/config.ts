// =============================================================================
// Runtime configuration for the CRM web application. All values are safe to
// expose to the browser and mirror the docker-compose / gateway topology.
// =============================================================================

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
  keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'crm',
  keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'crm-web',
};

// Opportunity pipeline stages rendered on the Kanban board. Order defines the
// left-to-right column order.
export const PIPELINE_STAGES = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

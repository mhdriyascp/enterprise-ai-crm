// =============================================================================
// Static registry of the platform services surfaced by the admin portal.
// Ports mirror docker-compose / the root README service table.
// =============================================================================

export interface ServiceDescriptor {
  key: string;
  name: string;
  description: string;
  port: number;
}

export const SERVICES: ServiceDescriptor[] = [
  { key: 'identity', name: 'Identity', description: 'Auth, RBAC, tenants, API keys', port: 3100 },
  { key: 'customer', name: 'Customer', description: 'Customer management', port: 3101 },
  { key: 'lead', name: 'Lead', description: 'Lead tracking & qualification', port: 3102 },
  { key: 'opportunity', name: 'Opportunity', description: 'Sales pipeline', port: 3103 },
  { key: 'organization', name: 'Organization', description: 'Organizations & accounts', port: 3104 },
  { key: 'contact', name: 'Contact', description: 'Contact management', port: 3105 },
  { key: 'workflow', name: 'Workflow', description: 'Process automation & approvals', port: 3110 },
  { key: 'ai-platform', name: 'AI Platform', description: 'AI agents & RAG', port: 3200 },
  { key: 'integration', name: 'Integration', description: 'Third-party adapters', port: 3201 },
];

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
  keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'crm',
  keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'crm-admin-web',
};

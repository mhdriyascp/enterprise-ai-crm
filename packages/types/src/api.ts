// =============================================================================
// API Types
// =============================================================================

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  uptime: number;
  checks?: {
    database?: 'ok' | 'error';
    redis?: 'ok' | 'error';
    kafka?: 'ok' | 'error';
  };
}

export interface RequestContext {
  requestId: string;
  tenantId: string;
  userId?: string;
  roles: string[];
  permissions: string[];
}

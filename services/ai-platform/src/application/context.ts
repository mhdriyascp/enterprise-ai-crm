// Shared request context for the AI Platform — every operation is tenant-scoped.
export interface AiContext {
  tenantId: string;
  userId?: string;
  correlationId?: string;
}

import type { AgentName, AgentRequest, AgentResponse, EmbeddingRequest, EmbeddingResponse } from '@crm/types';

// =============================================================================
// @crm/ai-sdk — AI Platform Client
// Thin HTTP client for calling the AI Platform service from other services.
// =============================================================================

export interface AiPlatformOptions {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export class AiPlatformClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(options: AiPlatformOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? 60000;
  }

  /**
   * Invoke an AI agent with a task and context.
   */
  async invokeAgent(
    agentName: AgentName,
    request: AgentRequest,
    context: { tenantId: string; userId?: string },
  ): Promise<AgentResponse> {
    return this.request<AgentResponse>('POST', `/ai/agents/${agentName}`, {
      body: request,
      headers: {
        'X-Tenant-ID': context.tenantId,
        ...(context.userId ? { 'X-User-ID': context.userId } : {}),
      },
    });
  }

  /**
   * Generate embeddings for text.
   */
  async embed(
    request: EmbeddingRequest,
    context: { tenantId: string },
  ): Promise<EmbeddingResponse> {
    return this.request<EmbeddingResponse>('POST', '/ai/embed', {
      body: request,
      headers: { 'X-Tenant-ID': context.tenantId },
    });
  }

  private async request<T>(
    method: string,
    path: string,
    options: { body?: unknown; headers?: Record<string, string> } = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const data = await response.json() as { error?: { message: string } } & T;

      if (!response.ok) {
        throw new Error(
          (data as { error?: { message: string } }).error?.message ?? `HTTP ${response.status}`,
        );
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export type { AgentName, AgentRequest, AgentResponse, EmbeddingRequest, EmbeddingResponse };

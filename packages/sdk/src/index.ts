import type {
  ApiResponse,
  PaginatedResult,
  Customer,
  Lead,
  Opportunity,
  PaginationParams,
} from '@crm/types';

// =============================================================================
// @crm/sdk — Enterprise AI CRM Platform SDK
// =============================================================================

export interface CrmSdkOptions {
  baseUrl: string;
  apiKey?: string;
  tenantId: string;
  timeout?: number;
}

export class CrmClient {
  private readonly baseUrl: string;
  private readonly tenantId: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  public readonly customers: CustomerClient;
  public readonly leads: LeadClient;
  public readonly opportunities: OpportunityClient;

  constructor(options: CrmSdkOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.tenantId = options.tenantId;
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? 30000;

    this.customers = new CustomerClient(this);
    this.leads = new LeadClient(this);
    this.opportunities = new OpportunityClient(this);
  }

  async request<T>(
    method: string,
    path: string,
    options: { body?: unknown; params?: Record<string, string | number> } = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': this.tenantId,
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
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

// ---------------------------------------------------------------------------
// Customer Client
// ---------------------------------------------------------------------------
class CustomerClient {
  constructor(private readonly client: CrmClient) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Customer>> {
    const result = await this.client.request<PaginatedResult<Customer>>('GET', '/customers', {
      params: params as Record<string, string | number>,
    });
    return result;
  }

  async get(id: string): Promise<ApiResponse<Customer>> {
    return this.client.request<ApiResponse<Customer>>('GET', `/customers/${id}`);
  }

  async create(data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return this.client.request<ApiResponse<Customer>>('POST', '/customers', { body: data });
  }

  async update(id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return this.client.request<ApiResponse<Customer>>('PATCH', `/customers/${id}`, { body: data });
  }

  async delete(id: string): Promise<void> {
    await this.client.request<void>('DELETE', `/customers/${id}`);
  }
}

// ---------------------------------------------------------------------------
// Lead Client
// ---------------------------------------------------------------------------
class LeadClient {
  constructor(private readonly client: CrmClient) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Lead>> {
    return this.client.request<PaginatedResult<Lead>>('GET', '/leads', {
      params: params as Record<string, string | number>,
    });
  }

  async get(id: string): Promise<ApiResponse<Lead>> {
    return this.client.request<ApiResponse<Lead>>('GET', `/leads/${id}`);
  }

  async create(data: Partial<Lead>): Promise<ApiResponse<Lead>> {
    return this.client.request<ApiResponse<Lead>>('POST', '/leads', { body: data });
  }
}

// ---------------------------------------------------------------------------
// Opportunity Client
// ---------------------------------------------------------------------------
class OpportunityClient {
  constructor(private readonly client: CrmClient) {}

  async list(params?: PaginationParams): Promise<PaginatedResult<Opportunity>> {
    return this.client.request<PaginatedResult<Opportunity>>('GET', '/opportunities', {
      params: params as Record<string, string | number>,
    });
  }

  async get(id: string): Promise<ApiResponse<Opportunity>> {
    return this.client.request<ApiResponse<Opportunity>>('GET', `/opportunities/${id}`);
  }

  async create(data: Partial<Opportunity>): Promise<ApiResponse<Opportunity>> {
    return this.client.request<ApiResponse<Opportunity>>('POST', '/opportunities', { body: data });
  }
}

export { CrmClient as default };
export type { Customer, Lead, Opportunity, PaginationParams, ApiResponse, PaginatedResult };

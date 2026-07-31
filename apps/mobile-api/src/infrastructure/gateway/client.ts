import { AppError } from '@crm/common';

// =============================================================================
// Upstream gateway client.
//
// A thin wrapper around fetch that forwards the caller's bearer token to the
// Kong gateway and normalises the standard `{ data, meta }` envelope. Used by
// the mobile BFF to aggregate data from multiple domain services.
// =============================================================================

export interface GatewayEnvelope<T> {
  data: T;
  meta?: {
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };
}

export class UpstreamError extends AppError {
  constructor(status: number, message: string) {
    super(message, 'UPSTREAM_ERROR', status >= 400 && status < 500 ? status : 502);
  }
}

export interface GatewayClientOptions {
  baseUrl: string;
  timeoutMs: number;
}

export class GatewayClient {
  constructor(private readonly options: GatewayClientOptions) {}

  async get<T>(path: string, token: string, query?: Record<string, string | number>): Promise<T> {
    const url = new URL(path, this.options.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new UpstreamError(response.status, `Upstream ${path} returned ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof UpstreamError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new UpstreamError(504, `Upstream ${path} timed out`);
      }
      throw new UpstreamError(502, `Upstream ${path} is unreachable`);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Best-effort GET that resolves to a fallback value if the upstream fails. */
  async getOr<T>(
    path: string,
    token: string,
    fallback: T,
    query?: Record<string, string | number>,
  ): Promise<T> {
    try {
      return await this.get<T>(path, token, query);
    } catch {
      return fallback;
    }
  }
}

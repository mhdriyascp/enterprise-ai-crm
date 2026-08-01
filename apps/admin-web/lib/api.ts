import { config } from './config';
import { useAuthStore } from '@/store/auth';

// =============================================================================
// Minimal typed API client for the CRM gateway (Kong). Attaches the current
// bearer token and normalises the standard `{ data, meta }` envelope used by
// the backend services.
// =============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly apiError: ApiError,
  ) {
    super(apiError.message);
    this.name = 'ApiRequestError';
  }
}

export interface Paginated<T> {
  data: T[];
  meta: {
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${config.apiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: 'no-store',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: ApiError })
    | null;

  if (!response.ok) {
    const error = payload?.error ?? { code: 'UNKNOWN', message: response.statusText };
    throw new ApiRequestError(response.status, error);
  }

  return payload as T;
}

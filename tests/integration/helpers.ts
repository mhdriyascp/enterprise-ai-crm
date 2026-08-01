/**
 * Small helpers shared by the integration suite. These target the API gateway
 * so tests exercise the same routing, auth and rate-limiting real clients hit.
 */
const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:8000';

export interface ApiResponse<T> {
  status: number;
  body: T;
}

export async function apiGet<T = unknown>(
  path: string,
  token?: string,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token) {
    headers.authorization = 'Bearer ' + token;
  }
  const res = await fetch(GATEWAY_URL + path, { headers });
  const body = (await res.json().catch(() => null)) as T;
  return { status: res.status, body };
}

/** Returns true when the gateway is reachable, used to skip when the stack is down. */
export async function gatewayReachable(): Promise<boolean> {
  try {
    const res = await fetch(GATEWAY_URL + '/health');
    return res.ok;
  } catch {
    return false;
  }
}

export { GATEWAY_URL };

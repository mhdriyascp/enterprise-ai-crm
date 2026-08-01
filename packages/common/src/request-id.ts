// =============================================================================
// Request ID Propagation
// =============================================================================
//
// Utilities for generating and propagating a correlation/request identifier
// across service boundaries. The same header value is threaded through logs and
// downstream HTTP calls so a single request can be traced end-to-end.

import { randomUUID } from 'node:crypto';

/** Canonical header name used to carry the request/correlation id. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Generates a new request id (RFC 4122 v4 UUID). */
export function generateRequestId(): string {
  return randomUUID();
}

type HeaderValue = string | string[] | undefined;

/**
 * Extracts a request id from an incoming set of headers, falling back to a
 * freshly generated id when none is present. Header lookup is case-insensitive
 * and array-valued headers use their first element.
 */
export function getRequestId(
  headers: Record<string, HeaderValue> | undefined,
  headerName: string = REQUEST_ID_HEADER,
): string {
  const existing = readHeader(headers, headerName);
  if (existing && existing.trim().length > 0) {
    return existing;
  }
  return generateRequestId();
}

/**
 * Returns a headers object suitable for a downstream request that propagates
 * the given request id under {@link REQUEST_ID_HEADER}.
 */
export function withRequestId(
  requestId: string,
  headers: Record<string, string> = {},
  headerName: string = REQUEST_ID_HEADER,
): Record<string, string> {
  return { ...headers, [headerName]: requestId };
}

function readHeader(
  headers: Record<string, HeaderValue> | undefined,
  headerName: string,
): string | undefined {
  if (!headers) {
    return undefined;
  }
  const target = headerName.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      return Array.isArray(value) ? value[0] : value;
    }
  }
  return undefined;
}

import { describe, expect, it } from 'vitest';

import {
  REQUEST_ID_HEADER,
  generateRequestId,
  getRequestId,
  withRequestId,
} from '../../src/request-id';

describe('request-id', () => {
  it('generates unique v4-style ids', () => {
    const a = generateRequestId();
    const b = generateRequestId();
    expect(a).not.toBe(b);
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('reuses an existing request id regardless of header casing', () => {
    const id = getRequestId({ 'X-Request-ID': 'abc-123' });
    expect(id).toBe('abc-123');
  });

  it('uses the first value when the header is array-valued', () => {
    const id = getRequestId({ [REQUEST_ID_HEADER]: ['first', 'second'] });
    expect(id).toBe('first');
  });

  it('generates a new id when the header is missing or blank', () => {
    expect(getRequestId(undefined)).toMatch(/[0-9a-f-]{36}/);
    expect(getRequestId({ [REQUEST_ID_HEADER]: '   ' })).toMatch(/[0-9a-f-]{36}/);
  });

  it('propagates the id onto downstream headers', () => {
    const headers = withRequestId('req-1', { authorization: 'keep-me' });
    expect(headers[REQUEST_ID_HEADER]).toBe('req-1');
    expect(headers.authorization).toBe('keep-me');
  });
});

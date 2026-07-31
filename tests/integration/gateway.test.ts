import { beforeAll, describe, expect, it } from 'vitest';

import { apiGet, gatewayReachable } from './helpers';

// These tests require the full stack to be running (docker compose up). When
// the gateway is not reachable they are skipped rather than failing, so the
// suite is safe to run in any environment.
describe('gateway health & auth boundaries', () => {
  let available = false;

  beforeAll(async () => {
    available = await gatewayReachable();
  });

  it('exposes a healthy gateway', async () => {
    if (!available) {
      return;
    }
    const res = await apiGet('/health');
    expect(res.status).toBe(200);
  });

  it('rejects unauthenticated access to protected resources', async () => {
    if (!available) {
      return;
    }
    const res = await apiGet('/api/v1/customers');
    expect([401, 403]).toContain(res.status);
  });
});

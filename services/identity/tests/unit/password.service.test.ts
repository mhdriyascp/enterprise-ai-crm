import { describe, expect, it } from 'vitest';

import { PasswordService } from '../../src/application/services/password.service';

describe('PasswordService', () => {
  // Use a low cost factor to keep the test fast.
  const service = new PasswordService(10);

  it('hashes a password to a non-plaintext value', async () => {
    const hash = await service.hash('Sup3rSecret!');
    expect(hash).not.toBe('Sup3rSecret!');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('verifies a correct password', async () => {
    const hash = await service.hash('Sup3rSecret!');
    expect(await service.verify('Sup3rSecret!', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hash('Sup3rSecret!');
    expect(await service.verify('wrong', hash)).toBe(false);
  });
});

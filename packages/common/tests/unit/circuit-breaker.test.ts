import { describe, expect, it } from 'vitest';

import { CircuitBreaker, CircuitOpenError } from '../../src/circuit-breaker';

function fail(): Promise<never> {
  return Promise.reject(new Error('boom'));
}

function ok(): Promise<string> {
  return Promise.resolve('ok');
}

describe('CircuitBreaker', () => {
  it('starts closed and passes through successful calls', async () => {
    const breaker = new CircuitBreaker();
    await expect(breaker.execute(ok)).resolves.toBe('ok');
    expect(breaker.getState()).toBe('closed');
  });

  it('opens after the failure threshold and rejects further calls', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3 });

    for (let i = 0; i < 3; i += 1) {
      await expect(breaker.execute(fail)).rejects.toThrow('boom');
    }

    expect(breaker.getState()).toBe('open');
    await expect(breaker.execute(ok)).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it('transitions to half-open after the reset timeout and closes on success', async () => {
    let clock = 1000;
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 5000,
      successThreshold: 1,
      now: () => clock,
    });

    await expect(breaker.execute(fail)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('open');

    // Before cooldown elapses it remains open.
    clock = 4000;
    expect(breaker.getState()).toBe('open');

    // After cooldown it becomes half-open and a success closes it.
    clock = 6001;
    expect(breaker.getState()).toBe('half-open');
    await expect(breaker.execute(ok)).resolves.toBe('ok');
    expect(breaker.getState()).toBe('closed');
  });

  it('re-opens when the half-open probe fails', async () => {
    let clock = 0;
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 1000,
      now: () => clock,
    });

    await expect(breaker.execute(fail)).rejects.toThrow('boom');
    clock = 1001;
    expect(breaker.getState()).toBe('half-open');
    await expect(breaker.execute(fail)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('open');
  });

  it('resets counters via reset()', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2 });
    await expect(breaker.execute(fail)).rejects.toThrow('boom');
    breaker.reset();
    expect(breaker.getState()).toBe('closed');
    await expect(breaker.execute(ok)).resolves.toBe('ok');
  });
});

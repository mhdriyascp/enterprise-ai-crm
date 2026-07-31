// =============================================================================
// Circuit Breaker
// =============================================================================
//
// A lightweight, dependency-free circuit breaker for guarding calls to remote
// services (HTTP, database, message brokers). It prevents a failing dependency
// from being hammered by opening the circuit after a configurable number of
// consecutive failures, then probing for recovery after a cooldown.

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Consecutive failures required to trip the breaker open. Default: 5. */
  failureThreshold?: number;
  /**
   * Time in milliseconds the breaker stays open before allowing a single
   * probe request (transitioning to half-open). Default: 30000.
   */
  resetTimeoutMs?: number;
  /**
   * Number of consecutive successes in the half-open state required to fully
   * close the breaker again. Default: 1.
   */
  successThreshold?: number;
  /** Injectable clock, primarily for testing. Defaults to Date.now. */
  now?: () => number;
}

/**
 * Error thrown when a call is rejected because the circuit is open.
 */
export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly successThreshold: number;
  private readonly now: () => number;

  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptAt = 0;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30_000;
    this.successThreshold = options.successThreshold ?? 1;
    this.now = options.now ?? Date.now;
  }

  /** Current state of the breaker. */
  getState(): CircuitState {
    // Lazily transition from open to half-open once the cooldown has elapsed.
    if (this.state === 'open' && this.now() >= this.nextAttemptAt) {
      this.state = 'half-open';
      this.successCount = 0;
    }
    return this.state;
  }

  /**
   * Executes the provided function through the breaker. Throws
   * {@link CircuitOpenError} without invoking `fn` when the circuit is open.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.getState() === 'open') {
      throw new CircuitOpenError();
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) {
        this.reset();
      }
      return;
    }
    this.failureCount = 0;
  }

  private onFailure(): void {
    this.failureCount += 1;
    if (
      this.state === 'half-open' ||
      this.failureCount >= this.failureThreshold
    ) {
      this.trip();
    }
  }

  private trip(): void {
    this.state = 'open';
    this.successCount = 0;
    this.nextAttemptAt = this.now() + this.resetTimeoutMs;
  }

  /** Forces the breaker back to the closed state and clears counters. */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptAt = 0;
  }
}

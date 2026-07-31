# 16 — Production Hardening

Production-readiness measures introduced in **Phase 24**. This document tracks
the resilience and operability work that closes out the roadmap's technical-debt
items.

## Resilience Utilities (`@crm/common`)

### Circuit Breaker

`CircuitBreaker` guards outbound calls to remote dependencies (HTTP, database,
brokers). It fails fast once a dependency is unhealthy instead of piling up
requests against it.

- **States:** `closed → open → half-open → closed`.
- **Trips open** after `failureThreshold` consecutive failures (default 5).
- **Cools down** for `resetTimeoutMs` (default 30s) before allowing a single
  probe request (half-open).
- **Recovers** after `successThreshold` consecutive probe successes (default 1),
  otherwise re-opens.

```typescript
import { CircuitBreaker, CircuitOpenError } from '@crm/common';

const breaker = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 30_000 });

try {
  const result = await breaker.execute(() => gateway.get('/api/v1/customers'));
} catch (err) {
  if (err instanceof CircuitOpenError) {
    // Fast-fail path: dependency is currently unhealthy.
  }
}
```

Wrap each upstream dependency in its own breaker instance so failures are
isolated per dependency.

### Request-ID Propagation

`@crm/common` exposes helpers to generate and propagate a correlation id across
service boundaries, enabling end-to-end tracing in logs.

- `REQUEST_ID_HEADER` — canonical header name (`x-request-id`).
- `generateRequestId()` — new UUID v4.
- `getRequestId(headers)` — reads an inbound id (case-insensitive) or generates
  one when absent.
- `withRequestId(id, headers)` — returns downstream headers carrying the id.

Each service should read the request id at the edge, attach it to its logger
context, and forward it via `withRequestId` on every outbound call so a single
request can be followed across the whole platform.

## Technical-Debt Closeout

| Item | Status | Notes |
|---|---|---|
| Circuit breakers for inter-service calls | ✅ | `CircuitBreaker` in `@crm/common` |
| Request-ID propagation across services | ✅ | `request-id` helpers in `@crm/common` |
| DB connection-pool monitoring | ⏳ | Metrics documented in `14-monitoring.md`; exporter wiring per-service |
| OpenAPI spec completeness | ⏳ | Tracked per service |
| ≥80% test coverage | ⏳ | Enforced via CI coverage upload; ratcheting up per package |

## Operational Checklist

- [x] Health & readiness probes on every Deployment (see `infrastructure/kubernetes`).
- [x] Resource requests/limits set for all workloads.
- [x] Alerting rules for availability, error rate, latency and saturation.
- [x] Non-root containers in all Dockerfiles.
- [x] Circuit breaking + request correlation utilities available platform-wide.

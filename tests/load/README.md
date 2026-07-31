# Load Tests (k6)

Performance and load tests targeting the API gateway.

## Prerequisites

Install [k6](https://k6.io/docs/get-started/installation/).

## Run

```bash
# Fast smoke test (CI gate)
k6 run tests/load/smoke.js

# Staged load test
GATEWAY_URL=http://localhost:8000 AUTH_TOKEN=<jwt> k6 run tests/load/load.js
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `GATEWAY_URL` | `http://localhost:8000` | Base URL of the API gateway |
| `AUTH_TOKEN` | _(empty)_ | Optional bearer token for authenticated endpoints |

## Thresholds

Both scripts fail the run if error rate or p95 latency exceeds the configured
thresholds, so they can be wired into CI as pass/fail gates.

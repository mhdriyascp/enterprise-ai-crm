# Integration Tests

Cross-service integration tests that exercise the platform through the API
gateway (Kong), verifying routing, authentication boundaries and end-to-end
request flows.

## Prerequisites

The stack running locally:

```bash
docker compose up -d
```

## Run

```bash
pnpm install
pnpm test

# Point at another environment
GATEWAY_URL=https://api.dev.example.com pnpm test
```

Tests automatically **skip** when the gateway is unreachable, so the suite is
safe to execute even without a running stack (useful in constrained CI stages).

This package lives outside the pnpm workspace and manages its own `vitest`
dependency.

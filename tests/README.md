# Cross-Cutting Tests

End-to-end, load, and integration tests that span multiple services and the
frontend applications. These live outside the pnpm workspace so their heavy,
runtime-specific tooling (Playwright browsers, k6) does not affect service
installs.

| Directory | Kind | Tooling | Runs against |
|---|---|---|---|
| `e2e/` | End-to-end UI flows | [Playwright](https://playwright.dev) | Deployed frontends (admin-web, crm-web, public-web) |
| `integration/` | Cross-service API flows | Vitest + fetch | The API gateway (Kong) + services |
| `load/` | Performance / load | [k6](https://k6.io) | The API gateway |
| `unit/` | Reserved for shared cross-cutting unit tests | Vitest | n/a (service unit tests live beside their code) |

See each subdirectory's README for how to run it.

## Quick start

```bash
# End-to-end (requires the stack running via docker compose)
cd tests/e2e && pnpm install && pnpm test

# Integration
cd tests/integration && pnpm install && pnpm test

# Load (requires k6 installed locally)
k6 run tests/load/smoke.js
```

Implemented in **Phase 23** of the development roadmap.

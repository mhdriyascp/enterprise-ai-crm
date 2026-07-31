# End-to-End Tests (Playwright)

Browser-driven end-to-end tests for the CRM frontends.

## Prerequisites

- The application stack running (e.g. `docker compose up -d`), or environment
  variables pointing at deployed URLs.

## Install

```bash
pnpm install
pnpm exec playwright install --with-deps chromium
```

## Run

```bash
# Uses default localhost ports (admin 3000, crm 3002, public 3003)
pnpm test

# Point at other environments
ADMIN_WEB_URL=https://admin.dev.example.com \
CRM_WEB_URL=https://app.dev.example.com \
PUBLIC_WEB_URL=https://www.dev.example.com \
pnpm test
```

## Notes

This package is intentionally **outside** the pnpm workspace so Playwright's
browser downloads do not affect service installs.

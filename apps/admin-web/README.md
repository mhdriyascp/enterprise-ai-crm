# Admin Web Portal

The administrative portal for managing the Enterprise AI CRM platform.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript 5
- TailwindCSS 3
- Shadcn/ui
- React Query 5
- Zustand 4

## Features

- [ ] Authentication (OAuth2 via Keycloak)
- [ ] RBAC-aware navigation
- [ ] Tenant management
- [ ] User management
- [ ] Role and permission management
- [ ] API key management
- [ ] Audit log viewer
- [ ] System settings
- [ ] Service health dashboard

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=crm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=crm-admin-web
```

## Phase

This application will be built in **Phase 15** of the development roadmap.
See [15-roadmap.md](../../docs/15-roadmap.md) for timeline.

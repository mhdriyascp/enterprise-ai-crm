# CRM Web Application

The main CRM application for sales representatives and managers.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript 5
- TailwindCSS 3
- React Query 5
- Zustand 5

## Modules

- [x] Dashboard & KPIs
- [x] Customer Management
- [x] Contact Management
- [x] Lead Pipeline
- [x] Opportunity Board (Kanban)
- [x] Task Manager
- [x] AI Chat Interface
- [ ] Calendar & Scheduling
- [ ] Document Manager
- [ ] Reports & Analytics

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3002](http://localhost:3002)

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=crm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=crm-web
```

## Phase

This application was implemented in **Phase 16** of the development roadmap.
See [15-roadmap.md](../../docs/15-roadmap.md) for timeline.

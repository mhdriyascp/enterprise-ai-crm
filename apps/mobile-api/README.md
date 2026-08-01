# Mobile API

Mobile-optimized REST API (backend-for-frontend) for the Flutter mobile
application. It holds no database of its own; instead it aggregates and slims
down responses from the upstream domain services via the Kong API gateway.

## Features

- [x] JWT authentication optimized for mobile (defence-in-depth re-verification)
- [x] Paginated, bandwidth-efficient responses (small default page size)
- [x] App bootstrap endpoint (profile + counts in one round-trip)
- [x] Delta synchronization support (`/sync?since=`)
- [x] Push notification device registration (FCM / APNs)
- [ ] Binary upload optimization

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/mobile/v1/bootstrap` | Profile + dashboard counts for app startup |
| GET | `/mobile/v1/sync?since=` | Delta sync of customers, tasks, and leads |
| POST | `/mobile/v1/devices` | Register a push device token |
| DELETE | `/mobile/v1/devices/:token` | Unregister a push device token |
| GET | `/mobile/v1/devices` | List the caller's registered devices |
| GET | `/health`, `/health/ready` | Liveness / readiness probes |
| GET | `/docs` | OpenAPI (Swagger UI) |

## Getting Started

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The API listens on [http://localhost:3300](http://localhost:3300).

## Phase

This API was implemented in **Phase 18** of the development roadmap.
See [15-roadmap.md](../../docs/15-roadmap.md) for timeline.

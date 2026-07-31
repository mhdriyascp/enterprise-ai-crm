# Integration Service

Manages connections to external third-party providers (Slack, Google Workspace,
Microsoft 365, Stripe, HubSpot, Salesforce, Zapier and generic webhooks) and
keeps an append-only activity log per connection.

Provider secrets are **never** stored here — only an opaque `credentialsRef`
(e.g. a secrets-manager key) is persisted and resolved out-of-band at call time.

## Port

`3201`

## Tech Stack

- Node.js 20 + TypeScript 5
- Fastify 4 (HTTP framework)
- Prisma 5 (ORM)
- Kafka (events via `@crm/events`)
- PostgreSQL (primary database)
- Redis (caching)

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Run database migrations
pnpm db:migrate:deploy

# Start in development mode
pnpm dev
```

## Concepts

- **Integration** — a configured connection to a provider with a `status`
  (`connected` / `disconnected` / `error`) and free-form `config`.
- **Integration event** — an append-only log entry recording lifecycle,
  `test`, `sync` and inbound `webhook` activity.

Lifecycle: `connect` (requires `credentialsRef`) → `test` → `sync`. `disconnect`
returns the integration to the disconnected state.

## API

Base path: `/api/v1/integrations`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create an integration |
| GET | `/` | List integrations |
| GET | `/:id` | Get an integration |
| PATCH | `/:id` | Update an integration |
| DELETE | `/:id` | Soft-delete an integration |
| POST | `/:id/connect` | Connect (requires `credentialsRef`) |
| POST | `/:id/disconnect` | Disconnect |
| POST | `/:id/test` | Test the connection |
| POST | `/:id/sync` | Trigger a sync |
| POST | `/:id/webhook` | Record an inbound webhook |
| GET | `/:id/events` | List activity events |

### API Documentation

When running, OpenAPI docs are available at:
- Swagger UI: `http://localhost:3201/docs`
- OpenAPI JSON: `http://localhost:3201/openapi.json`

## Health Check

```
GET http://localhost:3201/health
GET http://localhost:3201/health/ready
```

## Development

```bash
pnpm dev          # Start with hot reload
pnpm build        # Build for production
pnpm test         # Run tests
pnpm typecheck    # TypeScript check
pnpm lint         # Lint code
```

## Architecture

This service follows Clean Architecture:

```
src/
├── domain/           # Business entities and enums
├── application/      # Use cases (connection lifecycle)
├── infrastructure/   # DB, HTTP adapters
└── interface/        # HTTP routes, DTOs and middleware
```

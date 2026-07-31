# Document Service

Manages document storage, retrieval, and version control.

## Port

`3109`

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

## API Documentation

When running, OpenAPI docs are available at:
- Swagger UI: `http://localhost:3109/docs`
- OpenAPI JSON: `http://localhost:3109/openapi.json`

## Health Check

```
GET http://localhost:3109/health
GET http://localhost:3109/health/ready
GET http://localhost:3109/metrics
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
├── domain/           # Business entities and rules
├── application/      # Use cases and handlers
├── infrastructure/   # DB, HTTP, Kafka adapters
└── interface/        # HTTP routes and controllers
```

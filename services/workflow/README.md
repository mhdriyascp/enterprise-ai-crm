# Workflow Service

Defines and executes business process automation workflows, including
human-in-the-loop approval gates.

## Port

`3110`

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

- **Workflow definition** — a reusable, versioned blueprint. Its `steps` are an
  ordered list of `{ id, name, type, config }`. Supported step types:
  - `action` / `notification` — executed inline and recorded as completed.
  - `approval` — pauses the run at `waiting_approval` and raises an **Approval**
    that a human must resolve before the run continues.
- **Workflow run** — a single execution instance of a definition. The engine is
  deterministic and offline-friendly: it walks steps sequentially, pausing at
  approval gates and completing once all steps have run.
- **Approval** — a pending decision (`approved` / `rejected`). Approving resumes
  the run; rejecting fails it.

Domain events published (Kafka topics): `workflow.started`, `workflow.completed`,
`workflow.failed`, `workflow.approval.requested`, `workflow.approval.completed`.

## API

Base path: `/api/v1`

| Method | Path | Description |
|---|---|---|
| POST | `/workflows` | Create a workflow definition |
| GET | `/workflows` | List workflow definitions |
| GET | `/workflows/:id` | Get a workflow definition |
| PATCH | `/workflows/:id` | Update a workflow definition |
| DELETE | `/workflows/:id` | Soft-delete a workflow definition |
| POST | `/workflows/:id/runs` | Trigger a run |
| GET | `/runs` | List runs |
| GET | `/runs/:runId` | Get a run |
| POST | `/runs/:runId/cancel` | Cancel a run |
| GET | `/approvals` | List approvals |
| POST | `/approvals/:approvalId/decision` | Approve or reject a pending approval |

### API Documentation

When running, OpenAPI docs are available at:
- Swagger UI: `http://localhost:3110/docs`
- OpenAPI JSON: `http://localhost:3110/openapi.json`

## Health Check

```
GET http://localhost:3110/health
GET http://localhost:3110/health/ready
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
├── domain/           # Business entities, enums and step contracts
├── application/      # Use cases and the workflow execution engine
├── infrastructure/   # DB, HTTP, Kafka adapters
└── interface/        # HTTP routes, DTOs and middleware
```

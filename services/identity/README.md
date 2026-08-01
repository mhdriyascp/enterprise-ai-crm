# Identity & IAM Service

Authentication, authorization, and identity management for the platform. Implements
OAuth2-style password/refresh flows with JWT access tokens, multi-tenant RBAC,
organizations, users, roles, permissions, API keys, and audit logging.

## Port

`3100` (host) -> `3000` (container)

## Tech Stack

- Node.js 20 + TypeScript 5
- Fastify 4 (HTTP framework)
- Prisma 5 (ORM) + PostgreSQL
- `jsonwebtoken` (JWT) + `bcryptjs` (password hashing)
- Zod (validation)
- OpenAPI via `@fastify/swagger`

## Capabilities

| Area          | Details |
|---------------|---------|
| Authentication | Register (tenant + owner), login, refresh-token rotation, logout, `/me` |
| Access tokens  | Short-lived JWTs carrying `roles` + `permissions` |
| Refresh tokens | Opaque, hashed at rest (SHA-256), rotated on use, revocable |
| Tenants        | CRUD + soft delete; seeds system roles on creation |
| Organizations  | Business units within a tenant |
| Users          | CRUD, status management, role assignment |
| Roles          | Tenant-scoped; system roles (`admin`, `manager`, `member`, `viewer`) are protected |
| Permissions    | Global `resource:action` catalog, synced on startup |
| RBAC           | Wildcard (`*:*`), resource wildcard (`resource:*`), AND/OR checks |
| API keys       | M2M credentials, hashed at rest, scoped, revocable, expiry |
| Audit logging  | Immutable record of security-relevant actions |

## Getting Started

```bash
# Install dependencies (from the repo root)
pnpm install

# Set up environment
cp .env.example .env.local

# Generate the Prisma client and run migrations
pnpm --filter @crm/identity db:generate
pnpm --filter @crm/identity db:migrate:deploy

# (Optional) seed a demo tenant + admin user
pnpm --filter @crm/identity db:seed

# Start in development mode
pnpm --filter @crm/identity dev
```

The demo seed creates tenant slug `demo` with `admin@demo.test` / `ChangeMe123!`.

## API

All business endpoints are versioned under `/api/v1`.

| Method & Path | Permission | Description |
|---------------|------------|-------------|
| `POST /api/v1/auth/register` | public | Create a tenant and its owner (admin) user |
| `POST /api/v1/auth/login` | public | Authenticate, receive access + refresh tokens |
| `POST /api/v1/auth/refresh` | public | Rotate a refresh token |
| `POST /api/v1/auth/logout` | public | Revoke a refresh token |
| `GET  /api/v1/auth/me` | authenticated | Current principal |
| `GET/POST/PATCH/DELETE /api/v1/tenants` | `tenant:*` | Tenant management |
| `GET/POST/PATCH/DELETE /api/v1/users` | `user:*` | User management |
| `PUT /api/v1/users/:id/roles` | `user:update` + `role:read` | Assign roles |
| `GET/POST/PATCH/DELETE /api/v1/roles` | `role:*` | Role management |
| `PUT /api/v1/roles/:id/permissions` | `role:update` + `permission:read` | Assign permissions |
| `GET /api/v1/permissions` | `permission:read` | List permission catalog |
| `GET/POST/DELETE /api/v1/api-keys` | `apikey:*` | API key management |
| `GET /api/v1/audit-logs` | `audit:read` | Read audit log |

Authenticate with either the `Authorization: ****** header or an
`X-API-Key: <api_key>` header.

## API Documentation

- Swagger UI: `http://localhost:3100/docs`
- OpenAPI JSON: `http://localhost:3100/docs/json`

## Health

```
GET http://localhost:3100/health
GET http://localhost:3100/health/ready
```

## Development

```bash
pnpm --filter @crm/identity dev          # Start with hot reload
pnpm --filter @crm/identity build        # Compile to dist/
pnpm --filter @crm/identity test         # Run unit tests (vitest)
pnpm --filter @crm/identity typecheck    # TypeScript check
pnpm --filter @crm/identity lint         # Lint
```

## Architecture (Clean Architecture)

```
src/
|-- config/           # Env parsing (extends @crm/config schemas)
|-- domain/           # Permission catalog, RBAC logic, domain errors
|-- application/      # Use-case services (auth, tenant, user, role, api-key, audit)
|-- infrastructure/   # Prisma client + HTTP server assembly (DI container)
`-- interface/        # Routes, middleware (authenticate, authorize, error handler), DTOs
prisma/               # schema.prisma, migrations, seed
tests/unit/           # RBAC, permission catalog, password & token services
```

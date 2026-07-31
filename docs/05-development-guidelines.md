# 05 — Development Guidelines

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) |
| pnpm | 9.x | `npm install -g pnpm` |
| Docker | 24.x | [docker.com](https://docker.com) |
| Docker Compose | v2.x | Included with Docker Desktop |
| Python | 3.12 | [python.org](https://python.org) |
| Git | 2.x | System package manager |

---

## Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/mhdriyascp/enterprise-ai-crm.git
cd enterprise-ai-crm

# 2. Run the setup script
./scripts/setup.sh

# 3. Start the local infrastructure
docker compose up -d

# 4. Install Node.js dependencies
pnpm install

# 5. Run database migrations
./scripts/migrate.sh

# 6. Seed development data
./scripts/seed.sh

# 7. Start all services in development mode
pnpm dev
```

---

## Development Workflow

### Branch Strategy

We use **Trunk-Based Development** with short-lived feature branches:

```
main ──────────────────────────────────────────► production
  └── feature/crm-customer-service ──► PR ──► merge
  └── fix/lead-assignment-bug      ──► PR ──► merge
  └── chore/update-dependencies    ──► PR ──► merge
```

**Branch naming:**
- `feature/{ticket-id}-{description}` — new features
- `fix/{ticket-id}-{description}` — bug fixes
- `chore/{description}` — maintenance tasks
- `docs/{description}` — documentation only

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`

**Examples:**
```
feat(customer): add bulk import via CSV
fix(auth): resolve token refresh race condition
docs(api): update customer endpoints documentation
chore(deps): update prisma to 5.12.0
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make changes with atomic commits
3. Ensure all tests pass locally: `pnpm test`
4. Ensure linting passes: `pnpm lint`
5. Open a Pull Request with a clear description
6. Request review from at least one team member
7. Address review feedback
8. Squash merge into `main`

---

## Code Standards

### TypeScript

- Strict mode enabled (`"strict": true` in tsconfig)
- No `any` types — use `unknown` when type is uncertain
- Prefer `interface` over `type` for object shapes
- Export types explicitly
- Use `readonly` for immutable data

### Error Handling

```typescript
// ✅ Good — typed errors
class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer ${customerId} not found`);
    this.name = 'CustomerNotFoundError';
  }
}

// ✅ Good — Result type pattern
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### API Design

See [06-api-standards.md](./06-api-standards.md) for REST API design rules.

### Testing

- **Unit tests** — cover all domain logic
- **Integration tests** — cover database and HTTP integrations
- **E2E tests** — cover critical user journeys
- Aim for **80%+ code coverage** on domain and application layers

---

## Running Tests

```bash
# All tests
pnpm test

# Specific workspace
pnpm --filter @crm/customer-service test

# Watch mode
pnpm --filter @crm/customer-service test:watch

# Coverage report
pnpm test:coverage
```

---

## Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Format all files
pnpm format

# Type check
pnpm typecheck
```

---

## Database Migrations

```bash
# Create a new migration
pnpm --filter @crm/customer-service db:migrate:create "add_customer_tags"

# Apply pending migrations
pnpm --filter @crm/customer-service db:migrate:deploy

# Reset database (dev only)
pnpm --filter @crm/customer-service db:reset
```

---

## Environment Variables

Each service has a `.env.example` file. Copy it to `.env.local` for local development:

```bash
cp services/customer/.env.example services/customer/.env.local
```

**Never commit `.env` files with real credentials.**

---

## Service Development

When adding a new service:

1. Copy the service template: `./scripts/create-service.sh my-service`
2. Update `pnpm-workspace.yaml` to include the new service
3. Add routes to Kong configuration in `services/api-gateway/`
4. Register Kafka consumer/producer topics in `packages/events/`
5. Update documentation in `docs/`

---

## Documentation Standards

- All architecture decisions go in `docs/`
- Each service has a `README.md` with setup and API description
- OpenAPI specs are generated from code (not hand-written)
- Update docs before opening a PR

---

## Performance Guidelines

- Use database indexes for all foreign keys and query columns
- Paginate all list endpoints (default: 20 items)
- Cache read-heavy endpoints with Redis (TTL: 5 minutes)
- Use database connection pooling (PgBouncer)
- Profile slow queries with `EXPLAIN ANALYZE`

---

## Security Guidelines

See [07-security.md](./07-security.md) for the full security policy.

Quick checklist:
- [ ] Validate all input with Zod/Pydantic schemas
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Enforce tenant isolation on every query
- [ ] Log all audit-worthy actions
- [ ] Never log PII or credentials
- [ ] Rate-limit all public endpoints

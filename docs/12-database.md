# 12 — Database

## Overview

The platform uses **PostgreSQL 16** as the primary relational database, with **Redis** for caching, **Qdrant** for vector storage, and **OpenSearch** for full-text search.

---

## PostgreSQL

### Connection Management

- **ORM**: Prisma (Node.js services), SQLAlchemy (Python services)
- **Connection Pooling**: PgBouncer (transaction mode)
- **Read Replicas**: For reporting and analytics queries

### Database Per Service

Each microservice has its own database (Database-per-Service pattern):

| Service | Database |
|---|---|
| identity-service | `crm_identity` |
| customer-service | `crm_customer` |
| lead-service | `crm_lead` |
| opportunity-service | `crm_opportunity` |
| sales-service | `crm_sales` |
| task-service | `crm_task` |
| calendar-service | `crm_calendar` |
| document-service | `crm_document` |
| workflow-service | `crm_workflow` |
| notification-service | `crm_notification` |
| reporting-service | `crm_reporting` |
| ai-platform | `crm_ai` |
| integration-service | `crm_integration` |

---

## Multi-Tenant Strategy

### Row-Level Security (RLS)

Every table has a `tenant_id` column. RLS policies enforce isolation:

```sql
-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Isolation policy
CREATE POLICY tenant_isolation ON customers
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Set tenant context at the beginning of each connection
SET LOCAL app.tenant_id = 'tenant-uuid-here';
```

### Application-Level Enforcement

As a second layer, all queries in the application layer include a `WHERE tenant_id = ?` clause:

```typescript
const customer = await prisma.customer.findFirst({
  where: {
    id: customerId,
    tenantId: context.tenantId, // always enforced
  },
});
```

---

## Common Schema Patterns

### Base Entity

All tables include:

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id   UUID NOT NULL REFERENCES tenants(id),
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by  UUID REFERENCES users(id),
updated_by  UUID REFERENCES users(id),
deleted_at  TIMESTAMPTZ  -- soft delete
```

### Soft Deletes

Records are soft-deleted (never hard-deleted by default):

```sql
-- Filter out deleted records
WHERE deleted_at IS NULL
```

Use `prisma-soft-delete` middleware to handle this automatically.

---

## Migrations

Each service manages its own migrations:

```bash
# Node.js services (Prisma)
pnpm --filter @crm/customer-service db:migrate:create "add_customer_tags"
pnpm --filter @crm/customer-service db:migrate:deploy

# Python services (Alembic)
cd services/ai-platform
alembic revision --autogenerate -m "add_conversation_metadata"
alembic upgrade head
```

### Migration Rules

1. Migrations are forward-only in production
2. Each migration is atomic (transaction-wrapped)
3. No destructive migrations without a data migration plan
4. Column removals require two releases: deprecate, then remove

---

## Indexing Strategy

### Required Indexes

```sql
-- Always index tenant_id
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);

-- Always index foreign keys
CREATE INDEX idx_{table}_{fk} ON {table}({foreign_key});

-- Soft delete filter
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at)
  WHERE deleted_at IS NULL;

-- Common query patterns
CREATE INDEX idx_customers_email ON customers(tenant_id, email);
CREATE INDEX idx_leads_status ON leads(tenant_id, status, created_at DESC);
```

### Full-Text Search

PostgreSQL GIN indexes for text search:

```sql
CREATE INDEX idx_customers_search ON customers
  USING GIN(to_tsvector('english', name || ' ' || email));
```

---

## Redis

### Use Cases

| Purpose | Key Pattern | TTL |
|---|---|---|
| Session cache | `session:{user_id}` | 1 hour |
| API response cache | `cache:{tenant}:{resource}:{hash}` | 5 minutes |
| Rate limiting | `rate:{key}:{window}` | 1 minute |
| Pub/Sub | `events:{topic}` | N/A |
| Job locks | `lock:{job_id}` | 30 seconds |
| AI conversation state | `conv:{session_id}` | 24 hours |

### Caching Strategy

```typescript
// Cache-aside pattern
async function getCustomer(id: string): Promise<Customer> {
  const cacheKey = `cache:${tenantId}:customer:${id}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const customer = await prisma.customer.findUnique({ where: { id } });
  await redis.setex(cacheKey, 300, JSON.stringify(customer)); // 5 min TTL

  return customer;
}
```

---

## Qdrant (Vector Database)

- Collections named `knowledge_{tenant_id}` for isolation
- Dimension: 3072 (text-embedding-3-large)
- Distance metric: Cosine similarity
- See [10-rag.md](./10-rag.md) for full schema

---

## OpenSearch

### Indices

| Index | Purpose |
|---|---|
| `customers-{tenant}` | Customer full-text search |
| `leads-{tenant}` | Lead search |
| `documents-{tenant}` | Document search |
| `logs-{service}-{date}` | Structured application logs |
| `audit-{date}` | Audit log aggregation |

---

## Backup Strategy

| Database | Frequency | Retention | Method |
|---|---|---|---|
| PostgreSQL | Hourly | 30 days | WAL streaming + pg_dump |
| Redis | Daily | 7 days | RDB snapshot |
| Qdrant | Daily | 14 days | Qdrant snapshot API |
| OpenSearch | Daily | 14 days | Snapshot to S3 |

---

## Performance Guidelines

1. Use `EXPLAIN ANALYZE` before adding indexes in production
2. Monitor slow queries with `pg_stat_statements`
3. Use read replicas for reporting queries
4. Paginate all queries (never fetch unbounded result sets)
5. Use database-level constraints for data integrity
6. Avoid N+1 queries — use `include` in Prisma

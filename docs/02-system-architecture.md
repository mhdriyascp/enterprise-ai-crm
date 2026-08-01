# 02 — System Architecture

## Architectural Style

The platform uses a **microservices architecture** with the following key patterns:

- **Event-Driven Architecture** — services communicate via Kafka events
- **CQRS** — separate read and write models where performance requires it
- **Domain-Driven Design** — service boundaries align with business domains
- **Clean Architecture** — each service is structured in layers (domain, application, infrastructure, interface)
- **API Gateway Pattern** — single entry point for all external traffic
- **Sidecar Pattern** — observability agents run alongside each service

---

## Service Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Kong API Gateway                            │
│              JWT Auth │ Rate Limiting │ Request Logging             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────▼───────────────────┐
          │             Identity Service             │
          │   OAuth2 │ OIDC │ JWT │ RBAC │ Tenants  │
          └────────────────────┬───────────────────┘
                               │
    ┌──────────────────────────▼──────────────────────────────┐
    │                     CRM Core Services                    │
    │                                                          │
    │  Organization  │  Customer  │  Contact  │  Lead         │
    │  Opportunity   │  Sales     │  Task     │  Calendar     │
    │  Document      │  Workflow  │  Notify   │  Reporting    │
    └──────────────────────────┬──────────────────────────────┘
                               │
    ┌──────────────────────────▼──────────────────────────────┐
    │                     AI Platform                          │
    │                                                          │
    │  AI Gateway │ Prompt Manager │ Conversation Manager     │
    │  Memory Manager │ Model Router │ LangGraph               │
    │  MCP Client │ Guardrails │ Evaluation                   │
    └──────────────────────────┬──────────────────────────────┘
                               │
    ┌──────────────────────────▼──────────────────────────────┐
    │                      AI Agents                           │
    │                                                          │
    │  Supervisor │ CRM │ Sales │ Workflow │ Support          │
    │  Finance │ Reporting │ Knowledge │ Email                │
    └──────────────────────────┬──────────────────────────────┘
                               │
    ┌──────────────────────────▼──────────────────────────────┐
    │                    Integration Service                   │
    │                                                          │
    │  Google │ Microsoft │ Slack │ Stripe │ Salesforce        │
    │  HubSpot │ GitHub │ Jira │ WhatsApp │ Twilio            │
    └─────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Synchronous Requests

```
Client → Kong Gateway → Service → Database → Response
```

### Asynchronous Events

```
Service A → Kafka Topic → Service B (Consumer)
                       → Service C (Consumer)
```

### AI Request Flow

```
Client → Kong → AI Platform (Gateway)
              → Model Router
              → LLM (OpenAI / Anthropic / Local)
              → Memory Manager (Redis / Qdrant)
              → Response with Citations
```

---

## Infrastructure Topology

### Production

```
                    ┌──────────────┐
                    │  CloudFlare  │
                    │     CDN      │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Kubernetes  │
                    │   Cluster    │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐    ┌──────▼──────┐
    │  App    │      │  Service  │    │   Data      │
    │  Nodes  │      │   Nodes   │    │   Nodes     │
    └─────────┘      └───────────┘    └─────────────┘
```

### Local Development

Single `docker compose up -d` starts all dependencies. See [Docker Compose](../docker-compose.yml).

---

## Tenant Isolation Strategy

Every database table includes a `tenant_id` column. Row-Level Security (RLS) is enforced at the PostgreSQL level and application level.

```sql
-- Example RLS policy
CREATE POLICY tenant_isolation ON customers
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

API calls include a `X-Tenant-ID` header validated by the Identity Service before reaching CRM services.

---

## Service Communication

| Pattern | Technology | Use Case |
|---|---|---|
| Sync REST | Kong → Service | Client-facing APIs |
| Sync gRPC | Internal services | High-performance internal calls |
| Async Events | Kafka | Cross-service notifications |
| Scheduled | Temporal | Workflows, reminders |

---

## Security Architecture

See [07-security.md](./07-security.md) for details.

Key points:
- All external traffic goes through Kong Gateway
- JWT tokens validated at the gateway level
- Internal service-to-service communication via mTLS
- Secrets managed via Kubernetes Secrets / Vault
- All data encrypted at rest (AES-256) and in transit (TLS 1.3)

---

## Scalability

Each service can scale independently via Kubernetes HPA:

```yaml
minReplicas: 2
maxReplicas: 20
targetCPUUtilizationPercentage: 70
```

Kafka partitioning enables parallel event processing. Qdrant supports distributed vector search.

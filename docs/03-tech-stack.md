# 03 — Tech Stack

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.x | Admin Portal, CRM Web, Public Website |
| React | 18.x | UI Components |
| TypeScript | 5.x | Type Safety |
| TailwindCSS | 3.x | Styling |
| Shadcn/ui | latest | Component Library |
| Zustand | 4.x | Client State Management |
| React Query | 5.x | Server State / Data Fetching |
| React Hook Form | 7.x | Form Management |
| Zod | 3.x | Schema Validation |

## Mobile

| Technology | Version | Purpose |
|---|---|---|
| Flutter | 3.x | Cross-platform Mobile App |
| Dart | 3.x | Language |
| Riverpod | 2.x | State Management |
| Dio | 5.x | HTTP Client |

## Backend — Node.js Services

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | Runtime |
| TypeScript | 5.x | Language |
| Fastify | 4.x | HTTP Framework |
| Prisma | 5.x | ORM / Database Client |
| Zod | 3.x | Request Validation |
| Bull / BullMQ | 4.x | Job Queues |
| Pino | 8.x | Structured Logging |
| OpenTelemetry | 1.x | Distributed Tracing |

## Backend — Python Services (AI Platform)

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.12 | Runtime |
| FastAPI | 0.111 | HTTP Framework |
| LangChain | 0.2.x | LLM Orchestration |
| LangGraph | 0.1.x | Agent Workflows |
| Pydantic | 2.x | Data Validation |
| SQLAlchemy | 2.x | ORM |
| Alembic | 1.x | Database Migrations |
| Uvicorn | 0.30 | ASGI Server |
| Celery | 5.x | Task Queue |

## Databases

| Technology | Purpose |
|---|---|
| PostgreSQL 16 | Primary relational database |
| Redis 7 | Caching, sessions, Pub/Sub |
| Qdrant | Vector database for embeddings |
| OpenSearch 2 | Full-text search, log aggregation |
| MinIO | Object storage (documents, files) |

## AI & ML

| Technology | Purpose |
|---|---|
| OpenAI GPT-4o | Primary LLM |
| Anthropic Claude | Secondary LLM |
| Llama 3 (via Ollama) | Local development LLM |
| LangGraph | Agent orchestration |
| LangChain | LLM tooling and chains |
| Langfuse | LLM observability |
| Sentence Transformers | Text embeddings |
| Qdrant | Vector similarity search |

## Infrastructure

| Technology | Purpose |
|---|---|
| Docker / Docker Compose | Local development |
| Kubernetes (K8s) | Production container orchestration |
| Helm | Kubernetes package manager |
| Argo CD | GitOps continuous delivery |
| Terraform | Infrastructure as Code |
| Kong Gateway | API Gateway |
| Keycloak | Identity Provider (OAuth2, OIDC) |
| Apache Kafka | Event streaming |
| Temporal | Workflow engine |

## Observability

| Technology | Purpose |
|---|---|
| Prometheus | Metrics collection |
| Grafana | Dashboards and alerting |
| OpenTelemetry | Distributed tracing |
| Jaeger | Trace visualization |
| Pino / Structlog | Structured logging |
| OpenSearch | Log aggregation |
| Langfuse | AI / LLM tracing |

## CI/CD & DevOps

| Technology | Purpose |
|---|---|
| GitHub Actions | CI/CD pipelines |
| Docker Hub / GHCR | Container registry |
| Argo CD | GitOps deployment |
| Trivy | Container security scanning |
| OWASP ZAP | API security testing |
| k6 | Load testing |
| Playwright | End-to-end testing |
| Vitest | Unit testing (Node.js) |
| Pytest | Unit testing (Python) |

## Monorepo Tooling

| Technology | Purpose |
|---|---|
| Turborepo | Monorepo build system |
| pnpm | Package manager |
| ESLint | JavaScript/TypeScript linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| Commitlint | Commit message linting |
| Changesets | Version management |

---

## Version Policy

- All production dependencies must be pinned to exact versions in `package.json`
- Python dependencies pinned in `requirements.txt` or `pyproject.toml`
- LTS versions are preferred for runtimes
- Security patches are applied within 48 hours of release

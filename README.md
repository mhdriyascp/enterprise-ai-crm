# Enterprise AI CRM Platform

An AI-first, multi-tenant Customer Relationship Management platform built with a microservices architecture, event-driven communication, and deeply embedded AI agents.

---

## 🚀 Quick Start

```bash
# 1. Clone and set up
./scripts/setup.sh

# 2. Start local infrastructure (one command)
docker compose up -d

# 3. Install dependencies
pnpm install

# 4. Start all services in dev mode
pnpm dev
```

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Client Layer (Next.js + Flutter)                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                  ┌────────────▼────────────┐
                  │     Kong API Gateway     │
                  └────────────┬────────────┘
                               │
        ┌──────────────────────▼──────────────────────┐
        │           Microservices (Node.js + Python)   │
        │  Identity │ CRM Core │ AI Platform │ ...     │
        └──────────────────────┬──────────────────────┘
                               │
                  ┌────────────▼────────────┐
                  │       Kafka Events       │
                  └────────────┬────────────┘
                               │
        ┌──────────────────────▼──────────────────────┐
        │   PostgreSQL │ Redis │ Qdrant │ OpenSearch   │
        └─────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
enterprise-ai-crm/
├── apps/           # Frontend applications (Next.js, Flutter API)
├── services/       # Backend microservices
├── packages/       # Shared libraries
├── docs/           # Architecture documentation
├── infrastructure/ # Docker, Kubernetes, Terraform
├── scripts/        # Developer scripts
├── tests/          # Cross-service test suites
└── .github/        # CI/CD workflows
```

---

## 🏗️ Development Phases

| Phase | Description | Status |
|---|---|---|
| 1 | Architecture Repository | ✅ |
| 2 | Documentation (15 docs) | ✅ |
| 3 | Docker Environment | ✅ |
| 4 | Monorepo (Turborepo) | ✅ |
| 5 | Shared Packages | ✅ |
| 6 | Identity & IAM | ✅ |
| 7 | API Gateway (Kong) | ✅ |
| 8 | CRM Core Services | 🚧 |
| 9 | Event Bus (Kafka) | ✅ |
| 10 | AI Platform | ✅ |
| 11 | AI Agents | ✅ |
| 12 | RAG Pipeline | ✅ |
| 13 | Workflow Engine (Temporal) | 📋 |
| 14 | External Integrations | 📋 |
| 15 | Admin Web (Next.js) | 📋 |
| 16 | CRM Web (Next.js) | 📋 |
| 17 | Public Website | 📋 |
| 18 | Mobile API | 📋 |
| 19 | Flutter App | 📋 |
| 20 | Monitoring | 📋 |
| 21 | Kubernetes | 📋 |
| 22 | CI/CD | 📋 |
| 23 | Testing | 📋 |
| 24 | Production Hardening | 📋 |

---

## 🧩 Services

| Service | Port | Description |
|---|---|---|
| Identity Service | 3100 | Auth, RBAC, tenants, API keys |
| Customer Service | 3101 | Customer management |
| Lead Service | 3102 | Lead tracking & qualification |
| Opportunity Service | 3103 | Sales pipeline |
| Organization Service | 3104 | Organizations & accounts |
| Contact Service | 3105 | Contact management |
| Sales Service | 3106 | Sales activities |
| Task Service | 3107 | Tasks & reminders |
| Calendar Service | 3108 | Scheduling |
| Document Service | 3109 | File management |
| Workflow Service | 3110 | Process automation |
| Notification Service | 3111 | Email, push, SMS |
| Reporting Service | 3112 | Analytics & BI |
| AI Platform | 3200 | AI agents & RAG |
| Integration Service | 3201 | Third-party adapters |

---

## 📦 Shared Packages

| Package | Description |
|---|---|
| `@crm/types` | Shared TypeScript types |
| `@crm/common` | Utilities, errors, validation |
| `@crm/config` | Configuration schemas (Zod) |
| `@crm/logging` | Structured logging (Pino) |
| `@crm/auth` | JWT helpers, RBAC utilities |
| `@crm/events` | Kafka producers & consumers |
| `@crm/database` | Prisma client factory |
| `@crm/sdk` | Public API SDK |
| `@crm/ai-sdk` | AI Platform client |

---

## 🐳 Local Infrastructure

| Service | URL | Credentials |
|---|---|---|
| Kong API Gateway | http://localhost:8000 | — |
| Kong Admin | http://localhost:8001 | — |
| Keycloak | http://localhost:8080 | admin / admin_password |
| Kafka UI | http://localhost:8090 | — |
| MinIO Console | http://localhost:9001 | crm_minio_user / crm_minio_password |
| Grafana | http://localhost:3001 | admin / admin_password |
| Prometheus | http://localhost:9090 | — |
| Langfuse | http://localhost:3030 | — |
| Qdrant | http://localhost:6333 | — |
| OpenSearch | http://localhost:9200 | — |
| PostgreSQL | localhost:5432 | crm / crm_dev_password |
| Redis | localhost:6379 | crm_redis_password |

---

## 📚 Documentation

All architecture documentation lives in [`/docs`](./docs/):

- [01 — System Overview](./docs/01-system-overview.md)
- [02 — System Architecture](./docs/02-system-architecture.md)
- [03 — Tech Stack](./docs/03-tech-stack.md)
- [04 — Folder Structure](./docs/04-folder-structure.md)
- [05 — Development Guidelines](./docs/05-development-guidelines.md)
- [06 — API Standards](./docs/06-api-standards.md)
- [07 — Security](./docs/07-security.md)
- [08 — AI Platform](./docs/08-ai-platform.md)
- [09 — AI Agents](./docs/09-ai-agents.md)
- [10 — RAG Pipeline](./docs/10-rag.md)
- [11 — Event-Driven Architecture](./docs/11-event-driven.md)
- [12 — Database](./docs/12-database.md)
- [13 — Deployment](./docs/13-deployment.md)
- [14 — Monitoring](./docs/14-monitoring.md)
- [15 — Roadmap](./docs/15-roadmap.md)

---

## 🔧 Developer Scripts

```bash
pnpm dev           # Start all services in dev mode
pnpm build         # Build all packages and services
pnpm test          # Run all tests
pnpm lint          # Lint all code
pnpm typecheck     # TypeScript type checking
pnpm format        # Format all files

./scripts/setup.sh        # Initial environment setup
./scripts/migrate.sh      # Run database migrations
./scripts/seed.sh         # Seed development data
./scripts/health-check.sh # Check all service health
```

---

## 📋 Development Guidelines

See [05-development-guidelines.md](./docs/05-development-guidelines.md) for the full guide.

**Copilot Workflow:** Use GitHub Copilot one phase at a time. Give it one well-defined service or feature per prompt. Always reference the architecture documents in `/docs` as the source of truth.

---

## 🤝 Contributing

1. Read the [Development Guidelines](./docs/05-development-guidelines.md)
2. Pick a task from the [Roadmap](./docs/15-roadmap.md)
3. Create a branch: `feature/{ticket}-{description}`
4. Follow [Conventional Commits](https://www.conventionalcommits.org/)
5. Open a Pull Request

---

## 📄 License

Proprietary — All rights reserved.
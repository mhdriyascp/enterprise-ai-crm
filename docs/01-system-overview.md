# 01 — System Overview

## Project Name

**Enterprise AI CRM Platform**

## Mission

Deliver an AI-first, multi-tenant Customer Relationship Management platform that empowers sales teams, automates workflows, and provides actionable intelligence through embedded AI agents and a robust RAG pipeline.

---

## Core Capabilities

| Capability | Description |
|---|---|
| Multi-tenancy | Isolated tenant data with shared infrastructure |
| AI Agents | Specialized agents for sales, support, workflow, reporting |
| RAG Pipeline | Document ingestion, embeddings, hybrid search, citations |
| Event-Driven | Kafka-based async communication between services |
| Workflow Engine | Temporal-powered automation, approvals, human-in-the-loop |
| Identity & IAM | OAuth2, OIDC, RBAC, API keys, audit logging |
| Observability | OpenTelemetry, Prometheus, Grafana, Langfuse |
| Integrations | Google, Microsoft, Slack, Stripe, Salesforce, HubSpot, and more |

---

## Key Users

- **Sales Representatives** — manage leads, opportunities, contacts
- **Sales Managers** — reporting, forecasting, team oversight
- **Customer Support** — ticket handling, AI-assisted responses
- **Administrators** — tenant configuration, user management, RBAC
- **Developers** — API access via SDK and API keys

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│   Admin Web (Next.js)  │  CRM Web (Next.js)  │  Mobile (Flutter)│
└──────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Kong API Gateway     │
                    │  (Auth, Rate Limit, Log) │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────▼──────────────────────┐
          │                 Service Mesh                  │
          │                                               │
          │  Identity  │  CRM Core  │  AI Platform  │    │
          │  Service   │  Services  │  & Agents     │    │
          │            │            │               │    │
          └──────────────────────┬──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       Event Bus          │
                    │       (Kafka)            │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────▼──────────────────────┐
          │                Data Layer                    │
          │  PostgreSQL  │  Redis  │  Qdrant  │ MinIO   │
          └─────────────────────────────────────────────┘
```

---

## Design Principles

1. **AI-First** — AI capabilities are embedded at the platform level, not bolted on.
2. **Multi-Tenant by Design** — Every data model and API enforces tenant isolation.
3. **Event-Driven** — Services communicate asynchronously via Kafka events.
4. **Clean Architecture** — Each service follows domain-driven design with clear boundaries.
5. **Observable** — Every service exposes metrics, logs, and traces.
6. **Developer-Friendly** — One command to start the full local environment.
7. **Security by Default** — Zero-trust, RBAC, audit logging, encrypted at rest and in transit.

---

## Technology Highlights

- **Runtime**: Node.js (TypeScript), Python 3.12
- **Frontend**: Next.js 14, React, TailwindCSS
- **Mobile**: Flutter
- **AI**: LangGraph, LangChain, OpenAI, Anthropic
- **Vector DB**: Qdrant
- **Search**: OpenSearch
- **Event Bus**: Apache Kafka
- **Workflow**: Temporal
- **API Gateway**: Kong
- **IAM**: Keycloak
- **Observability**: Prometheus, Grafana, OpenTelemetry, Langfuse

---

## Repository Structure

See [04-folder-structure.md](./04-folder-structure.md) for the complete monorepo layout.

---

## Getting Started

```bash
# Start the full local environment
docker compose up -d

# Install dependencies
npm install

# Run all services in development mode
npm run dev
```

See the [Development Guidelines](./05-development-guidelines.md) for detailed setup instructions.

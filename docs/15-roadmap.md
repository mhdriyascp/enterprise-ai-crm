# 15 — Roadmap

## Current Status

The project is in active development following the phased workflow defined in the repository root README.

---

## Phase Status

| Phase | Description | Status |
|---|---|---|
| 1 | Architecture Repository | ✅ Complete |
| 2 | Documentation | ✅ Complete |
| 3 | Docker Environment | 🚧 In Progress |
| 4 | Monorepo Setup | 🚧 In Progress |
| 5 | Shared Libraries | 📋 Planned |
| 6 | Identity & IAM | ✅ Complete |
| 7 | API Gateway | ✅ Complete |
| 8 | CRM Core Services | 🚧 In Progress |
| 9 | Event Bus | ✅ Complete |
| 10 | AI Platform | ✅ Complete |
| 11 | AI Agents | ✅ Complete |
| 12 | RAG Pipeline | ✅ Complete |
| 13 | Workflow Engine | 📋 Planned |
| 14 | External Integrations | 📋 Planned |
| 15 | Admin Web | 📋 Planned |
| 16 | CRM Web | 📋 Planned |
| 17 | Public Website | 📋 Planned |
| 18 | Mobile API | 📋 Planned |
| 19 | Flutter App | 📋 Planned |
| 20 | Monitoring | 📋 Planned |
| 21 | Kubernetes | 📋 Planned |
| 22 | CI/CD | 📋 Planned |
| 23 | Testing | 📋 Planned |
| 24 | Production Hardening | 📋 Planned |

---

## Milestone Targets

### Milestone 1: Foundation (Phases 1-5)

**Goal:** Running local environment with shared infrastructure.

Deliverables:
- [ ] Complete Docker Compose environment (one-command startup)
- [ ] Turborepo monorepo configured
- [ ] All shared packages created and published
- [ ] ESLint, Prettier, TypeScript strict mode
- [ ] Basic CI/CD pipeline

### Milestone 2: Identity (Phase 6)

**Goal:** Fully functional authentication and authorization.

Deliverables:
- [ ] User registration and login (OAuth2/OIDC via Keycloak)
- [ ] JWT token issuance and validation
- [ ] RBAC roles and permissions
- [ ] Multi-tenant user management
- [ ] API key management
- [ ] Audit logging
- [ ] Identity service API documented with OpenAPI

### Milestone 3: API Gateway (Phase 7)

**Goal:** Production-ready Kong configuration.

Deliverables:
- [x] JWT validation plugin configured
- [x] Rate limiting per user and tenant
- [x] Request logging to OpenSearch
- [x] Versioned route configuration
- [x] Health check endpoints

### Milestone 4: CRM Core (Phase 8)

**Goal:** Functional CRM with all core entities.

Deliverables:
- [x] Organization, Customer, Contact, Lead, Opportunity services
- [ ] Sales, Task, Calendar, Document, Workflow services
- [ ] Notification and Reporting services
- [x] Core entity services with OpenAPI, tests, Docker, migrations

### Milestone 5: Event Bus & AI Platform (Phases 9-12)

**Goal:** Event-driven backbone plus working AI agents with RAG capabilities.

Deliverables:
- [x] Event bus (Kafka) with domain events published by CRM core services
- [x] AI Gateway with model routing (offline mock + OpenAI-compatible providers)
- [x] All 9 AI agents implemented with supervisor routing
- [x] RAG pipeline: ingest → embed → search → generate (with citations)
- [ ] Langfuse observability
- [ ] Agent API with streaming support

### Milestone 6: Frontends (Phases 15-19)

**Goal:** Full-stack product usable by end users.

Deliverables:
- [ ] Admin web portal
- [ ] CRM web application
- [ ] Public marketing website
- [ ] Flutter mobile app (iOS + Android)

### Milestone 7: Production Ready (Phases 20-24)

**Goal:** Production-ready system.

Deliverables:
- [ ] Full Kubernetes deployment
- [ ] Grafana monitoring dashboards
- [ ] Complete CI/CD pipeline
- [ ] Load testing results within SLO
- [ ] Security audit passed

---

## Feature Backlog

### High Priority

- [ ] Real-time collaboration (WebSocket)
- [ ] Bulk data import (CSV, Excel)
- [ ] Email integration (Gmail, Outlook)
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Mobile push notifications

### Medium Priority

- [ ] Advanced analytics and forecasting
- [ ] Custom field builder
- [ ] Webhook outgoing events
- [ ] White-labeling support
- [ ] Multi-language (i18n) support

### Low Priority

- [ ] Offline mode (mobile)
- [ ] Data export (CSV, PDF)
- [ ] Custom report builder
- [ ] AI meeting notes
- [ ] Voice call integration (Twilio)

---

## Technical Debt

Items to address in Phase 24:

- Implement circuit breakers for external API calls
- Add database connection pool monitoring
- Improve error messages for end users
- Add request ID propagation to all internal calls
- Complete OpenAPI documentation for all services
- Achieve 80%+ test coverage on all services

---

## Contributing

See [05-development-guidelines.md](./05-development-guidelines.md) for the development workflow.

When starting work on a new phase:
1. Update this roadmap to mark the phase as `🚧 In Progress`
2. Create a feature branch: `feature/phase-{N}-{description}`
3. Update the relevant architecture documents
4. Implement the feature
5. Mark the phase `✅ Complete` when the PR is merged

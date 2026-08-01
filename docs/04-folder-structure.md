# 04 — Folder Structure

## Monorepo Layout

```
enterprise-ai-crm/
├── apps/                          # End-user applications
│   ├── admin-web/                 # Admin portal (Next.js)
│   ├── crm-web/                   # CRM application (Next.js)
│   ├── public-web/                # Public website (Next.js)
│   └── mobile-api/                # Mobile-optimized REST API
│
├── services/                      # Backend microservices
│   ├── identity/                  # Auth, IAM, tenants, RBAC
│   ├── api-gateway/               # Kong configuration
│   ├── organization/              # Organizations and accounts
│   ├── customer/                  # Customer management
│   ├── contact/                   # Contact management
│   ├── lead/                      # Lead tracking
│   ├── opportunity/               # Opportunity pipeline
│   ├── sales/                     # Sales management
│   ├── task/                      # Task management
│   ├── calendar/                  # Calendar & scheduling
│   ├── document/                  # Document management
│   ├── workflow/                  # Workflow automation
│   ├── notification/              # Notifications service
│   ├── reporting/                 # Analytics & reporting
│   ├── ai-platform/               # AI Gateway, agents, RAG
│   └── integration/               # External integrations
│
├── packages/                      # Shared libraries
│   ├── auth/                      # Auth utilities, JWT helpers
│   ├── common/                    # Shared utilities, helpers
│   ├── events/                    # Kafka event schemas & producers
│   ├── sdk/                       # Public SDK for API clients
│   ├── types/                     # Shared TypeScript types
│   ├── config/                    # Configuration schemas
│   ├── logging/                   # Structured logging setup
│   ├── database/                  # Database client & migrations
│   └── ai-sdk/                    # AI utilities, embeddings
│
├── docs/                          # Architecture documentation
│   ├── 01-system-overview.md
│   ├── 02-system-architecture.md
│   ├── 03-tech-stack.md
│   ├── 04-folder-structure.md
│   ├── 05-development-guidelines.md
│   ├── 06-api-standards.md
│   ├── 07-security.md
│   ├── 08-ai-platform.md
│   ├── 09-ai-agents.md
│   ├── 10-rag.md
│   ├── 11-event-driven.md
│   ├── 12-database.md
│   ├── 13-deployment.md
│   ├── 14-monitoring.md
│   └── 15-roadmap.md
│
├── infrastructure/                # Infrastructure as Code
│   ├── docker/                    # Docker configurations
│   ├── kubernetes/                # K8s manifests & Helm charts
│   └── terraform/                 # Terraform modules
│
├── scripts/                       # Developer scripts
│   ├── setup.sh                   # Initial environment setup
│   ├── seed.sh                    # Seed development data
│   ├── migrate.sh                 # Run database migrations
│   └── health-check.sh            # Check all service health
│
├── tests/                         # Cross-cutting tests
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── load/
│
├── .github/
│   └── workflows/                 # GitHub Actions CI/CD
│
├── docker-compose.yml             # Local development environment
├── docker-compose.override.yml    # Local overrides
├── turbo.json                     # Turborepo configuration
├── package.json                   # Root package.json (pnpm workspace)
├── pnpm-workspace.yaml            # pnpm workspace definition
├── tsconfig.base.json             # Base TypeScript configuration
├── .eslintrc.js                   # Root ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .gitignore
└── README.md
```

---

## Service Structure

Each backend service follows this layout:

```
services/{service-name}/
├── src/
│   ├── domain/                    # Domain entities, value objects
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── events/
│   ├── application/               # Use cases, commands, queries
│   │   ├── commands/
│   │   ├── queries/
│   │   └── handlers/
│   ├── infrastructure/            # DB, HTTP, external adapters
│   │   ├── database/
│   │   ├── http/
│   │   ├── kafka/
│   │   └── cache/
│   ├── interface/                 # HTTP routes, controllers, DTOs
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── dtos/
│   └── index.ts                   # Application entry point
│
├── prisma/                        # Database schema and migrations
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## Frontend Application Structure

```
apps/{app-name}/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Auth-required routes
│   │   ├── (public)/              # Public routes
│   │   └── api/                   # API routes
│   ├── components/                # React components
│   │   ├── ui/                    # Base UI components
│   │   ├── forms/                 # Form components
│   │   └── layouts/               # Layout components
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Utilities and configuration
│   ├── stores/                    # Zustand state stores
│   └── types/                     # Local type definitions
│
├── public/                        # Static assets
├── tests/
├── Dockerfile
├── next.config.js
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

---

## Package Structure

```
packages/{package-name}/
├── src/
│   ├── index.ts                   # Public API exports
│   └── ...
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Directories | kebab-case | `customer-service` |
| TypeScript files | camelCase | `customerService.ts` |
| React components | PascalCase | `CustomerCard.tsx` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Kafka topics | kebab-case | `customer.created` |
| Database tables | snake_case | `customer_contacts` |
| API endpoints | kebab-case | `/api/v1/customer-contacts` |

# AI Platform

The AI brain of the platform — AI Gateway, agents, RAG pipeline, and LLM orchestration.

## Port

`3200`

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

## API Documentation

When running, OpenAPI docs are available at:
- Swagger UI: `http://localhost:3200/docs`
- OpenAPI JSON: `http://localhost:3200/openapi.json`

## Health Check

```
GET http://localhost:3200/health
GET http://localhost:3200/health/ready
GET http://localhost:3200/metrics
```

## Development

```bash
pnpm dev          # Start with hot reload
pnpm build        # Build for production
pnpm test         # Run tests
pnpm typecheck    # TypeScript check
pnpm lint         # Lint code
```

## Overview

The AI Platform exposes three capabilities behind a single service:

- **AI Gateway (Phase 10)** — a provider-agnostic entry point for embeddings and chat
  completions. A deterministic `mock` provider keeps the platform fully functional
  offline (and in tests); an OpenAI-compatible provider is used in production. A
  `ModelRouter` picks the model/temperature per agent.
- **AI Agents (Phase 11)** — a supervisor plus eight specialized agents (crm, sales,
  workflow, support, finance, reporting, knowledge, email). The supervisor classifies
  intent and delegates to the best agent. Exchanges are persisted as conversations.
- **RAG Pipeline (Phase 12)** — ingest → chunk → embed → store → retrieve → generate.
  Documents and chunks are stored relationally; embeddings live in a vector store
  (in-memory for dev, Qdrant in production). Answers are grounded with citations.

## Endpoints

All routes are served under `/api/v1/ai` and require authentication (JWT bearer, or
trusted internal `X-Tenant-ID` / `X-User-ID` headers).

| Method | Path | Description |
|---|---|---|
| `GET` | `/agents` | List available agents |
| `POST` | `/agents/invoke` | Invoke via the supervisor (auto-routed) |
| `POST` | `/agents/:name/invoke` | Invoke a specific agent |
| `POST` | `/embeddings` | Generate embeddings |
| `POST` | `/rag/documents` | Ingest a document |
| `POST` | `/rag/search` | Semantic search (returns citations) |
| `POST` | `/rag/query` | Retrieval-augmented answer |
| `GET` | `/conversations` | List conversations |
| `GET` | `/conversations/:id` | Get a conversation with messages |

## Configuration

The service is offline-first: with the defaults below it runs without any external
LLM/embedding/vector API or network access.

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `mock` | `mock` or `openai` |
| `EMBEDDING_PROVIDER` | `mock` | `mock` or `openai` |
| `VECTOR_STORE` | `memory` | `memory` or `qdrant` |
| `LLM_DEFAULT_MODEL` | `gpt-4o-mini` | Default completion model |
| `EMBEDDING_DIMENSIONS` | `256` | Embedding vector size |
| `RAG_CHUNK_SIZE` / `RAG_CHUNK_OVERLAP` | `1000` / `150` | Chunking parameters |
| `RAG_TOP_K` | `5` | Retrieved chunks per query |

See `.env.example` for the full list (including `LLM_API_KEY`, `QDRANT_URL`, etc.).

## Architecture

This service follows Clean Architecture:

```
src/
├── agents/           # Agent definitions + registry (routing, invocation)
├── application/       # Gateway, conversations, and RAG use cases
├── infrastructure/    # LLM/embedding/vector-store providers, DB, HTTP
└── interface/         # HTTP routes, DTOs, and middleware
```

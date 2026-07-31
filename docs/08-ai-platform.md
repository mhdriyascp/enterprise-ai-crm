# 08 — AI Platform

## Overview

The AI Platform is an **independent service** that provides all AI capabilities across the CRM. It acts as the single source of truth for LLM interactions, agent orchestration, memory, and evaluation.

**Key principle:** AI logic is never embedded inside business services. CRM services call the AI Platform via its API.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         AI Platform                           │
│                                                               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │    AI    │  │    Prompt    │  │   Conversation       │   │
│  │ Gateway  │  │   Manager    │  │     Manager          │   │
│  └──────────┘  └──────────────┘  └──────────────────────┘   │
│                                                               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Memory  │  │    Model     │  │     LangGraph        │   │
│  │ Manager  │  │   Router     │  │  Orchestration       │   │
│  └──────────┘  └──────────────┘  └──────────────────────┘   │
│                                                               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   MCP    │  │  Guardrails  │  │    Evaluation        │   │
│  │  Client  │  │              │  │                      │   │
│  └──────────┘  └──────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
          │               │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  OpenAI   │   │Anthropic  │   │   Ollama  │
    │  GPT-4o   │   │  Claude   │   │  (local)  │
    └───────────┘   └───────────┘   └───────────┘
```

---

## Components

### AI Gateway

The entry point for all AI requests. Handles:
- Request routing to appropriate agent or model
- Authentication and rate limiting
- Request/response logging to Langfuse
- Cost tracking per tenant

**Endpoints:**
```
POST /api/v1/ai/chat               # Conversational AI
POST /api/v1/ai/complete           # Single-turn completion
POST /api/v1/ai/embed              # Generate embeddings
POST /api/v1/ai/agents/{agent}     # Invoke a specific agent
GET  /api/v1/ai/conversations      # List conversations
GET  /api/v1/ai/conversations/{id} # Get conversation history
```

### Prompt Manager

Manages versioned prompt templates:
- Templates stored in PostgreSQL
- Version-controlled with rollback support
- A/B testing support for prompt variations
- Tenant-specific prompt customization

```json
{
  "id": "crm-lead-qualify-v2",
  "template": "You are a CRM assistant. Analyze the following lead: {{lead_data}}...",
  "version": 2,
  "variables": ["lead_data", "company_context"],
  "model": "gpt-4o"
}
```

### Conversation Manager

Manages multi-turn conversation state:
- Conversation history stored in PostgreSQL
- Context window management (automatic truncation)
- User/session context injection
- Multi-tenant conversation isolation

### Memory Manager

Two-tier memory system:
- **Short-term**: Redis (conversation context, recent interactions)
- **Long-term**: Qdrant (semantic memory, user preferences, historical data)

### Model Router

Intelligently routes requests to the best model:
- Routes based on: task type, cost, latency, model availability
- Fallback chains: `gpt-4o → claude-3 → llama3`
- Load balancing across API keys

### LangGraph Orchestration

Complex multi-step agent workflows built with LangGraph:
- Stateful graph execution
- Conditional branching
- Parallel tool execution
- Human-in-the-loop pause points

### MCP Client

Model Context Protocol client for external tool integration:
- Connects to MCP servers (filesystem, databases, APIs)
- Exposes tools to LLM agents
- Manages tool call lifecycle

### Guardrails

Input/output safety layer:
- PII detection and redaction
- Prompt injection detection
- Content policy enforcement
- Response quality checks

### Evaluation

AI response quality monitoring:
- Automated evaluation with LLM-as-judge
- Human feedback collection
- A/B test result analysis
- Cost/quality tradeoff reports in Langfuse

---

## Supported Models

| Model | Provider | Use Case |
|---|---|---|
| gpt-4o | OpenAI | Primary reasoning, complex tasks |
| gpt-4o-mini | OpenAI | Simple tasks, high volume |
| claude-3-5-sonnet | Anthropic | Long context, document analysis |
| text-embedding-3-large | OpenAI | Text embeddings |
| llama3 | Ollama (local) | Development, sensitive data |

---

## Configuration

```yaml
# services/ai-platform/.env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
QDRANT_URL=http://qdrant:6333
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://...
DEFAULT_MODEL=gpt-4o
FALLBACK_MODEL=claude-3-5-sonnet-20241022
```

---

## Integration Pattern

CRM services call the AI Platform via HTTP:

```typescript
// services/lead/src/application/commands/qualifyLead.ts
const response = await aiPlatformClient.post('/api/v1/ai/agents/sales', {
  task: 'qualify_lead',
  context: {
    lead: leadData,
    company: companyData,
    history: recentInteractions,
  },
});
```

---

## Observability

- All LLM calls traced in **Langfuse**
- Latency, token usage, cost tracked per request
- Error rates and model fallbacks monitored in Grafana
- Prompt performance tracked across versions

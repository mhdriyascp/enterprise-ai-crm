# 09 — AI Agents

## Overview

AI Agents are specialized autonomous components that perform complex, multi-step tasks within the CRM platform. Each agent has a specific domain of responsibility and exposes a clear interface.

All agents run within the **AI Platform** service and are orchestrated by the **Supervisor Agent** using LangGraph.

---

## Agent Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Supervisor Agent                    │
│        (Routes requests to specialized agents)        │
└───────────────────────────┬──────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │  CRM    │         │  Sales  │         │Workflow │
   │  Agent  │         │  Agent  │         │  Agent  │
   └─────────┘         └─────────┘         └─────────┘
        │
   ┌────▼────┐         ┌─────────┐         ┌─────────┐
   │Support  │         │Finance  │         │Reporting│
   │  Agent  │         │  Agent  │         │  Agent  │
   └─────────┘         └─────────┘         └─────────┘
        │
   ┌────▼────┐         ┌─────────┐
   │Knowledge│         │  Email  │
   │  Agent  │         │  Agent  │
   └─────────┘         └─────────┘
```

---

## Supervisor Agent

**Purpose:** Routes user requests to the appropriate specialized agent.

**Responsibilities:**
- Analyze user intent and classify the request
- Delegate to one or more specialized agents
- Aggregate and synthesize agent responses
- Manage multi-agent collaboration
- Handle fallback when a specialized agent cannot fulfill the request

**Tools:**
- `classify_intent` — classify user request
- `delegate_to_agent` — send task to specialized agent
- `synthesize_response` — combine multiple agent outputs

---

## CRM Agent

**Purpose:** Core CRM operations — customers, contacts, leads, opportunities.

**Capabilities:**
- Retrieve and summarize customer profiles
- Identify duplicate records
- Suggest next best actions for a customer
- Draft customer communication
- Answer questions about CRM data

**Tools:**
- `get_customer` — fetch customer data
- `get_customer_history` — fetch interaction history
- `search_customers` — semantic customer search
- `create_note` — add a note to a customer record
- `suggest_next_action` — AI recommendation

---

## Sales Agent

**Purpose:** Sales process optimization, lead qualification, forecasting.

**Capabilities:**
- Qualify leads using BANT/MEDDIC methodology
- Score opportunities by win probability
- Generate sales email drafts
- Provide competitive intelligence
- Forecast revenue based on pipeline

**Tools:**
- `qualify_lead` — lead qualification
- `score_opportunity` — win probability score
- `generate_email` — draft sales email
- `get_pipeline` — fetch sales pipeline data
- `forecast_revenue` — revenue prediction

---

## Workflow Agent

**Purpose:** Automate business processes and trigger workflows.

**Capabilities:**
- Identify repetitive manual tasks for automation
- Trigger Temporal workflows
- Manage approval processes
- Schedule follow-ups and reminders

**Tools:**
- `list_workflows` — available workflow templates
- `trigger_workflow` — start a Temporal workflow
- `get_workflow_status` — check workflow state
- `schedule_reminder` — create a timed reminder

---

## Support Agent

**Purpose:** Customer support ticket handling and resolution.

**Capabilities:**
- Classify and prioritize support tickets
- Suggest resolutions based on knowledge base
- Draft support responses
- Escalate complex issues
- Identify recurring problems

**Tools:**
- `search_knowledge_base` — RAG search over support docs
- `get_ticket_history` — customer support history
- `draft_response` — AI-generated support response
- `escalate_ticket` — escalation with context

---

## Finance Agent

**Purpose:** Financial operations, invoicing, revenue recognition.

**Capabilities:**
- Summarize account financial status
- Flag overdue payments
- Generate invoice summaries
- Answer revenue-related questions

**Tools:**
- `get_account_balance` — account financial summary
- `list_invoices` — invoice listing
- `calculate_revenue` — revenue calculation
- `flag_overdue` — identify overdue accounts

---

## Reporting Agent

**Purpose:** Business intelligence, analytics, report generation.

**Capabilities:**
- Generate natural language reports
- Answer analytics questions ("What was our Q3 revenue?")
- Create custom charts and visualizations
- Identify trends and anomalies

**Tools:**
- `query_analytics` — run analytics queries
- `generate_report` — produce formatted report
- `get_kpis` — fetch key metrics
- `detect_anomalies` — identify outliers

---

## Knowledge Agent

**Purpose:** Knowledge base management and information retrieval via RAG.

**Capabilities:**
- Answer questions using company knowledge base
- Ingest and index new documents
- Retrieve relevant documents with citations
- Identify knowledge gaps

**Tools:**
- `search_knowledge` — hybrid search over knowledge base
- `get_document` — retrieve specific document
- `index_document` — add document to knowledge base
- `list_sources` — list available knowledge sources

---

## Email Agent

**Purpose:** Email composition, processing, and classification.

**Capabilities:**
- Draft professional emails
- Classify incoming emails
- Extract action items from emails
- Sync email threads with CRM records

**Tools:**
- `draft_email` — compose email
- `classify_email` — categorize email content
- `extract_action_items` — pull tasks from email
- `link_to_customer` — associate email with CRM record

---

## Agent API

Agents are invoked via the AI Platform API:

```http
POST /api/v1/ai/agents/{agent-name}
Content-Type: application/json
Authorization: ******

{
  "task": "qualify_lead",
  "context": {
    "leadId": "uuid",
    "userId": "uuid"
  },
  "sessionId": "optional-conversation-uuid",
  "stream": false
}
```

Response:
```json
{
  "data": {
    "response": "Based on the lead data...",
    "actions": [
      {
        "type": "create_note",
        "payload": { "content": "Lead scored: High" }
      }
    ],
    "citations": [
      {
        "source": "knowledge-base",
        "document": "Sales Methodology Guide",
        "chunk": "BANT qualification requires..."
      }
    ],
    "sessionId": "uuid",
    "model": "gpt-4o",
    "tokensUsed": 1234,
    "latencyMs": 2100
  }
}
```

---

## Adding a New Agent

1. Create the agent class in `services/ai-platform/src/agents/{name}/`
2. Define tools in `services/ai-platform/src/agents/{name}/tools.py`
3. Define the LangGraph graph in `services/ai-platform/src/agents/{name}/graph.py`
4. Register the agent with the Supervisor in `services/ai-platform/src/agents/supervisor.py`
5. Add the route to the AI Platform API
6. Document the agent in this file

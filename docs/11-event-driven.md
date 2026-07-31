# 11 — Event-Driven Architecture

## Overview

The platform uses **Apache Kafka** as its event bus for asynchronous communication between services. Events enable loose coupling, scalability, and event sourcing.

---

## Core Concepts

| Concept | Description |
|---|---|
| **Topic** | Named stream of related events |
| **Producer** | Service that publishes events |
| **Consumer** | Service that subscribes to events |
| **Consumer Group** | Set of consumers sharing the load |
| **Partition** | Parallel processing unit |
| **Offset** | Position in a partition |
| **DLQ** | Dead-Letter Queue for failed events |

---

## Topic Naming Convention

```
{domain}.{entity}.{event}

Examples:
  crm.customer.created
  crm.lead.status_changed
  crm.opportunity.won
  identity.user.invited
  ai.conversation.completed
  workflow.approval.requested
  notification.email.queued
```

---

## Topic Registry

### Identity Domain

| Topic | Producer | Consumers |
|---|---|---|
| `identity.user.created` | identity-service | notification, crm |
| `identity.user.deactivated` | identity-service | crm, workflow |
| `identity.tenant.created` | identity-service | all services |

### CRM Domain

| Topic | Producer | Consumers |
|---|---|---|
| `crm.customer.created` | customer-service | notification, ai-platform, reporting |
| `crm.customer.updated` | customer-service | reporting, search-index |
| `crm.lead.created` | lead-service | notification, ai-platform |
| `crm.lead.qualified` | lead-service | sales-service, notification |
| `crm.opportunity.created` | opportunity-service | reporting, ai-platform |
| `crm.opportunity.won` | opportunity-service | finance, notification, reporting |
| `crm.opportunity.lost` | opportunity-service | notification, reporting |
| `crm.task.completed` | task-service | workflow, notification |

### AI Domain

| Topic | Producer | Consumers |
|---|---|---|
| `ai.conversation.started` | ai-platform | logging |
| `ai.conversation.completed` | ai-platform | logging, reporting |
| `ai.document.indexed` | ai-platform | notification |

### Notification Domain

| Topic | Producer | Consumers |
|---|---|---|
| `notification.email.queued` | any service | notification-service |
| `notification.push.queued` | any service | notification-service |
| `notification.sms.queued` | any service | notification-service |

### Workflow Domain

| Topic | Producer | Consumers |
|---|---|---|
| `workflow.started` | workflow-service | notification |
| `workflow.completed` | workflow-service | notification, reporting |
| `workflow.failed` | workflow-service | notification |
| `workflow.approval.requested` | workflow-service | notification |
| `workflow.approval.completed` | workflow-service | workflow-service |

---

## Event Schema

All events follow a standard envelope:

```typescript
interface Event<T = unknown> {
  // Event metadata
  id: string;          // UUID v4
  version: string;     // "1.0"
  type: string;        // "crm.customer.created"
  source: string;      // "customer-service"

  // Tenant context
  tenantId: string;    // UUID

  // Actor
  userId?: string;     // UUID of user who triggered

  // Timestamps
  occurredAt: string;  // ISO 8601

  // Correlation
  correlationId?: string; // For request tracing
  causationId?: string;   // ID of event that caused this

  // Payload
  data: T;
}
```

**Example:**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "version": "1.0",
  "type": "crm.lead.qualified",
  "source": "lead-service",
  "tenantId": "tenant-uuid",
  "userId": "user-uuid",
  "occurredAt": "2024-01-15T10:30:00Z",
  "correlationId": "req-uuid",
  "data": {
    "leadId": "lead-uuid",
    "score": 85,
    "qualificationMethod": "BANT",
    "qualifiedBy": "ai-agent"
  }
}
```

---

## Producing Events

```typescript
// packages/events/src/producer.ts
import { EventProducer } from '@crm/events';

const producer = new EventProducer();

await producer.publish('crm.lead.qualified', {
  tenantId: tenant.id,
  userId: user.id,
  data: {
    leadId: lead.id,
    score: 85,
  },
});
```

---

## Consuming Events

```typescript
// services/notification/src/consumers/leadConsumer.ts
import { EventConsumer } from '@crm/events';

const consumer = new EventConsumer({
  groupId: 'notification-service',
  topics: ['crm.lead.qualified'],
});

consumer.on('crm.lead.qualified', async (event) => {
  await notificationService.sendLeadQualifiedAlert(event.data);
});
```

---

## Error Handling

### Retry Policy

Failed event processing is retried with exponential backoff:

```
Attempt 1: immediate
Attempt 2: 30 seconds
Attempt 3: 5 minutes
Attempt 4: 30 minutes
Attempt 5: → DLQ
```

### Dead-Letter Queue

Failed events after max retries go to:
```
{original-topic}.dlq

Example: crm.lead.qualified.dlq
```

DLQ events are:
- Logged with full error context
- Alerting triggers in Grafana
- Manually replayable via admin UI

---

## Kafka Configuration

### Partitions

| Topic | Partitions | Rationale |
|---|---|---|
| High-volume topics | 12 | Parallel processing |
| Standard topics | 6 | Default |
| Notification topics | 3 | Lower volume |

### Retention

| Topic Type | Retention |
|---|---|
| Business events | 30 days |
| Audit events | 1 year |
| Notification queue | 3 days |

---

## Schema Registry

All event schemas are defined in `packages/events/src/schemas/`:

```typescript
// packages/events/src/schemas/crm.ts
export const LeadQualifiedSchema = z.object({
  leadId: z.string().uuid(),
  score: z.number().min(0).max(100),
  qualificationMethod: z.enum(['BANT', 'MEDDIC', 'CHAMP']),
  qualifiedBy: z.string(),
});
```

Schemas are versioned. Breaking changes require a new version:
- `crm.lead.qualified.v1` → `crm.lead.qualified.v2`
- Old consumers must support both versions during migration

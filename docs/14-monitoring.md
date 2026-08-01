# 14 — Monitoring

## Observability Pillars

| Pillar | Tool | Purpose |
|---|---|---|
| **Metrics** | Prometheus + Grafana | System and business metrics |
| **Logs** | Pino/Structlog → OpenSearch | Structured application logs |
| **Traces** | OpenTelemetry → Jaeger | Distributed request tracing |
| **AI Traces** | Langfuse | LLM call tracing and evaluation |
| **Alerts** | Grafana Alerting | Incident notification |

---

## Metrics

### Standard Service Metrics

Every service exposes these Prometheus metrics at `/metrics`:

```
# HTTP metrics
http_requests_total{method, route, status_code, service}
http_request_duration_seconds{method, route, service}
http_request_size_bytes{method, route, service}
http_response_size_bytes{method, route, service}

# Database metrics
db_query_duration_seconds{operation, table, service}
db_connection_pool_size{service}
db_connection_pool_used{service}

# Cache metrics
cache_hits_total{cache, service}
cache_misses_total{cache, service}

# Kafka metrics
kafka_messages_produced_total{topic, service}
kafka_messages_consumed_total{topic, service}
kafka_consumer_lag{topic, partition, group}
```

### Business Metrics

```
# CRM metrics
crm_customers_total{tenant_id, status}
crm_leads_created_total{tenant_id, source}
crm_opportunities_total{tenant_id, stage}
crm_revenue_total{tenant_id, currency}

# AI metrics
ai_requests_total{model, agent, tenant_id}
ai_request_duration_seconds{model, agent}
ai_tokens_used_total{model, direction, tenant_id}
ai_cost_usd_total{model, tenant_id}
```

---

## Structured Logging

### Log Format

All services output JSON-structured logs:

```json
{
  "level": "info",
  "service": "customer-service",
  "version": "1.2.3",
  "tenantId": "uuid",
  "userId": "uuid",
  "requestId": "uuid",
  "method": "GET",
  "url": "/api/v1/customers/uuid",
  "statusCode": 200,
  "duration": 45,
  "message": "Request completed",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Log Levels

| Level | Usage |
|---|---|
| `error` | Unhandled errors, failures |
| `warn` | Handled errors, degraded state |
| `info` | Request lifecycle, significant events |
| `debug` | Detailed debugging (disabled in prod) |

### Log Shipping

```
Service → Pino (stdout) → Fluentd → OpenSearch → Grafana
```

---

## Distributed Tracing

### OpenTelemetry Setup

```typescript
// packages/logging/src/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  serviceName: process.env.SERVICE_NAME,
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
});

sdk.start();
```

### Trace Context Propagation

The `X-Request-ID` header is propagated across all service calls and is included in all logs for correlation.

---

## AI Observability (Langfuse)

Every LLM call is traced in Langfuse:

```python
from langfuse import Langfuse

langfuse = Langfuse()

with langfuse.start_as_current_span(name="lead-qualify"):
    response = llm.invoke(prompt)
    langfuse.flush()
```

Tracked per LLM call:
- Model and version
- Prompt template and variables
- Input/output tokens
- Cost
- Latency
- Quality score (if evaluated)

---

## Grafana Dashboards

### Service Overview Dashboard

- Request rate, error rate, latency (p50, p95, p99)
- Database query performance
- Cache hit rate
- Kafka consumer lag

### Business Dashboard

- Daily/weekly/monthly active tenants
- Lead-to-opportunity conversion rate
- AI usage and cost per tenant
- Revenue pipeline overview

### Infrastructure Dashboard

- Node CPU, memory, disk usage
- Pod restart rate
- Persistent volume usage
- Network I/O

### AI Performance Dashboard

- LLM request rate and latency by model
- Token usage and cost trends
- Error rate by model/agent
- Langfuse evaluation scores

---

## Alerting

### Critical Alerts (PagerDuty — immediate)

| Alert | Condition |
|---|---|
| Service down | Pod crash loop > 2 minutes |
| Database unreachable | Connection failures > 30 seconds |
| Error rate spike | 5xx rate > 5% for 2 minutes |
| Kafka consumer lag | Lag > 10,000 messages for 5 minutes |

### Warning Alerts (Slack — business hours)

| Alert | Condition |
|---|---|
| High latency | p99 > 2 seconds for 5 minutes |
| High memory | Memory > 85% for 10 minutes |
| Disk space | Available < 20% |
| AI cost spike | Cost > 150% of daily average |

---

## Health Checks

### Liveness Probe

Returns `200 OK` if the service process is running:

```
GET /health
```

### Readiness Probe

Returns `200 OK` if the service is ready to accept traffic:

```
GET /health/ready
```

Checks:
- Database connectivity
- Redis connectivity
- Kafka connectivity (if applicable)

---

## SLOs and SLAs

| Service | Availability SLO | Latency SLO (p99) |
|---|---|---|
| API Gateway | 99.95% | < 100ms |
| Identity Service | 99.9% | < 200ms |
| CRM Services | 99.9% | < 500ms |
| AI Platform | 99.5% | < 5 seconds |
| Reporting | 99.5% | < 10 seconds |

Error budget: `(1 - SLO) * 30 days`

---

## Runbooks

Runbooks for common incidents are located in `docs/runbooks/`:

- `database-connection-exhausted.md`
- `kafka-consumer-lag-spike.md`
- `service-oom-restart.md`
- `ai-cost-spike.md`

---

## Provisioned Configuration (Phase 20)

The monitoring stack ships with ready-to-run configuration under
`infrastructure/docker/`:

| Path | Purpose |
|---|---|
| `prometheus/prometheus.yml` | Scrape targets for all services + Kong, plus alerting/rule wiring |
| `prometheus/rules/alerts.yml` | Alerting rules (service down, error rate, latency, memory, event-loop lag) |
| `alertmanager/alertmanager.yml` | Alert routing with critical/warning tiers and inhibition |
| `grafana/datasources/prometheus.yml` | Prometheus datasource provisioning |
| `grafana/dashboards/dashboards.yml` | Dashboard provider configuration |
| `grafana/dashboards/crm-platform-overview.json` | Platform overview dashboard (availability, request rate, error rate, p95 latency) |

### Running Locally

```bash
docker compose up -d prometheus alertmanager grafana
```

- Prometheus: <http://localhost:9090> (check **Status → Rules** and **Alerts**)
- Alertmanager: <http://localhost:9093>
- Grafana: <http://localhost:3001> (default credentials `admin` / `admin_password`)

Alerts are delivered by Alertmanager to the notification-service webhook
(`/internal/alerts`) by default; wire environment-specific receivers
(PagerDuty, Slack, Teams) via overrides per the tables above.

# Kong API Gateway

The API Gateway is the single entry point for all external traffic. It runs in
**DB-less (declarative) mode** — the entire configuration lives in
[`kong.yml`](./kong.yml) and is version-controlled, so there is no database or
migration step to manage.

## What the gateway does

| Concern | Implementation |
|---|---|
| **Routing** | Versioned `/api/v1/*` routes proxied to each microservice |
| **Authentication** | `jwt` plugin validates HS256 tokens issued by the Identity service before requests reach services |
| **Rate limiting** | `rate-limiting` plugin (Redis policy) — 100/min per IP for public auth, 1000/min per user for authenticated APIs, 60/min per user for AI |
| **Request logging** | `correlation-id` (X-Request-ID) + `http-log` shipping access logs to OpenSearch |
| **Security headers** | `response-transformer` adds the headers from `docs/07-security.md` |
| **CORS** | `cors` plugin handled at the edge |
| **Metrics** | `prometheus` plugin exposes metrics at `:8001/metrics` |

## Routes

| Path prefix | Upstream service | Auth |
|---|---|---|
| `/api/v1/auth` | identity-service | public |
| `/api/v1/tenants`, `/users`, `/roles`, `/permissions`, `/api-keys`, `/audit-logs` | identity-service | JWT |
| `/api/v1/organizations` | organization-service | JWT |
| `/api/v1/customers` | customer-service | JWT |
| `/api/v1/contacts` | contact-service | JWT |
| `/api/v1/leads` | lead-service | JWT |
| `/api/v1/opportunities` | opportunity-service | JWT |
| `/api/v1/ai` | ai-platform | JWT |

## JWT validation

Kong validates tokens against the `crm-platform` consumer's JWT credential. The
credential `key` must equal the token `iss` claim and the `secret` must equal
the Identity service `JWT_SECRET`. For local development these match
`services/identity/.env.example`. **Replace them with real secrets in
production** (for example via [Kong vaults](https://docs.konghq.com/gateway/latest/kong-enterprise/secrets-management/)).

## Validate the configuration

```bash
# Parse/validate the declarative config without a running database
docker run --rm -e KONG_DATABASE=off \
  -v "$PWD/infrastructure/kong/kong.yml:/kong.yml:ro" \
  kong:3.6-ubuntu kong config parse /kong.yml
```

## Run

Kong starts automatically with the local stack:

```bash
docker compose up -d kong
```

| Endpoint | URL |
|---|---|
| Proxy | http://localhost:8000 |
| Admin API | http://localhost:8001 |
| Metrics | http://localhost:8001/metrics |
| Health | `docker compose exec kong kong health` |

## Making changes

Edit [`kong.yml`](./kong.yml), validate with the command above, then reload:

```bash
docker compose restart kong
# or, for a zero-downtime reload of an already running node:
docker compose exec kong kong reload
```

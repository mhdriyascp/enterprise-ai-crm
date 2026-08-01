# 06 — API Standards

## Design Principles

1. **REST over HTTP** — follow REST conventions unless gRPC is explicitly required
2. **Versioned** — all APIs are versioned from day one (`/api/v1/`)
3. **Consistent** — all APIs follow the same request/response shapes
4. **Documented** — OpenAPI 3.1 specs auto-generated from code
5. **Secure** — all endpoints require authentication unless explicitly public

---

## Base URL

```
https://api.{tenant}.example.com/api/v1/
```

Local development:
```
http://localhost:8000/api/v1/
```

---

## Authentication

All requests must include a ******

```http
Authorization: ******
```

API Key authentication (for server-to-server):

```http
X-API-Key: <api_key>
```

Tenant identification:

```http
X-Tenant-ID: <tenant_uuid>
```

---

## HTTP Methods

| Method | Use Case |
|---|---|
| `GET` | Retrieve resources |
| `POST` | Create a new resource |
| `PUT` | Replace an entire resource |
| `PATCH` | Partial update |
| `DELETE` | Delete a resource |

---

## URL Structure

```
/api/v1/{resource}                     # Collection
/api/v1/{resource}/{id}                # Single resource
/api/v1/{resource}/{id}/{sub-resource} # Nested resource
```

**Examples:**
```
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/{id}
PATCH  /api/v1/customers/{id}
DELETE /api/v1/customers/{id}
GET    /api/v1/customers/{id}/contacts
POST   /api/v1/customers/{id}/contacts
```

---

## Request Format

### Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: ******
X-Tenant-ID: <tenant_uuid>
X-Request-ID: <uuid>        # Optional, for tracing
```

### Body

```json
{
  "field": "value"
}
```

---

## Response Format

### Success (Single Resource)

```json
{
  "data": {
    "id": "uuid",
    "field": "value",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

### Success (Collection)

```json
{
  "data": [
    {
      "id": "uuid",
      "field": "value"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasNext": true,
    "hasPrev": false,
    "requestId": "uuid"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Customer with ID abc123 was not found.",
    "details": [
      {
        "field": "id",
        "message": "Invalid UUID format"
      }
    ]
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| `200 OK` | Successful GET, PATCH, PUT |
| `201 Created` | Successful POST |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation error |
| `401 Unauthorized` | Missing or invalid token |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Duplicate resource |
| `422 Unprocessable Entity` | Business rule violation |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unhandled server error |

---

## Pagination

All list endpoints support cursor-based or offset pagination:

**Query parameters:**
```
?page=1&limit=20&sort=createdAt&order=desc
```

**Filter parameters:**
```
?filter[status]=active&filter[assignedTo]=user_uuid
```

**Search:**
```
?search=john+doe
```

---

## Error Codes

Use descriptive error codes in SCREAMING_SNAKE_CASE:

| Code | Description |
|---|---|
| `VALIDATION_ERROR` | Request data failed validation |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `TENANT_NOT_FOUND` | Tenant does not exist |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Versioning Strategy

- Current version: `v1`
- New versions are introduced when breaking changes are required
- Old versions are deprecated with a 6-month sunset period
- Deprecation headers are added: `Deprecation: true`, `Sunset: <date>`

---

## OpenAPI Documentation

Every service generates OpenAPI 3.1 documentation at:

```
GET /docs           # Swagger UI
GET /openapi.json   # OpenAPI spec
```

---

## Health Endpoints

Every service exposes:

```
GET /health          # Liveness check
GET /health/ready    # Readiness check (includes DB check)
GET /metrics         # Prometheus metrics
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600
}
```

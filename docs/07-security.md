# 07 — Security

## Security Model

The platform implements **defense in depth** with multiple security layers:

1. **Network** — WAF, DDoS protection, TLS termination
2. **Gateway** — JWT validation, rate limiting, IP allow-listing
3. **Application** — input validation, RBAC, tenant isolation
4. **Database** — Row-Level Security, encrypted fields
5. **Infrastructure** — secrets management, network policies

---

## Authentication

### OAuth2 / OIDC (Keycloak)

All user authentication flows through Keycloak:

- **Authorization Code Flow** — web applications
- **PKCE** — SPAs and mobile apps
- **Client Credentials** — server-to-server
- **Refresh Token Rotation** — for long-lived sessions

### JWT Tokens

```json
{
  "sub": "user_uuid",
  "tenant_id": "tenant_uuid",
  "roles": ["sales_rep", "manager"],
  "permissions": ["customer:read", "lead:write"],
  "exp": 1735689600,
  "iss": "https://auth.example.com"
}
```

- Access tokens expire in **15 minutes**
- Refresh tokens expire in **7 days**
- Tokens are validated at Kong Gateway before reaching services

### API Keys

- Generated for server-to-server integrations
- Stored as bcrypt hash in the database
- Scoped to specific resources and actions
- Can be revoked at any time

---

## Authorization (RBAC)

### Roles

| Role | Description |
|---|---|
| `super_admin` | Platform-level admin (cross-tenant) |
| `tenant_admin` | Full access within a tenant |
| `manager` | Team management and reporting |
| `sales_rep` | CRM operations |
| `support_agent` | Customer support only |
| `readonly` | Read-only access |
| `api_client` | Server-to-server access |

### Permissions

Permissions follow the pattern `{resource}:{action}`:

```
customer:read
customer:write
customer:delete
lead:read
lead:write
opportunity:create
report:view
admin:user_management
```

### Tenant Isolation

Every API call enforces tenant isolation:

1. JWT contains `tenant_id`
2. Kong Gateway passes `X-Tenant-ID` header to services
3. Application layer adds `tenant_id` filter to all queries
4. PostgreSQL RLS enforces at database level

---

## Input Validation

All request data is validated before processing:

- **Schema validation** — Zod (Node.js) / Pydantic (Python)
- **Sanitization** — strip HTML, trim whitespace
- **File uploads** — type checking, size limits, virus scanning

```typescript
const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  tenantId: z.string().uuid(),
});
```

---

## Data Protection

### Encryption at Rest

- Database: PostgreSQL encryption via pgcrypto for sensitive fields
- Files: MinIO server-side encryption (AES-256)
- Secrets: Kubernetes Secrets (encrypted in etcd)

### Encryption in Transit

- All external traffic: TLS 1.3
- Internal service-to-service: mTLS via service mesh
- Database connections: TLS certificates required

### PII Handling

- PII fields are tagged in the data model
- PII is never logged
- Data export/deletion supports GDPR right-to-erasure

---

## Secrets Management

### Local Development

- Secrets stored in `.env.local` (never committed)
- `.env.example` contains placeholder values

### Production

- Kubernetes Secrets for service credentials
- HashiCorp Vault for dynamic secrets (database credentials)
- Secrets rotated automatically every 30 days

---

## Rate Limiting

Configured at Kong Gateway:

| Endpoint Type | Limit |
|---|---|
| Public API | 100 req/min per IP |
| Authenticated API | 1000 req/min per user |
| AI endpoints | 60 req/min per user |
| Webhook endpoints | 500 req/min per tenant |

---

## Security Headers

All HTTP responses include:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Audit Logging

All security-relevant actions are logged:

- User authentication (login, logout, failed attempts)
- Permission changes
- Data access for sensitive records
- API key creation and revocation
- Tenant configuration changes

Audit logs are:
- Immutable (append-only)
- Retained for 2 years
- Exportable for compliance

---

## Vulnerability Management

- **Dependency scanning**: Dependabot + Trivy in CI/CD
- **SAST**: CodeQL on every PR
- **DAST**: OWASP ZAP on staging deployments
- **Container scanning**: Trivy before image push
- **Penetration testing**: Annual third-party assessment

---

## Incident Response

1. **Detect** — alerts via Grafana / PagerDuty
2. **Contain** — revoke affected tokens/keys, isolate service
3. **Investigate** — review audit logs, trace requests
4. **Remediate** — patch, deploy, rotate secrets
5. **Report** — notify affected tenants within 72 hours (GDPR)

---

## Compliance

| Standard | Status |
|---|---|
| GDPR | Data processing, right to erasure, DPA |
| SOC 2 Type II | Access controls, audit logging |
| ISO 27001 | Information security management |
| OWASP Top 10 | Mitigations implemented |

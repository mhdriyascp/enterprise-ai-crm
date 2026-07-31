# 13 — Deployment

## Environments

| Environment | Purpose | Infrastructure |
|---|---|---|
| `local` | Developer machines | Docker Compose |
| `development` | Shared dev environment | Kubernetes (dev cluster) |
| `staging` | Pre-production testing | Kubernetes (staging cluster) |
| `production` | Live system | Kubernetes (prod cluster) |

---

## Local Development

Start the full environment with a single command:

```bash
docker compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Kafka + Zookeeper (port 9092)
- Qdrant (port 6333)
- OpenSearch (port 9200)
- MinIO (port 9000)
- Keycloak (port 8080)
- Kong Gateway (port 8000)
- Prometheus (port 9090)
- Grafana (port 3000)
- Langfuse (port 3030)
- All placeholder microservices

---

## Container Images

Each service has a multi-stage Dockerfile:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
```

Images are tagged:
- `ghcr.io/mhdriyascp/crm-{service}:{git-sha}` — immutable
- `ghcr.io/mhdriyascp/crm-{service}:latest` — latest on main branch
- `ghcr.io/mhdriyascp/crm-{service}:v1.2.3` — release tags

---

## Kubernetes

### Cluster Structure

```
kubernetes/
├── base/                    # Base manifests (kustomize)
│   ├── namespace.yaml
│   ├── {service}/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   └── hpa.yaml
│
├── overlays/
│   ├── development/         # Dev-specific overrides
│   ├── staging/             # Staging overrides
│   └── production/          # Prod overrides
│
└── helm/                    # Helm charts
    ├── crm-platform/        # Umbrella chart
    └── charts/              # Individual service charts
```

### Standard Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: customer-service
  namespace: crm
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: customer-service
          image: ghcr.io/mhdriyascp/crm-customer:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: customer-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: customer-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## GitOps with Argo CD

Production deployments use **Argo CD** for GitOps:

```
Developer → git push → GitHub Actions (CI) → Build & Push Image
                                           → Update image tag in k8s/
                                           → Argo CD detects change
                                           → Syncs to Kubernetes cluster
```

Argo CD configuration:
```yaml
# infrastructure/argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: crm-platform
spec:
  source:
    repoURL: https://github.com/mhdriyascp/enterprise-ai-crm
    targetRevision: HEAD
    path: kubernetes/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: crm
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

---

## CI/CD Pipeline

See [`.github/workflows/`](../.github/workflows/) for full pipeline configuration.

**Pull Request Pipeline:**
1. Lint and type check
2. Unit tests
3. Build Docker image (no push)
4. Security scan (Trivy, CodeQL)

**Main Branch Pipeline:**
1. All PR steps above
2. Push Docker image to GHCR
3. Run integration tests
4. Deploy to development environment
5. Run E2E tests

**Release Pipeline (tag push):**
1. All main branch steps
2. Deploy to staging
3. Run full test suite including load tests
4. Manual approval gate
5. Deploy to production
6. Smoke tests

---

## Database Migrations in CI/CD

Migrations run as a Kubernetes Job before deployment:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: migrate-customer-service
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: ghcr.io/mhdriyascp/crm-customer:latest
          command: ["node", "dist/migrate.js"]
      restartPolicy: Never
```

---

## Secret Management

| Environment | Tool |
|---|---|
| Local | `.env.local` files |
| Kubernetes | Kubernetes Secrets (encrypted at rest) |
| Production | HashiCorp Vault + External Secrets Operator |

---

## Rollback Procedure

```bash
# Kubernetes rollback
kubectl rollout undo deployment/customer-service -n crm

# Argo CD rollback
argocd app rollback crm-platform --revision <previous>

# Database rollback (manual, prepared in advance)
pnpm db:migrate:rollback --to <migration_id>
```

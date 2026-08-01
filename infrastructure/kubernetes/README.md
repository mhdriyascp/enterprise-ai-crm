# Kubernetes Manifests

Kustomize-based Kubernetes manifests for the Enterprise AI CRM platform.

## Layout

```
infrastructure/kubernetes/
├── base/                     # Environment-agnostic manifests
│   ├── namespace.yaml
│   ├── configmap.yaml        # Shared non-secret configuration
│   ├── secret.yaml           # Placeholder secrets (replace via a secrets manager)
│   ├── services/             # One Deployment + Service per backend service
│   └── kustomization.yaml
└── overlays/
    ├── development/          # 1 replica, debug logging, namespace crm-development
    └── production/           # 3 replicas, info logging, namespace crm-production
```

## Usage

Render manifests without applying:

```bash
kustomize build infrastructure/kubernetes/overlays/development
```

Apply to a cluster:

```bash
kubectl apply -k infrastructure/kubernetes/overlays/development
```

## Images

Deployments reference `ghcr.io/mhdriyascp/crm-<service>:latest`. The CD pipeline
pins these to an immutable `sha-<short>` tag per deploy (see
`.github/workflows/cd.yml`).

## Secrets

`base/secret.yaml` contains **placeholders only**. In real environments, provide
secrets via Sealed Secrets, External Secrets Operator, or Vault — never commit
real credentials.

## Phase

Implemented in **Phase 21** of the development roadmap.

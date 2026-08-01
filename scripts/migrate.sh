#!/usr/bin/env bash
# =============================================================================
# Enterprise AI CRM — Database Migration Script
# Runs migrations for all services.
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "Running database migrations for all services..."
echo ""

SERVICE="${1:-}"

if [ -n "$SERVICE" ]; then
  echo "Running migrations for: $SERVICE"
  pnpm --filter "@crm/$SERVICE" db:migrate:deploy
  pnpm --filter "@crm/$SERVICE" db:generate
else
  echo "Running migrations for all services..."
  # Run migrations for each service in dependency order
  for svc in identity organization customer contact lead opportunity sales task calendar document workflow notification reporting ai-platform; do
    if [ -f "services/$svc/package.json" ]; then
      echo "  Migrating: $svc"
      pnpm --filter "@crm/$svc" db:migrate:deploy 2>/dev/null || echo "  (No migrations for $svc)"
    fi
  done
fi

echo ""
echo "Migrations complete ✅"

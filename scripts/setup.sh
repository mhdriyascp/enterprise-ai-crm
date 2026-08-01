#!/usr/bin/env bash
# =============================================================================
# Enterprise AI CRM — Initial Setup Script
# Run this once after cloning the repository.
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==================================================================="
echo "  Enterprise AI CRM — Development Environment Setup"
echo "==================================================================="
echo ""

# ---------------------------------------------------------------------------
# Check prerequisites
# ---------------------------------------------------------------------------
check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌  $1 is required but not installed."
    echo "    See: $2"
    exit 1
  fi
  echo "✅  $1 found ($(command -v "$1"))"
}

echo "Checking prerequisites..."
check_command "node" "https://nodejs.org"
check_command "pnpm" "npm install -g pnpm"
check_command "docker" "https://docker.com"
check_command "docker" "Docker Compose v2 required"

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌  Node.js 20+ is required. Found: $(node --version)"
  exit 1
fi

# Check pnpm version
PNPM_VERSION=$(pnpm --version | cut -d. -f1)
if [ "$PNPM_VERSION" -lt 9 ]; then
  echo "❌  pnpm 9+ is required. Found: $(pnpm --version)"
  exit 1
fi

echo ""
echo "All prerequisites satisfied ✅"
echo ""

# ---------------------------------------------------------------------------
# Set up environment files
# ---------------------------------------------------------------------------
echo "Setting up environment files..."

setup_env() {
  local path="$1"
  local example="${path}.example"
  if [ -f "$example" ] && [ ! -f "$path" ]; then
    cp "$example" "$path"
    echo "  ✅  Created $path"
  fi
}

for svc_dir in services/*/; do
  setup_env "${svc_dir}.env.local"
done

echo ""

# ---------------------------------------------------------------------------
# Install Node.js dependencies
# ---------------------------------------------------------------------------
echo "Installing Node.js dependencies..."
pnpm install

echo ""

# ---------------------------------------------------------------------------
# Set up Git hooks
# ---------------------------------------------------------------------------
echo "Setting up Git hooks..."
pnpm prepare 2>/dev/null || echo "  (Husky not yet installed — will set up on first run)"

echo ""

# ---------------------------------------------------------------------------
# Start Docker services
# ---------------------------------------------------------------------------
echo "Starting Docker services..."
docker compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo "==================================================================="
echo "  Setup Complete! 🎉"
echo "==================================================================="
echo ""
echo "Next steps:"
echo "  1. Run database migrations: ./scripts/migrate.sh"
echo "  2. Seed development data:   ./scripts/seed.sh"
echo "  3. Start all services:      pnpm dev"
echo ""
echo "Service URLs:"
echo "  Kong API Gateway:  http://localhost:8000"
echo "  Keycloak:          http://localhost:8080"
echo "  Kafka UI:          http://localhost:8090"
echo "  MinIO Console:     http://localhost:9001"
echo "  Grafana:           http://localhost:3001"
echo "  Prometheus:        http://localhost:9090"
echo "  Langfuse:          http://localhost:3030"
echo ""

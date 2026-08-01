#!/usr/bin/env bash
# =============================================================================
# Enterprise AI CRM — Development Data Seeder
# Seeds the database with realistic development data.
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "Seeding development data..."
echo ""

echo "  Creating demo tenant..."
# TODO: Run seed scripts once services are implemented
# pnpm --filter "@crm/identity" db:seed

echo "  Creating demo users..."
echo "  Creating sample customers..."
echo "  Creating sample leads..."
echo "  Creating sample opportunities..."
echo ""

echo "Seed data placeholder — implement per service when building Phase 6+"
echo ""
echo "Demo credentials (after identity service is implemented):"
echo "  Admin:   admin@demo.crm.local / demo_admin_password"
echo "  Manager: manager@demo.crm.local / demo_password"
echo "  Rep:     rep@demo.crm.local / demo_password"
echo ""
echo "Done ✅"

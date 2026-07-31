#!/usr/bin/env bash
# =============================================================================
# Enterprise AI CRM — Health Check Script
# Checks the health of all running services.
# =============================================================================

set -euo pipefail

echo "==================================================================="
echo "  Enterprise AI CRM — Service Health Check"
echo "==================================================================="
echo ""

check_http() {
  local name="$1"
  local url="$2"
  
  if curl -sf "$url" -o /dev/null 2>/dev/null; then
    echo "  ✅  $name"
  else
    echo "  ❌  $name ($url)"
  fi
}

check_tcp() {
  local name="$1"
  local host="$2"
  local port="$3"
  
  if nc -z "$host" "$port" 2>/dev/null; then
    echo "  ✅  $name"
  else
    echo "  ❌  $name ($host:$port)"
  fi
}

echo "Infrastructure:"
check_tcp   "PostgreSQL" "localhost" "5432"
check_tcp   "Redis" "localhost" "6379"
check_tcp   "Kafka" "localhost" "9092"
check_http  "Qdrant" "http://localhost:6333/healthz"
check_http  "OpenSearch" "http://localhost:9200/_cluster/health"
check_http  "MinIO" "http://localhost:9000/minio/health/live"
check_http  "Keycloak" "http://localhost:8080/health/ready"
check_http  "Kong" "http://localhost:8001/status"
check_http  "Prometheus" "http://localhost:9090/-/healthy"
check_http  "Grafana" "http://localhost:3001/api/health"
check_http  "Langfuse" "http://localhost:3030/api/public/health"
echo ""

echo "Microservices:"
check_http  "Identity Service" "http://localhost:3100/health"
check_http  "Customer Service" "http://localhost:3101/health"
check_http  "Lead Service" "http://localhost:3102/health"
check_http  "Opportunity Service" "http://localhost:3103/health"
check_http  "AI Platform" "http://localhost:3200/health"
echo ""

echo "Kafka UI: http://localhost:8090"
echo "MinIO Console: http://localhost:9001"
echo ""

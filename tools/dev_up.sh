#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   cp .env.example .env
#   ./tools/dev_up.sh
#
# Was es macht:
# 1) Startet DB
# 2) Synchronisiert Schema -> DB (prisma db push)
# 3) Startet API + Worker + Web
# 4) Ruft /api/health auf und führt den API Smoke Test aus

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f ".env" ]; then
  echo "Missing .env. Create it first: cp .env.example .env"
  exit 2
fi

echo "[1/4] Start DB"
docker compose --env-file .env -p infra -f infra/docker-compose.yml up -d db

echo "[2/4] Sync DB schema (Prisma db push)"
docker compose --env-file .env -p infra -f infra/docker-compose.yml run --rm api sh -lc "npx prisma db push"

echo "[3/4] Start API + Worker + Web"
docker compose --env-file .env -p infra -f infra/docker-compose.yml up -d api worker web

echo "[4/4] Smoke test (through web proxy on WEB_PORT)"
BASE_URL="http://localhost:${WEB_PORT:-8080}" EMAIL="${INITIAL_ADMIN_EMAIL:-admin@example.com}" PASSWORD="${INITIAL_ADMIN_PASSWORD:-admin123}" ./tools/smoke_api.sh

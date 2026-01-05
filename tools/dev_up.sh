#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f ".env" ]; then
  echo "Missing .env. Create it first: cp .env.example .env"
  exit 2
fi

echo "[1/4] Start DB"
./tools/dc.sh up -d db

echo "[2/4] Sync DB schema (Prisma db push)"
./tools/dc.sh run --rm api sh -lc "npx prisma db push"

echo "[3/4] Start API + Worker + Web"
./tools/dc.sh up -d api worker web

echo "[4/4] Smoke test (through web proxy on WEB_PORT)"
BASE_URL="http://localhost:${WEB_PORT:-8080}" EMAIL="${INITIAL_ADMIN_EMAIL:-admin@example.com}" PASSWORD="${INITIAL_ADMIN_PASSWORD:-admin123}" ./tools/smoke_api.sh

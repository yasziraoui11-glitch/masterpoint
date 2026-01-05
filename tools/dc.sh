#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f ".env" ]; then
  echo "Missing .env. Create it first: cp .env.example .env"
  exit 2
fi

docker compose --env-file .env -p infra -f infra/docker-compose.yml "$@"

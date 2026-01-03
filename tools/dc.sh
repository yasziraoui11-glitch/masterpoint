#!/usr/bin/env bash
set -euo pipefail

# Einheitlicher Wrapper:
# - nutzt immer .env
# - nutzt immer Projektname "infra"
# - nutzt immer infra/docker-compose.yml
#
# Beispiele:
#   ./tools/dc.sh ps
#   ./tools/dc.sh up -d db
#   ./tools/dc.sh logs --tail=200 api
#   ./tools/dc.sh down -v

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f ".env" ]; then
  echo "Missing .env. Create it first: cp .env.example .env"
  exit 2
fi

docker compose --env-file .env -p infra -f infra/docker-compose.yml "$@"

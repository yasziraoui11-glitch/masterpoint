#!/usr/bin/env bash
set -euo pipefail

# Stoppt Stack und löscht Volumes (clean slate)
docker compose --env-file .env -p infra -f infra/docker-compose.yml down -v

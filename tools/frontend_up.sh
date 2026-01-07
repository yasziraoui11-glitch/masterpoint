#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

docker rm -f mp-frontend >/dev/null 2>&1 || true

docker run -d --name mp-frontend --restart unless-stopped   -p 5173:5173   -v "$ROOT/frontend:/app"   -w /app   node:20-bookworm-slim   sh -lc "npm install && npm run dev -- --host 0.0.0.0 --port 5173"

echo "Frontend: http://localhost:5173"

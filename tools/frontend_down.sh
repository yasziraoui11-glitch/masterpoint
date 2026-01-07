#!/usr/bin/env bash
set -euo pipefail

docker rm -f mp-frontend >/dev/null 2>&1 || true
echo "frontend stopped"

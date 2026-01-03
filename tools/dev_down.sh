#!/usr/bin/env bash
set -euo pipefail

# Stoppt Stack und löscht Volumes (clean slate)
./tools/dc.sh down -v

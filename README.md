# MASTERPOINT (masterpoint_production_fixed)

## Local Quickstart

### Prerequisites
- Docker Desktop running
- Node is NOT required locally (everything runs in containers)

### 1) Create .env
```bash
cp .env.example .env
```

### 2) Start stack + run smoke test
```bash
./tools/dev_up.sh
```

### 3) Stop stack + wipe volumes (clean slate)
```bash
./tools/dev_down.sh
```

## Compose wrapper
```bash
./tools/dc.sh ps
./tools/dc.sh logs --tail=200 api
./tools/dc.sh down -v
```

## Endpoints (via web proxy)
- Health: http://localhost:${WEB_PORT:-8080}/api/health
- OpenAPI JSON: http://localhost:${WEB_PORT:-8080}/api/openapi.json
- OpenAPI YAML: http://localhost:${WEB_PORT:-8080}/api/openapi.yaml

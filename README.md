# MASTERPOINT – Production Template

This repository is a production-oriented baseline:
- Postgres persistence (no JSON files)
- Prisma migrations
- Separate API + Worker process
- Docker + docker-compose (prod + local)
- Structured logging, health/readiness, security middleware
- OpenAPI/Swagger

## Quick start (local)
```bash
cp infra/.env.example .env
docker compose up --build
```

API:
- http://localhost:3000/health
- http://localhost:3000/ready
- http://localhost:3000/docs

Frontend:
- http://localhost:8080

## Production
Use `docker compose -f infra/docker-compose.prod.yml up -d` after providing real secrets and domain settings.

## Notes (cannot be auto-verified here)
Production readiness still depends on your environment (TLS, DNS, secrets management, backups, monitoring).

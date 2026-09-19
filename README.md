# Study Planner

Production rebuild of the "Scholar Pulse" design-tool prototype.

## Layout
- `backend/` — Node/Express REST API, PostgreSQL via Prisma, JWT auth (see [backend/README.md](backend/README.md))
- `frontend/` — React + TypeScript + Tailwind client (coming next)

## Local Postgres
`docker compose up -d` starts a local Postgres instance matching `backend/.env.example`.

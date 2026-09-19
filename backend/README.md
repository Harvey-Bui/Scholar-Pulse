# Study Planner API

## Setup
1. Copy `.env.example` to `.env` and adjust values (at minimum, set a real `JWT_ACCESS_SECRET`).
2. Start Postgres: `docker compose up -d` (from the repo root), or point `DATABASE_URL` at your own instance.
3. Install dependencies: `npm install`
4. Run migrations: `npx prisma migrate dev --name init`
5. Seed demo data: `npm run seed` (creates `demo@scholarpulse.app` / `demo1234` with sample courses/tasks/sessions)
6. Start the dev server: `npm run dev` — listens on `http://localhost:4000`

## Auth model
JWT access token (15 min) + opaque refresh token (30 days, rotated on use, revocable), both set as `httpOnly` cookies (`accessToken`, `refreshToken`). The frontend must call the API with `credentials: 'include'` and be served from the origin set in `CORS_ORIGIN`.

## Background jobs
The notifications generator runs in-process every 15 minutes via `node-cron` (see `src/jobs/notifications.job.ts`) — no external scheduler needed for now.

## Known simplification
"Today", streak, and weekly-hours boundaries are computed from the **server's** local clock, same simplification the original prototype made in the browser. If users can be in different timezones than the server, add a `timezone` field to `User` and compute boundaries per-user before shipping broadly.

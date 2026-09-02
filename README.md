# Delok Backend

**Delok** is a log monitoring platform for collecting, storing, searching, and streaming structured application logs. This repository is the **backend service** — it owns authentication, organization/project management, API-key-scoped log ingestion, PostgreSQL persistence, and authenticated WebSocket realtime delivery to the Delok dashboard.

## Overview

The backend exposes two authentication surfaces:

- **Session auth (Better Auth)** for human users — email/password (with verification), Google OAuth, GitHub OAuth. Used by all management APIs (organizations, projects, API keys, log queries).
- **API-key auth (`x-api-key: dlok_…`)** for machine ingestion — used only by `POST /api/ingestion`. Keys are `dlok_` + 32 random bytes (SHA-256 hashed at rest, `keyHash @unique`), revocable via `revokedAt`, with throttled `lastUsedAt`.

Ingested logs are normalized, stored in PostgreSQL, and broadcast over WebSocket (`log.created` + `project.log_count.updated`) to clients subscribed to that `projectId`.

## Architecture

Layered monolith with vertical modules (`src/modules/*`). Dependencies flow downward: Routes → Middleware → Controllers → Services → Authorization (`ensure*`) → Repositories → Prisma → PostgreSQL. Cross-cutting concerns live in `src/middlewares/`, `src/lib/` (singletons), and `src/infrastructure/realtime/`.

```
SDK → POST /api/ingestion (x-api-key, rate-limited 120/min) → validate → service (hash+lookup, revoked check) → Prisma LogEvent → realtime.emit
Browser → Better Auth session → /api/organization, /api/organizations/:slug/projects, /api/projects/:projectId/logs|api-keys, /api/api-key → authMiddleware → validate → service + ensure* → Prisma
Browser ── WS upgrade (session-authenticated, server.ts) ── subscribe {projectId} (ensureProjectMember) ── realtime log.created / log_count.updated
```

See [Architecture Overview](docs/architecture/overview.md), [Request Flow](docs/architecture/request-flow.md), and [Dependency Rules](docs/architecture/dependency-rules.md).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js >=22, TypeScript 6 (ESM, `tsx watch`), Express 5 |
| Database | PostgreSQL, Prisma 7 (`@prisma/adapter-pg`), `prisma.config.ts` multi-schema (`prisma/schema/*.prisma`) |
| Auth | `better-auth` 1.6.23 (Prisma adapter, email/password + Google/GitHub OAuth, Resend email) |
| Realtime | `ws` 8 (authenticated upgrade, `Set<string>` subscriptions, 30s ping/pong) |
| Validation | `zod` 4 |
| Hardening | `helmet`, `cors` (origin `FRONTEND_URL`), `express-rate-limit` (auth per-path + ingestion 120/min) |
| Testing | `vitest`, `supertest` |

## Repository Structure

```
delok-backend/
├── prisma/
│   ├── schema/          # schema.prisma + auth/organization/project/log-event.prisma
│   └── migrations/      # timestamped SQL migrations
├── src/
│   ├── app.ts / server.ts
│   ├── lib/             # env, prisma, auth, resend singletons
│   ├── middlewares/     # auth, validate, error, rate-limit/*
│   ├── modules/         # organization, project, api-key, ingestion, log-event, auth, user
│   ├── infrastructure/realtime/  # websocket, realtime.service, event.types
│   ├── features/auth/   # passwordSchema
│   ├── utils/           # AppError, async-handler, api-response, hash, generate-slug
│   ├── types/           # express.d.ts (req.session)
│   └── generated/prisma/ # generated client (output from schema.prisma)
├── docs/                # architecture, api, backend, database, guides, decisions
├── Dockerfile           # node:22-alpine builder → runner, HEALTHCHECK /health
├── package.json
└── .env.example
```

See [Folder Structure](docs/architecture/folder-structure.md).

## Prerequisites

- Node.js **>=22** (`engines` in `package.json`; Docker uses `node:22-alpine`)
- PostgreSQL 14+ (or hosted equivalent)
- npm (lockfile `package-lock.json`)

## Getting Started

```bash
git clone <repo-url>
cd delok-backend
npm install

# 1. Environment — copy and fill secrets (see Configuration)
cp .env.example .env

# 2. Database — apply migrations
npm run db:migrate:dev

# 3. Generate Prisma Client (if needed after schema changes)
npm run db:generate

# 4. Dev server (auto-restart)
npm run dev
# → Server listening at http://0.0.0.0:8000 [development]

# 5. Verify
curl http://localhost:8000/health        # { status: "ok", uptime }
curl http://localhost:8000/readiness     # { status: "ready" } or 503 db_unavailable
npm run type-check                        # tsc --noEmit
```

See [Setup Guide](docs/guides/setup.md).

## Available Commands

Verified from `package.json` `scripts`:

| Command | Description |
|---------|-------------|
| `npm run dev` | `tsx watch src/server.ts` — dev with auto-restart |
| `npm run type-check` | `tsc --noEmit` (strict) |
| `npm run build` | `prisma generate && tsc` → `dist/` (used by Dockerfile) |
| `npm start` | `node dist/server.js` |
| `npm test` | `vitest run` |
| `npm run db:generate` | `prisma generate` (client to `src/generated/prisma`) |
| `npm run db:migrate:dev` | `prisma migrate dev` (dev, uses `prisma.config.ts`) |
| `npm run db:migrate` | `prisma migrate deploy` (production/CI, non-interactive) |

## Configuration

Loaded via `dotenv/config` in `server.ts` and validated fail-fast in [`src/lib/env.ts`](src/lib/env.ts) (Zod). Never commit real secrets; use `.env.example` as template.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Session signing secret |
| `BETTER_AUTH_URL` | Yes | Public backend URL (e.g. `http://localhost:8000`) |
| `FRONTEND_URL` | Yes | Frontend origin for CORS `origin`, `trustedOrigins`, `errorURL` |
| `RESEND_API_KEY` | Yes | Resend API key |
| `EMAIL_FROM` | Yes | Verified sender address |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth |
| `PORT` | No | Default `8000` |
| `NODE_ENV` | No | `development` / `production` / `test` (default `development`) |

## API

| Area | Base path | Auth | Docs |
|------|-----------|------|------|
| Ingestion (SDK) | `POST /api/ingestion` | `x-api-key` (rate-limited 120/min per key) | [Ingestion API](docs/api/ingestion.md) |
| Organizations | `/api/organization` (CRUD by slug) | Session | [Organization API](docs/api/organization.md) |
| Projects | `/api/organizations/:organizationSlug/projects` | Session (member read, owner write) | [Project API](docs/api/project.md) |
| API Keys | `/api/projects/:projectId/api-keys` + `/api/api-key/:id` | Session (owner only; raw key returned once) | [API Key API](docs/api/api-key.md) |
| Logs | `GET /api/projects/:projectId/logs` (paginated, filterable) | Session (member) | [Log Event API](docs/api/log-event.md) |
| User | `GET /api/user/me` | Session | [User API](docs/api/user.md) |
| Auth | `/api/auth/*` (Better Auth + `POST /api/auth/resend-verification`) | Mixed / rate-limited per-path | [Authentication](docs/backend/authentication.md) |
| Ops | `GET /health`, `GET /readiness`, `GET /` | Public | `src/app.ts` |
| Realtime | WS upgrade (session required) + `project.subscribe` | Session + `ensureProjectMember` | [Realtime](docs/backend/realtime.md) |

Validation via Zod (`validate` middleware for bodies); error shape `{ success:false, error:{code,message}, timestamp }` (see [Error Handling](docs/backend/error-handling.md), [Validation](docs/backend/validation.md)).

## Database

PostgreSQL via Prisma 7 multi-schema (`prisma/schema/`). Models: `User`, `Session`, `Account`, `Verification` (Better Auth); `Organization`, `OrganizationMember` (`OWNER`/`MEMBER`); `Project` (case-insensitive unique name per org via `lower(name)` index); `ApiKey` (hashed, `revokedAt` soft-delete); `LogEvent` (indexed `[projectId, occurredAt]` / `[projectId, level]`). Cascades: org → projects → keys/logs; user deletion `SetNull` on `ApiKey.createdBy`.

See [Schema](docs/database/schema.md), [Relationships](docs/database/relationships.md), [Migrations](docs/database/migrations.md).

## Development

- **Module convention:** `*.route.ts` → `authMiddleware` → `validate(schema)` → `asyncHandler(controller)` → `*.service.ts` → `ensure*` (`*.authorization.ts`) → `*.repository.ts` (Prisma only). See [Create a Module](docs/guides/create-module.md) and [Create a Route](docs/guides/create-route.md).
- **Validation / error handling / authz:** [Validation](docs/backend/validation.md), [Error Handling](docs/backend/error-handling.md), [Authorization](docs/backend/authorization.md).
- **Style:** kebab-case `<domain>.<layer>.ts`, named exports only, no barrel files; see [Coding Style](docs/guides/coding-style.md).

## Testing

Framework: `vitest` (`npm test` → `vitest run`) with `supertest` and `@types/supertest`. Config: [`vitest.config.ts`](vitest.config.ts). No coverage thresholds enforced.

## Deployment

- Build: `npm run build` (`prisma generate && tsc`)
- Migrate: `npm run db:migrate` before start
- Start: `npm start` (`node dist/server.js`) on `0.0.0.0:$PORT`
- Container: `docker build -t delok-backend . && docker run -e DATABASE_URL=... -p 8000:8000 delok-backend` — multi-stage `builder` → `runner` (`node:22-alpine`), non-root user, `HEALTHCHECK` on `/health`. Requires all env vars at runtime (see [Setup Guide](docs/guides/setup.md)).

## Documentation

| Topic | Link |
|-------|------|
| Architecture | [Overview](docs/architecture/overview.md) · [Folder Structure](docs/architecture/folder-structure.md) · [Request Flow](docs/architecture/request-flow.md) · [Dependency Rules](docs/architecture/dependency-rules.md) |
| API | [Ingestion](docs/api/ingestion.md) · [Log Event](docs/api/log-event.md) · [Organization](docs/api/organization.md) · [Project](docs/api/project.md) · [API Key](docs/api/api-key.md) · [User](docs/api/user.md) |
| Backend | [Authentication](docs/backend/authentication.md) · [Authorization](docs/backend/authorization.md) · [Realtime](docs/backend/realtime.md) · [Validation](docs/backend/validation.md) · [Error Handling](docs/backend/error-handling.md) |
| Database | [Schema](docs/database/schema.md) · [Relationships](docs/database/relationships.md) · [Migrations](docs/database/migrations.md) |
| Guides | [Setup](docs/guides/setup.md) · [Create Module](docs/guides/create-module.md) · [Create Route](docs/guides/create-route.md) · [Coding Style](docs/guides/coding-style.md) |
| Decisions | [ADRs](docs/decisions/001-project-architecture.md) |

## License

[MIT License](./LICENSE) — Copyright (c) 2026 Dan.

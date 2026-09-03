# Delok Backend — Internal Documentation

Internal technical documentation for developers maintaining and extending the Delok backend.

## Structure

| Area | Path | Covers |
|------|------|--------|
| Architecture | `docs/architecture/` | Overview, request flow, dependency rules, folder structure |
| API | `docs/api/` | Ingestion, organization, project, API key, log event, user endpoints |
| Backend | `docs/backend/` | Authentication, authorization, realtime, validation, error handling |
| Database | `docs/database/` | Schema, relationships, migrations |
| Guides | `docs/guides/` | Setup, conventions, creating modules and routes |
| Decisions | `docs/decisions/` | Technical decisions and rationale (ADRs) |

## Index

### Architecture
- [Overview](architecture/overview.md)
- [Request Flow](architecture/request-flow.md)
- [Dependency Rules](architecture/dependency-rules.md)
- [Folder Structure](architecture/folder-structure.md)

### API
- [Ingestion](api/ingestion.md)
- [Organization](api/organization.md)
- [Project](api/project.md)
- [API Key](api/api-key.md)
- [Log Event](api/log-event.md)
- [User](api/user.md)

### Backend
- [Authentication](backend/authentication.md)
- [Authorization](backend/authorization.md)
- [Realtime](backend/realtime.md)
- [Validation](backend/validation.md)
- [Error Handling](backend/error-handling.md)

### Database
- [Schema](database/schema.md)
- [Relationships](database/relationships.md)
- [Migrations](database/migrations.md)

### Guides
- [Setup](guides/setup.md)
- [Create a Module](guides/create-module.md)
- [Create a Route](guides/create-route.md)
- [Coding Style](guides/coding-style.md)

### Decisions
- [001 — Project Architecture](decisions/001-project-architecture.md)
- [002 — Service Layer](decisions/002-service-layer.md)
- [003 — Repository Pattern](decisions/003-repository-pattern.md)
- [004 — Prisma](decisions/004-prisma.md)
- [005 — Validation](decisions/005-validation.md)

## Maintenance

Documentation follows the codebase.

| Change | Review |
|--------|--------|
| Adding a module (`src/modules/<name>`) | `docs/api/<name>.md` or `docs/backend/<name>.md` + `docs/architecture/folder-structure.md` |
| Adding a route (`src/modules/<name>/*.route.ts`) | `docs/api/<name>.md` and `docs/architecture/request-flow.md` |
| Changing auth (`src/lib/auth.ts`, `src/modules/auth/*`, `src/middlewares/auth.middleware.ts`) | `docs/backend/authentication.md` + `docs/api/user.md` |
| Changing authorization (`src/modules/*/authorization.ts`) | `docs/backend/authorization.md` |
| Changing realtime (`src/infrastructure/realtime/*`) | `docs/backend/realtime.md` |
| Changing validation / error handling (`src/middlewares/validate.ts`, `src/middlewares/error.middleware.ts`) | `docs/backend/validation.md` + `docs/backend/error-handling.md` |
| Changing database schema (`prisma/schema/*`) | `docs/database/schema.md` + `docs/database/relationships.md` + `docs/database/migrations.md` |
| Changing dependency rules or folder conventions | `docs/architecture/dependency-rules.md` + `docs/guides/coding-style.md` |
| Changing env / setup (`src/lib/env.ts`, `Dockerfile`) | `docs/guides/setup.md` |

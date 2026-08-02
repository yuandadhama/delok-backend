# ADR-001: Layered Monolithic Project Architecture

Status: Accepted (inferred from current implementation)

## Context

Delok is a log aggregation backend that needs to:
- Authenticate users via multiple methods (email/password, Google OAuth, GitHub OAuth)
- Manage organizations, projects, and scoped API keys
- Accept high-volume log ingestion from external SDKs
- Provide paginated querying of stored logs with filtering
- Broadcast new log events to browser dashboards in real time

**Note on rationale**: Context above is **inferred** from analysis of what the system does. No explicit written rationale was found in the repo.

## Decision

Implement a **layered monolithic architecture** organized by both **horizontal layer** and **vertical module**:

### Horizontal layers (strict top→down dependency):
1. Routes → Express router, middleware wiring
2. Controllers → Extract params, format responses
3. Services → Business logic, authz orchestration
4. Authorization → `ensure*()` helpers
5. Repositories → Prisma persistence only
6. Infrastructure/lib → External SDK singletons, technical adapters

### Vertical modules (each domain is self-contained):
- `modules/organization/`, `modules/project/`, `modules/api-key/`, etc.
- Each contains all layer files for that domain
- Cross-module import limited to authorization helpers only

### Cross-cutting folders:
- `middlewares/` — framework middleware only
- `utils/` — pure helpers (AppError, asyncHandler, hash)
- `infrastructure/` — technical adapters (WebSocket)
- `lib/` — singleton clients (Prisma, Better Auth, Resend, Delok)

## Consequences

### Positive
- Discoverability: All code for a feature lives in one folder
- Test boundaries: Services unit-testable without Express; repositories testable with DB
- DB portability: Only repositories touch Prisma
- Authz composability: Function calls (not middleware) allow multiple checks per service
- Team-scale low merge conflicts: Vertical module seams isolate work

### Negative
- File count overhead: CRUD for one resource = 4–6 files
- Boilerplate per endpoint (3–4 file edits)
- Cross-module coupling at authz boundary: project → org authz, api-key → project authz
- No build/linter enforcement of dependency rules (relies on code review/convention)

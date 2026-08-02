# ADR-004: Prisma as ORM with Multi-File Schema & Driver Adapter

Status: Accepted (inferred from current implementation)

## Context

Node.js ORM options for PostgreSQL include:
- **Prisma** — type-safe query builder with schema-first migrations, generated client
- **TypeORM / MikroORM** — decorator-based entities, DataMapper or Active Record
- **Raw drivers (node-postgres) + SQL query builders (Knex)** — maximum control, more boilerplate

Secondary choices once Prisma is selected:
- Single monolithic `schema.prisma` vs Prisma 7's multi-schema folders
- Built-in Prisma driver vs dedicated `@prisma/adapter-pg` driver adapter
- Client output location (default `node_modules/.prisma` vs project-local `src/generated/prisma`)
- Migration storage (standard `prisma/migrations/` path)

Delok's specific requirements:
- Need model types to be immediately importable in TypeScript code with `strict: true`
- Domain-oriented: models naturally cluster (auth models, org/project, log event)
- PostgreSQL-only (no DB portability requirement)
- High-volume log event table needs robust migration generation and index management
- Team benefits from auto-generated CRUD types on all relations

**Note on rationale**: Context/decision are **inferred** from codebase. No explicit decision record found.

## Decision

1. **ORM choice: Prisma.** The application accesses PostgreSQL exclusively through Prisma's generated client. No raw `node-postgres` queries exist in application code; SQL is only generated during migrations.
2. **Driver adapter: `@prisma/adapter-pg`.** The PrismaClient is constructed with a `new PrismaPg({ connectionString })` adapter instead of the built-in driver.
3. **Prisma 7 multi-file schema folder instead of single schema file:**
   ```
   prisma/schema/
   ├── schema.prisma           # generator + datasource only
   ├── auth.prisma             # User, Session, Account, Verification
   ├── organization.prisma     # Organization, OrganizationMember, enum
   ├── project.prisma          # Project, ApiKey
   └── log-event.prisma        # LogEvent
   ```
   Configuration via `prisma.config.ts` pointing at the folder.
4. **Prisma Client output at `src/generated/prisma/`** (not the default `node_modules/.prisma/client`). Configured via `output = "../../src/generated/prisma"` in the generator block.
5. **Database-first migrations**: `prisma migrate dev` auto-generates migrations from schema diffs; migration SQL is committed to the repo.
6. **PostgreSQL enum types** for `OrganizationRole` — applied via migration `add_organization_role_enum` which converted the earlier text-based representation to a native PG enum.
7. **CUID primary keys for domain entities**, UUID for User (Better Auth default).
8. **Index strategy explicitly declared in schema** — compound indexes `@@index([projectId, occurredAt])` and `@@index([projectId, level])` declared directly in LogEvent model so migrations create them automatically.

## Consequences

### Positive
- **Type-safe DB access end-to-end**: `prisma.logEvent.findMany(...)` returns fully typed objects. TS strict mode catches any misuse of columns.
- **Multi-file schema matches module structure**: Adding a Team model means editing `organization.prisma` or adding `team.prisma` — not scrolling a 500-line schema file. Merge conflicts across domain areas are effectively eliminated.
- **Project-local generated client**: `src/generated/prisma` appears in IDE search, no "can't find @prisma/client path" confusion across ESM/Bundler moduleResolution settings, and output is regenerated explicitly via `prisma:generate`.
- **Adapter-pg**: Using the dedicated PostgreSQL adapter (default in Prisma 7 era, optional earlier) gives parameterized queries and PG-specific features while keeping the Prisma query API.
- **Migrations are auditable SQL**: The history of every schema change (including cascading `ON DELETE` application, enum adoption, ApiKey hardening) is visible as `migration.sql` files. Operators can review exactly what DDL runs.
- **Expressive index declarations**: LogEvent indexes directly in the model file, ensuring queries and indexes stay in sync as the schema evolves.

### Negative
- **Black-box SQL generation**: Developers do not hand-write queries for complex filtering; sometimes you must trust the query planner or use `$queryRaw` escape hatch (not observed today, but available).
- **Multi-file Prisma requires Prisma 7+**: If a developer on Prisma 6 opens this project they will not understand the folder schema. Migration `prisma.config.ts` is additional surface area.
- **Migration history has noisy "fix-up" entries**. The `20260709041024 → 20260709042347` (org/project back-to-back) and `20260714081526 → 20260714081715` (log-event back-to-back) migrations suggest the team occasionally generated a migration, realized something was missing, and generated a second one quickly. This is harmless but leaves a "ragged" migration timeline.
- **Mixed ID strategy** (UUID for users, CUID elsewhere) requires remembering which is which. There is no documented reason for the split; it's likely inherited from Better Auth using UUID for User internally and CUID chosen for other domain entities.
- **Prisma-specific schema lock-in**. Switching ORMs requires rewriting all repositories and hand-writing a migration generator.

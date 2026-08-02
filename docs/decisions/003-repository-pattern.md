# ADR-003: Repository Pattern for Persistence

Status: Accepted (inferred from current implementation)

## Context

Express + TypeScript projects commonly access the database in one of three styles:
1. **Inline Prisma in handlers**: `prisma.user.findMany(...)` directly in the controller/route
2. **Model classes with static methods**: `UserRepo.findAll()` wrapping Prisma
3. **Repository module per domain**: Named functions exported from a dedicated `*.repository.ts` file, one per module

Each pattern has trade-offs:
- Inline queries are fast to write but tightly couple HTTP handlers to Prisma schema and query strategy
- Class-based repositories can introduce stateful objects for what is stateless query composition
- Function-only repositories require discipline but keep concerns maximally separated

**Note on rationale**: Context and decision are **inferred** from the codebase. No explicit decision record was found in the repo.

## Decision

Adopt the **function-only repository pattern** per module:

1. **One repository file per domain module**: `organization.repository.ts`, `project.repository.ts`, etc.
2. **Each file exports only plain named functions** (not classes, not default exports):
   ```typescript
   export const createProject = async (name: string, organizationId: string) =>
     prisma.project.create({ data: { name, organizationId } });
   ```
3. **Semantic naming** over generic CRUD: use `findOrganizationByIdForMember`, `findOwnerMembership`, `findApiKeyByKeyHash` — names that describe the *business reason* for the query, not just the Prisma operation.
4. **No business logic in repositories**:
   - Never throw `AppError`. (Return `null`; caller decides the error shape and code.)
   - Never call authorization helpers.
   - Never emit realtime events or audit logs.
   - Never touch `req`/`res`.
5. **Only `prisma` + generated types imported**: Repositories have no other internal module imports.
6. **Authz-aware query wrappers get a naming suffix** — `findXForMember(id, userId)` encapsulates the "member of the org" join so that authorization helpers can simply call it and throw `AppError("Forbidden", 403)` if null.
7. **Composition**: Query-builder helpers (e.g., `buildLogFilter(filter)`) are separate sibling `.query.ts` files that return `Prisma.XWhereInput` objects; repositories call them internally.

## Consequences

### Positive
- **Maximum Prisma isolation**: If the team ever replaces Prisma with raw SQL/Knex/Drizzle, only the repository files change. Every service + controller call signature stays identical.
- **Readability of business logic**: Reading a service you see `findOwnerMembership(orgId, userId)` instead of a 15-line `prisma.organizationMember.findFirst({ where: {...} })` inline query. The service becomes a checklist of intent, not detail soup.
- **Query optimization is localized**: Adding indexes or rewriting a query to avoid N+1 only requires edits in one repository function; every caller automatically benefits.
- **Query naming documents requirements**: The existence of `findOrganizationByIdForMember(orgId, userId)` (distinct from `findOrganizationById`) self-documents the business rule "get-by-id requires membership check", making code self-documenting.
- **Stateless = trivially testable**: Each repo function is a pure `(args) => Promise<Entity | Entity[] | null | count>`, so mocking or harnessing against a test DB is straightforward.

### Negative
- **Risk of "wrapper bloat"**: Some functions are thin one-liners (`updateOrganization` is just `prisma.organization.update(...)`) and may feel unnecessary; the team must accept this cost for consistency.
- **Authz vs query boundary can blur**: `findXForMember` in repositories encodes *what* data a member can see (the WHERE clause) but the decision of *whether* seeing that data is sufficient is still in `*.authorization.ts`. The split is disciplined but not compiler-enforced.
- **No type-level contract**: Repositories are duck-typed against what services expect. If you change a repository return shape from entity to `{ entity, extra }` the compiler only catches it when the consuming service breaks. (This is equally true of any un-interfaced pattern.)
- **Duplicate function names across modules**: `findAll` in user.repository, `findAllOrganizations` in org.repository — naming consistency relies on convention rather than a single interface.

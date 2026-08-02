# Coding Style Guide

This guide codifies the conventions **actually observed in the repository**. These are not stylistic suggestions — they are inferred from a codebase-wide analysis of naming, imports, file organization, error handling, and validation patterns.

## 1. File Naming

All files use **kebab-case** with a **layer suffix**:
```
<domain>.<layer>.ts
```

| Layer suffix | Used for |
|-------------|----------|
| `.route.ts` | Express Router definition + endpoint wiring |
| `.controller.ts` | HTTP request handlers (thin) |
| `.service.ts` | Business logic + authorization orchestration |
| `.repository.ts` | Prisma queries (persistence only) |
| `.validation.ts` | Zod schemas + inferred types |
| `.authorization.ts` | `ensure*()` access control helpers |
| `.middleware.ts` | Reusable Express middleware |
| `.type.ts` | Type-only files (interfaces/types, no runtime code) |
| `.query.ts` | Query builder helpers (e.g. Prisma `where` composition) |

**Exceptions / deviations observed**:
- Project validation file: `project.validaton.ts` (typo: "validaton" missing an 'i') — retained for consistency; when creating new files use the correct spelling `validation`.
- Routes split across files go in `routes/` subfolder with descriptive names: `<parent-resource>-<child-resource>.route.ts`
  - Example: `organization-project.route.ts` (mounted at `/organizations/:organizationId/projects`)
  - Example: `project.route.ts` (mounted at `/api/project/:id`)

## 2. Function Naming

All functions use **camelCase** with strict naming patterns per layer:

| Layer | Naming pattern | Examples |
|-------|---------------|----------|
| Controller | `<verb><Noun>Controller` | `createOrganizationController`, `getAllOrganizationController`, `getOrganizationByIdController`, `updateOrganizationController`, `deleteOrganizationController` |
| Service | `<verb><Noun>Service` | `createOrganizationService`, `getAllOrganizationService`, etc. |
| Repository | `<operation><Entity>` with CRUD variants: `create*`, `find*`, `update*`, `delete*`, `count*` | `createOrganization`, `findAllOrganizations`, `findOrganizationById`, `findOrganizationByIdForMember`, `findOwnerMembership`, `updateOrganization`, `deleteOrganization` |
| Authorization helper | `ensure<Object><Role>` | `ensureOrganizationMember`, `ensureOrganizationOwner`, `ensureProjectMember`, `ensureProjectManagementAccess` |
| Middleware factory | Verb/noun + `Middleware` or descriptive name | `authMiddleware`, `validate(schema)` (factory), `errorMiddleware`, `authRateLimiter` |
| Pure utility functions | Short verb/noun | `sha256`, `asyncHandler`, `errorResponse` |

**Pattern rules inferred**:
- Use `get*ById` for single-lookup by primary key. Alternatives like `fetch` or `read` are never used.
- Use `findAll*` (not `list*`/`getAll*`) at repository layer; service layer may use `getAll*`.
- Authz helpers always start with `ensure*` (not `require*`, `check*`, `assert*`).
- No `export default`. Every export is a named export. Controllers/services/schemas are always `export const`.

## 3. Folder Organization

```
src/
├── app.ts, server.ts          # Entry at top of src/
├── generated/                 # Generated code (Prisma Client) — .gitignore'd (inferred)
├── lib/                       # Singleton clients for external SDKs
├── middlewares/               # Framework middleware (no business logic)
│   └── rate-limit/            # Middleware subfolders OK if grouping multiple related files
├── infrastructure/
│   └── realtime/              # One subfolder per technical capability
├── features/
│   └── auth/                  # Shared feature-level config (schemas used by lib/auth.ts)
├── types/                     # TS augmentation (.d.ts files)
├── utils/                     # Pure helpers
└── modules/
    └── <domain>/              # One folder per business domain
        ├── <domain>.route.ts
        ├── <domain>.controller.ts
        ├── <domain>.service.ts
        ├── <domain>.repository.ts
        ├── <domain>.validation.ts
        ├── <domain>.authorization.ts    ← optional
        ├── <domain>.type.ts              ← optional
        ├── <domain>.query.ts             ← optional
        └── routes/                        ← optional, if mounted at multiple prefixes
            └── <prefix>-<domain>.route.ts
```

Modules don't import from other modules' controllers, services, or routes. The **only** accepted cross-module imports are:
- **Authorization helpers**: `project.authorization.ts` imports `ensureOrganizationOwner` from `organization.authorization.ts`
- **Repository queries for authz**: Authz helpers import from their own module's `.repository.ts` (never from other modules' repos unless you count the ensure chain which calls its own module's repo function)

## 4. Imports

- **No default exports anywhere.** All modules use named exports and named imports.
- Imports are organized (loosely) with external libraries first, then relative imports up the tree, then sibling files.
- No barrel files (`index.ts`). Every import points to a specific file: `from "./organization.service"` not `from "."`.
- Relative import paths go up to `../../utils/X` or `../../middlewares/X` as needed; no path aliases (`@/`) are configured in tsconfig or package.json.

Example controller import block (standard pattern):
```typescript
import { Request, Response } from "express";
import { createXService, deleteXService } from "./x.service";
```

## 5. Layer Responsibilities

| Layer | May access... | Must NEVER access... |
|-------|-------------|---------------------|
| Route | Middleware, Controllers, Validation schemas, asyncHandler | Prisma, Services directly, Auth helpers |
| Controller | Services, `req`/`res` types, session via `req.session` | Prisma directly, Authorization helpers, Repositories |
| Service | Repositories, Authorization helpers, Infrastructure singletons (realtime, delok SDK), AppError | `Request`/`Response` (Express types), Prisma client |
| Authorization helper | Its module's Repository functions, AppError, delok SDK (audit logging) | Express types |
| Repository | Prisma client only, generated Prisma types | Services, Controllers, AppError, auth helpers |
| Validation schema | Zod only, imported types if needed | Any module code, Prisma |

## 6. Error Handling Patterns

### Throw vs Return

Services and authz helpers **throw** `AppError`. They never return Result objects or `{ error }` tuples.

```typescript
// DO:
throw new AppError("user not found", 404);

// NOT seen in codebase:
return { ok: false, error: "user not found" };
```

### AppError constructor signature

```typescript
new AppError(message: string, statusCode: number, errorCode?: string);
```

| Parameter | When to use |
|-----------|-------------|
| `message` | Human-readable. Keep short. |
| `statusCode` | HTTP status. 400, 401, 403, 404, 500. |
| `errorCode` | Machine-readable code. Optional. Used **once** in the codebase: `INVALID_API_KEY` for invalid key hash. Default `UNKNOWN_ERROR`. |

### What layer throws what

| Layer | Error type thrown |
|-------|-------------------|
| Auth middleware | `AppError("unauthorized", 401)` |
| Validation middleware | Returns direct 400 response (no throw, no error middleware) |
| Controllers | Should NOT throw manually (rare today). Let service throw. |
| Services | `AppError(...)` for business-rule violations (not found, already revoked, too short) |
| Authorization helpers | `AppError("Forbidden", 403)` — always same message for consistency in access-denied cases; additionally logs via `delok.warn()` |
| Repositories | **Never** throw AppError. Return `null` for not-found; let Prisma propagate its own errors (e.g. constraint violations) which errorMiddleware surfaces as 500 |

### asyncHandler + errorMiddleware pair

- Every async controller is wrapped with `asyncHandler(...)` in the route file. **Never wrap inside the controller itself.**
- `errorMiddleware` is the **last** middleware mounted in `app.ts`.
- Any unhandled `Error` is sanitized to `500 Internal Server Error` (original message hidden from client), and always logged to Delok via `errorLogger(error, req)` which captures method, path, and stack trace as payload.

## 7. Validation Patterns

### Request body (POST/PATCH/PUT)

1. Create Zod schema in `<domain>.validation.ts` with `z.object({...})`.
2. Export both schema and `type X = z.infer<typeof xSchema>`.
3. Pass schema to `validate(schema)` in route **before** `asyncHandler(controller)`.
4. In controller, destructure `req.body` — types are already the inferred Zod types (TS trusts middleware replacement of `req.body`).

### Query params (GET)

1. Same schema definition, but call `schema.parse(req.query)` inside the controller (today's pattern).
2. Use `z.coerce.number()` and `z.coerce.date()` for non-string params.
3. `.default(N)` for pagination-style params (page default 1, limit default 50).

### Passwords

Shared [passwordSchema](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/features/auth/auth.schema.ts) in `features/auth/` — used by Better Auth's `hooks.before`. Regex tests for uppercase, lowercase, number, and special character separately (not a single combined regex).

## 8. Comment Conventions

- **JSDoc-style block comments** above most exported functions:
  ```typescript
  /**
   * Get all organizations belong to current user.
   */
  export const getAllOrganizationService = ...
  ```
- Comments explain **intent** ("User must be a member of organization") — not just what the code does verbatim.
- Inline comments are rare; the code uses long descriptive function names that make intent self-documenting.
- Top-of-file one-liner like `// /src/app.ts` appears in most files (not all; preferred to omit for new files unless your team wants them).

## 9. TypeScript

- `strict: true` is on in tsconfig — write code accordingly.
- Type declarations go in `.type.ts` files when they're reusable across service/repo/controller in the same module (e.g. `LogFilter`, `LogQueryOptions`).
- Zod-derived types (`z.infer<>`) are preferred for anything that crosses an API boundary (request body, query params, response shape — though responses are implicit Prisma entities today).
- `req.session` typed as `any` via global augmentation ([types/express.d.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/types/express.d.ts)). For stricter typing you could declare a `Session` interface imported from Better Auth's types.
- Express types: prefer explicit `Request` / `Response` annotations on controllers. No `any` on controllers today (except the unused `import id from "zod/v4/locales/id.cjs"` dead import in api-key controller).

## 10. Response Shape

Two success shapes:

**Single entity or list (no pagination):**
```json
{ "success": true, "data": entity_or_array }
```

**Paginated list (only log-event today):**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": { "page": 1, "limit": 50, "total": 100, "totalPages": 2, "hasNextPage": true, "hasPreviousPage": false }
  }
}
```

**Custom shape for management actions (rename/revoke):**
```json
{ "success": true, "data": { "message": "...", "id": "...", ...other fields } }
```

Consistency rule: **every JSON response from a controller has `success: boolean` at the top level.** (Violation: the `validate()` middleware doesn't include `success`? No — looking at code, it includes `success: false, errors: [...]` so yes, it does follow this. The rate limiter's `errorResponse()` uses `success: false` too. So the flag is universal.)

## 11. Environment Access

- Process env is read **only in `lib/*.ts` files** (singleton initialization) and in `server.ts` (for `PORT`).
- `dotenv/config` is imported first in [server.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/server.ts#L3) so all subsequent `process.env.X` reads work.
- OAuth env vars are validated at startup (throw if missing) in [lib/auth.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/lib/auth.ts#L11-L23). Follow this pattern for any env var without which the app cannot boot.

## 12. Console Logging

Development-oriented console logs are used freely at layer boundaries:
- `console.info([METHOD] URL)` per request in app.ts
- `console.log(req.body: ...)` per request
- `console.info("WebSocket client connected.")`
- `console.log("AUTH MIDDLEWARE")`, `"CHECK SESSION"`, `"AUTH MIDDLEWARE SUCCESS"`

Audit/operational logging (production-grade) goes through the `delok` singleton:
- `delok.info()` for positive events (password-reset sent, API key created)
- `delok.warn()` for denied access (authorization failures, skipping verification email for already-verified user)
- `delok.error()` for failures that need investigation (email send failure, generic 500 errors)

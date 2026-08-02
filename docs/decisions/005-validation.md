# ADR-005: Zod Validation with Dedicated Middleware for Bodies

Status: Accepted (inferred from current implementation)

## Context

Request validation choices in Node.js/TypeScript servers include:
- **`express-validator`** — decorator/middleware style, imperative checks
- **Yup** / **Joi** — classic validation libraries
- **Zod** — type-first schema validation with excellent TypeScript inference

Then, *where* validation runs is a separate choice:
- In controllers as the first line (simplest to write, but inconsistent across handlers)
- As dedicated Express middleware applied at the route boundary (cleaner separation)
- As decorators on DTO classes (requires Nest/TSyringe-style framework)
- At service layer (catches all callers, not just HTTP)

Delok additionally needs:
- Strong type-safety flowing from request body into services via TypeScript
- Query param coercion (strings → numbers/dates) since Express always gives strings
- Passwords validated at a cross-module hook (Better Auth sign-up) not in a route
- A way to share schema types with downstream services without duplicating interfaces

**Note on rationale**: Context/decision are **inferred** from the codebase. No explicit written decision record found.

## Decision

1. **Validation library: Zod.** All schemas are defined with Zod. No other validation library is used.
2. **Validation middleware for bodies.** A single factory middleware `validate(schema: ZodType)` is applied at the route boundary **before** the controller for every POST/PATCH/PUT with a JSON body:
   ```typescript
   router.post("/", authMiddleware, validate(xSchema), asyncHandler(xController));
   ```
   The middleware uses `schema.safeParse(req.body)`, returns direct `400 { success: false, errors: ZodIssue[] }` on failure, and **replaces** `req.body` with `result.data` (so Zod coercions and defaults apply).
3. **Per-module validation files.** `*.validation.ts` next to the service/controller. Each file exports:
   - A `z.object({...})` schema named `<domain>Schema` / `<action><Domain>Schema`
   - Its inferred TypeScript type: `type X = z.infer<typeof xSchema>` for reuse in services.
4. **Query param validation: `schema.parse(req.query)` inline in controller.** For GET endpoints (currently only log-event), query schemas with `z.coerce.number()`, `z.coerce.date()`, `.default(N)` are parsed directly inside the controller with `.parse()` (not `.safeParse()`). The resulting ZodError flows through errorMiddleware.
5. **Cross-feature shared schemas in `src/features/`.** Password complexity rules (`passwordSchema` in `features/auth/auth.schema.ts`) used by Better Auth sign-up hook live outside any single module because they're not tied to one module's endpoint.
6. **Service-level business validation.** Where a check is a *business rule* (name < 3 chars, API key already revoked), it is enforced **again** in the service layer with `AppError`, not only in Zod. This is defense-in-depth against validation that somehow bypasses the HTTP middleware (e.g. future non-HTTP callers).

## Consequences

### Positive
- **`z.infer<>` gives free types.** Write a Zod schema once and service function parameter types are automatically correct. No duplicated interface declarations.
- **Middleware boundary is consistent.** You can read any `*.route.ts` and immediately see which schemas apply to which endpoints. Developers new to the project learn one pattern.
- **Coercion correctness for free.** `z.coerce.number()` on pagination params, `z.coerce.date()` on `occurredAt` both correct the fact that HTTP query strings + JSON numbers that are actually strings arrive as strings. Corrected values propagate automatically when the middleware assigns `req.body = result.data`.
- **Structured error response on bodies.** Clients see Zod's full `issues[]` array (paths, codes, messages) on 400s, enabling frontend form fields to highlight invalid inputs with precise messages.
- **Defense in depth.** Service-level AppError checks mean even if code is reused from a CLI or queue that doesn't route through HTTP middleware, invariants like "name >= 3 chars" and "revoked key cannot be renamed" still hold.

### Negative
- **Two validation error formats.** Body validation failures return `{ success: false, errors: ZodIssue[] }` directly from middleware. Query param validation (via `.parse()`, not middleware) returns `{ success: false, error: { code: "UNKNOWN_ERROR", message: "Internal Server Error" } }` from the generic errorMiddleware because ZodError is classified as a regular Error. Clients need to know two shapes.
- **No explicit path param validation.** `/:id` and `/:projectId` parameters are never validated against a Zod schema (e.g. format check for CUID/UUID). Non-existent IDs flow all the way to repository → `null` → service throws 404 or authz throws 403. Functional, but malformed IDs (short strings) hit the database with an indexed lookup rather than being rejected at the edge.
- **Inline `.parse()` in controller (query params) leaks validation logic.** Logically query validation belongs at the same boundary as body validation; today it's done inside the controller, a different file from body validation's route boundary.
- **Password schema only enforced in sign-up hook.** The `passwordSchema` (uppercase, lowercase, number, special, 8–128) runs in the Better Auth sign-up hook. Users who reset their password or are created via other paths do NOT have it validated against the same schema unless those flows also explicitly call it (not verified in current implementation; password reset goes through Better Auth's own internal min/max length of 8–128, but the custom regex rules are not re-applied because the hook only runs when `ctx.path === "/sign-up/email"`).
- **No OpenAPI auto-generation** from Zod schemas today, though it is possible with tools like `@asteasolutions/zod-to-openapi` in the future.

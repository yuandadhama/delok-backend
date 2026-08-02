# ADR-002: Service Layer for Business Logic

Status: Accepted (inferred from current implementation)

## Context

In Express applications, business logic frequently leaks into route handlers/controller functions. Over time this leads to:
- Controllers that are hundreds of lines long and impossible to test without mocking Express
- Difficulty reusing business logic (e.g., in cron jobs, scripts, queue workers)
- Authorization rules scattered across handlers, hard to audit or update consistently
- Changes to data access patterns (e.g., swapping Prisma query strategy) require touching every handler

**Note on rationale**: Context and decision rationale are **inferred** from code structure. No explicit written record was found in the repository.

## Decision

Introduce a **service layer** (`*.service.ts` per module) that serves as the single home for all business logic. The layer enforces these constraints:

1. **Services accept plain arguments only**: `createOrganizationService(name: string, userId: string)`, never `(req: Request, res: Response)`. No Express types in service signatures.
2. **Services call repositories** for persistence and **authorization helpers** for access control. A typical flow:
   - Validate business invariants (name length, immutable-frozen state like revoked keys)
   - Call `ensure*()` authorization helper (throws 403 on failure)
   - Call one or more repository functions
   - Optionally emit realtime/audit events
   - Return raw domain entity or custom DTO
3. **Services throw AppError** on business rule violations. No try/catch inside services for the happy path.
4. **One service per module** exported as a collection of named functions (not a class with methods).
5. **Controlling side effects**: Real-time broadcasts (`realtime.emit`) and SDK audit logs (`delok.info/warn/error`) are emitted from the service layer (not controllers or repositories), ensuring they fire whenever the business operation happens, regardless of entry point (HTTP, future CLI, etc.).

## Consequences

### Positive
- **Framework-portable business logic**: Services can be called from a cron job, command-line script, or queue worker without requiring a mock Express app. A "delete expired API keys" batch job can simply `import { revokeApiKeyService }` and reuse the same invariants and audit logging.
- **Focused controllers**: Controllers are reduced to parameter extraction and response formatting — trivial to test and unlikely to harbor bugs.
- **Consistent error semantics**: One service function called from two different endpoints throws the same AppError, guaranteeing consistent error payloads.
- **Auditability**: To answer "does revoking an API key check if the caller is org owner?" you open one file: `api-key.service.ts`, and follow the call to `ensureProjectManagementAccess`.

### Negative
- **More files, more hops**. Reading code requires traversing route → controller → service → repository instead of seeing everything inline in a handler. This is a deliberate trade-off for structure.
- **AppError for every business case**: Adding a new validation ("API keys can't be renamed when revoked") requires throwing in the service. Developers must be disciplined to never inline these checks in controllers.
- **Return types can be ambiguous**: Some services return raw Prisma entities; others (rename/revoke api key) return a custom `{ message, id, revokedAt }` shape. Consistency depends on reviewer vigilance.

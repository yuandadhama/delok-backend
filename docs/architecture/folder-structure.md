# Folder Structure

This document explains the purpose of every significant directory and file in the Delok backend repository.

## Repository Root

```
delok-backend/
├── prisma/              # Database schema and migrations
├── src/                 # TypeScript application source
├── docs/                # This documentation (generated)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── prisma.config.ts     # Prisma multi-schema config
└── README.md
```

## `prisma/` — Database Schema & Migrations

```
prisma/
├── schema/              # Multi-file Prisma schema (Prisma 7 multi-schema)
│   ├── schema.prisma    # Root generator + datasource declaration
│   ├── auth.prisma      # User, Session, Account, Verification models
│   ├── organization.prisma  # Organization, OrganizationMember models
│   ├── project.prisma   # Project, ApiKey models
│   └── log-event.prisma # LogEvent model
└── migrations/          # Auto-generated migration SQL files
```

**Why multi-file schema?** The project uses Prisma 7's multi-schema feature to split the large schema into domain-oriented files. Each `.prisma` file maps to one business domain. The root [schema.prisma](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma/schema/schema.prisma) only declares the generator and datasource.

Configuration lives in [prisma.config.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma.config.ts), which tells Prisma the schema folder and migration path.

Generated Prisma Client is output to `src/generated/prisma/` (see `output` in schema.prisma).

## `src/` — Application Source

```
src/
├── app.ts               # Express app assembly: CORS, JSON parser, route mounting
├── server.ts            # Entry point: create HTTP server, attach WebSocket, listen
├── generated/           # Auto-generated code (Prisma Client, do not edit)
├── lib/                 # Singleton clients for external services
├── middlewares/         # Reusable Express middleware
├── modules/             # Feature modules (one folder per business domain)
├── infrastructure/      # Technical adapters (not business logic)
├── features/            # Schemas shared across modules
├── types/               # TypeScript type augmentations
└── utils/               # Shared helper functions
```

### `src/lib/` — Infrastructure Singletons

Every file exports a single pre-configured singleton instance. Modules import these rather than constructing their own clients.

| File | Export | Purpose |
|------|--------|---------|
| [prisma.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/lib/prisma.ts) | `prisma` | `PrismaClient` configured with `@prisma/adapter-pg` (PostgreSQL driver) |
| [auth.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/lib/auth.ts) | `auth` | `betterAuth` instance with Prisma adapter, OAuth providers (Google, GitHub), email/password, email verification, password reset, custom password schema hook |
| [resend.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/lib/resend.ts) | `resend` | `Resend` SDK client for transactional emails |
| [delok.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/lib/delok.ts) | `delok`, `errorLogger` | Delok SDK for self-monitoring + error logger middleware function |

**Design rationale**: Centralizing client construction ensures consistent configuration (timeouts, retries, auth headers) across the app. It also makes swapping implementations easy (change one file).

### `src/middlewares/` — Express Middleware

Cross-cutting concerns applied to specific routes.

```
middlewares/
├── auth.middleware.ts           # Session verification → sets req.session
├── validate.middleware.ts       # Zod body validation factory
├── error.middleware.ts          # Global error handler (catches AppError, generic errors)
└── rate-limit/
    └── auth-rate-limit.middleware.ts  # Path-based rate limiters for auth endpoints
```

Middleware is mounted per-route in the `*.route.ts` files (not globally) unless it's the error middleware which is mounted last in [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L96).

### `src/modules/` — Business Domain Modules

**This is where most application code lives.** Each subfolder is a self-contained feature module.

```
modules/
├── auth/                # Verification email resend endpoint
├── user/                # Session (me) only — returns req.session
├── organization/        # Organization CRUD + ownership rules
├── project/             # Project CRUD (nested under organization)
│   └── routes/          # Split routes: organization-project.route.ts (owns all org-scoped CRUD)
├── api-key/             # API key lifecycle: create, list, revoke, rename
│   └── routes/          # Split routes: project-api-key.route.ts, api-key.route.ts
├── ingestion/           # Public log ingestion endpoint (x-api-key auth)
└── log-event/           # Query/filter/paginate stored log events
    └── routes/          # project-log-event.route.ts
```

#### Standard Module Structure

Mature modules contain a consistent set of files:

| File | Responsibility | Pattern |
|------|---------------|---------|
| `*.route.ts` | Express Router: declare endpoints, wire middleware + controllers | Route → Auth Middleware → Validate Middleware → asyncHandler(Controller) |
| `*.controller.ts` | Extract params from req, call service, format response | Thin, no business logic |
| `*.service.ts` | Business logic, authorization orchestration, emit events | Calls authorization helpers + repository functions |
| `*.repository.ts` | Prisma queries only | Named functions wrapping `prisma.model.operation()` |
| `*.validation.ts` | Zod schemas + inferred types | Export schemas for validate() middleware |
| `*.authorization.ts` | Access-control helpers | `ensure*()` functions that throw AppError(403) |

**Modules may deviate**: `ingestion/` has no authorization.ts (it authenticates via API key instead), and the auth module is minimal (most auth is handled by Better Auth directly).

Some modules split routes into a `routes/` subfolder when they're mounted at multiple URL prefixes or use a `<parent>-<child>` routing convention (e.g., project keeps its org-scoped CRUD in `organization-project.route.ts`, and api-key uses both `project-api-key.route.ts` and `api-key.route.ts`).

### `src/infrastructure/` — Technical Adapters

Code that enables technical capabilities without business logic.

```
infrastructure/
└── realtime/
    ├── websocket.ts          # WebSocketServer singleton, client subscriptions map
    ├── realtime.service.ts   # RealtimeService: emit() broadcasts to subscribers
    └── event.types.ts        # RealtimeEventMap: type-safe event name → payload
```

The realtime subsystem is separated from `modules/` because it's a cross-cutting capability consumed by multiple modules (currently `ingestion.service` emits `log.created` events).

### `src/features/` — Shared Feature Config

```
features/
└── auth/
    └── auth.schema.ts    # passwordSchema: shared password complexity rules
```

Used by `lib/auth.ts` to validate sign-up passwords. Placed here because the schema is consumed by the auth hook but doesn't belong to a specific module.

### `src/types/` — TypeScript Augmentations

```
types/
└── express.d.ts    # Declares `session?: any` on Express.Request
```

This is how `authMiddleware` can legally set `req.session` and controllers can read it without TS errors.

### `src/utils/` — Pure Helper Functions

Small, framework-agnostic utilities. No external SDK state here.

| File | Export | Purpose |
|------|--------|---------|
| [AppError.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/utils/AppError.ts) | `AppError` class | Custom error with `statusCode`, `errorCode`, `message`. Used by all business logic. |
| [async-handler.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/utils/async-handler.ts) | `asyncHandler` | Wraps async controller so thrown errors/rejected promises are forwarded to Express error middleware. |
| [api-response.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/utils/api-response.ts) | `errorResponse` | Helper to send consistent error JSON (used by rate limiter before error middleware runs) |
| [hash.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/utils/hash.ts) | `sha256` | Used to hash API keys before storage (plaintext is returned once only) |

## Entry Points

### [src/server.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/server.ts) — Process Entry

1. Loads `dotenv/config` first — all env vars available
2. Creates an HTTP `server` from the Express `app`
3. Registers the `upgrade` event to hand off WebSocket connections to `websocket`
4. Listens on `process.env.PORT`

### [src/app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts) — Express Assembly

Order of middleware/route mounting:
1. `cors()` — allow `localhost:3000`, credentials, `x-api-key` header
2. `express.json()` — parse JSON bodies
3. Console request logger (method + URL + body)
4. `/api/auth/*` — auth rate limiter → `authRoute` → Better Auth `toNodeHandler` catch-all
5. Module routes (user, organization, projects, ingestion, logs, API keys)
6. `/` — WebSocket test page
7. `errorMiddleware` — must be last

# Authentication

Delok uses **Better Auth** (`better-auth` v1.6.23) as its authentication framework. The project supports email+password (with verification), Google OAuth, and GitHub OAuth. All session storage is database-backed via Prisma.

## Better Auth Integration

Better Auth is configured in [lib/auth.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/lib/auth.ts) as a singleton. Key configuration (values from `lib/env.ts` validated via Zod):

| Setting | Value | Purpose |
|---------|-------|---------|
| `baseURL` | `env.BETTER_AUTH_URL` | Where the backend auth API lives (used for cookie scoping etc.) |
| `trustedOrigins` | `[env.FRONTEND_URL]` | Frontend origin allowed to receive auth cookies (dynamic, not hardcoded) |
| `database` | `prismaAdapter(prisma, { provider: "postgresql" })` | Store users/sessions/accounts in PostgreSQL |
| `onAPIError.errorURL` | `` `${env.FRONTEND_URL}/auth/error` `` | Frontend redirect target for auth errors |
| `secret` | `env.BETTER_AUTH_SECRET` | Session signing secret |

### Required Environment Variables

Validated at startup in [lib/env.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/lib/env.ts) (Zod `envSchema` — fail-fast throw if any missing):

```
DATABASE_URL            # PostgreSQL connection string
BETTER_AUTH_SECRET      # Session signing secret
BETTER_AUTH_URL         # Public backend URL (e.g. http://localhost:8000) — used for baseURL
FRONTEND_URL            # Frontend origin (e.g. http://localhost:3000) — used for trustedOrigins/errorURL/CORS
RESEND_API_KEY          # Resend transactional email key
EMAIL_FROM              # Verified sender address
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
PORT                    # optional, default 8000
NODE_ENV                # development | production | test, default development
```

### Password Auth (`emailAndPassword`)

- `enabled: true`
- Min password length: 8, max: 128 (Better Auth defaults)
- Additional complexity enforced via custom hook (see below)
- `requireEmailVerification: true` — users must verify email before actions (actual enforcement of this flag is Better Auth's own logic)

**Password reset email** is sent via Resend with a Delok-branded template (`lib/auth.ts:32` `sendResetPassword` → `email.service.ts`).

### Email Verification

- `sendOnSignIn: true` — Better Auth will re-send a verification email if an unverified user signs in
- Custom URL rewrite: the verification link's `callbackURL` is set to `` `${env.FRONTEND_URL}/sign-up/verified` `` so the frontend controls the post-verification UX
- Email send failure is thrown after logging inside `email.service` (no Delok self-monitoring SDK in current code)

### Social Providers

| Provider | Config | Scopes/Permissions |
|----------|--------|-------------------|
| Google | `google.clientId`, `google.clientSecret` | Default Better Auth Google scopes (inferred, not explicitly configured in code) |
| GitHub | `github.clientId`, `github.clientSecret` | Default Better Auth GitHub scopes (inferred, not explicitly configured in code) |

## Password Validation Hook

The default Better Auth password length check is enhanced with a custom `hooks.before` middleware (runs before the sign-up email handler):

```typescript
// From auth.ts hooks.before
if (ctx.path !== "/sign-up/email") return;
const result = passwordSchema.safeParse(ctx.body.password);
if (!result.success) {
  throw new APIError("BAD_REQUEST", { message: result.error.issues[0].message });
}
```

The [passwordSchema](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/features/auth/auth.schema.ts) requires:
- 8–128 characters
- Uppercase letter
- Lowercase letter
- Number
- Special character (not `[A-Za-z0-9]`)

Failing any of these throws `APIError("BAD_REQUEST")` which Better Auth handles according to its own error flow.

## Session Handling

### Storage

Sessions are stored in the `Session` table ([auth.prisma](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma/schema/auth.prisma#L18-L32)):

| Field | Meaning |
|-------|---------|
| `id` | Session ID (string) |
| `token` | Hashed session token (`@@unique`) |
| `expiresAt` | Session expiry date |
| `userId` → `User` | Foreign key to user (Cascade on delete) |
| `ipAddress` | Client IP (optional) |
| `userAgent` | Client UA (optional) |

Index on `userId` for fast "get all user's sessions" queries.

### Session Resolution

The [authMiddleware](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/middlewares/auth.middleware.ts#L8-L27) resolves sessions:

1. Extracts cookies from Node headers via `fromNodeHeaders(req.headers)`
2. Calls `auth.api.getSession({ headers })` (Better Auth's server-side session resolver)
3. If session → sets `req.session` (declared on Express via [types/express.d.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/types/express.d.ts) type augmentation)
4. If no session → throws `AppError("unauthorized", 401)`

`req.session` shape (Better Auth session type): `{ user: { id, name, email, emailVerified, image, createdAt, updatedAt }, ...sessionProps }`.

## Authentication Middleware Mounting

Not all routes are protected. The middleware is applied per-route in each module's `*.route.ts`:

| Module | Protected routes? | Notes |
|--------|-------------------|-------|
| `/api/auth/*` | Handled by Better Auth internally | Has rate limiter but no authMiddleware |
| `/api/organization/*` | ALL (5 endpoints) | authMiddleware on every route |
| `/api/organizations/:organizationSlug/projects` | ALL (5 endpoints) | authMiddleware on every route |
| `/api/projects/:projectId/logs` | ALL (1 endpoint) | authMiddleware on every route |
| `/api/projects/:projectId/api-keys` | ALL (2 endpoints) | authMiddleware on every route |
| `/api/api-key/*` | ALL (2 endpoints) | authMiddleware on every route |
| `/api/user/me` | Yes | Protected (the only user endpoint) |
| `/api/ingestion` | **NO** (not session-based) | Uses API key auth inside controller/service (see next section) |

## API Key Authentication (Ingestion Only)

The session auth middleware is NOT used for ingestion. Instead, `POST /api/ingestion` uses a custom API key flow:

```mermaid
flowchart LR
    A[Request: x-api-key header] --> B[ingestion.controller]
    B --> C{Header present?}
    C -- No --> D[AppError 401: API key required]
    C -- Yes --> E[createLogEventService rawKey,...]
    E --> F[sha256 rawKey → keyHash]
    F --> G[findApiKeyByKeyHash keyHash]
    G --> H{Exists?}
    H -- No --> I[AppError 401 INVALID_API_KEY]
    H -- Yes --> J{revokedAt null?}
    J -- No (revoked) --> K[AppError 401: API Key already revoked]
    J -- Yes --> L[Update lastUsedAt if >5 min old]
    L --> M[Use apiKey.projectId to create log]
```

Key security properties:
- **Plaintext key is never stored.** Only the SHA-256 hash (`sha256` from [utils/hash.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/utils/hash.ts)) is persisted in `ApiKey.keyHash`.
- **Key is returned exactly once:** from `POST /api/projects/:projectId/api-keys` 201 response. The UI is responsible for showing it to the user with a "copy this now" warning.
- **Lookup uniqueness:** `keyHash` has `@unique` in the Prisma schema, preventing hash collision DB errors.
- **Revocation check:** `revokedAt` timestamp is set when the user revokes; the ingestion flow checks this field on every request.

## Auth Route Mounting

From [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L44-L46):

```typescript
app.use("/api/auth", authRateLimiter);
app.use("/api/auth", authRoute);                     // Custom: resend-verification
app.all("/api/auth/*splat", toNodeHandler(auth));    // Catch-all: Better Auth built-in
```

The order is important:
1. Path-specific rate limits run first
2. Custom endpoints in `authRoute` (POST `/api/auth/resend-verification`) match before the catch-all
3. Everything else under `/api/auth/*` is handled by Better Auth's Node.js adapter

Custom auth endpoints:
- `POST /api/auth/resend-verification` → [auth.controller.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/auth/auth.controller.ts) → silently exits if user not found or already verified (prevents user enumeration), otherwise calls `auth.api.sendVerificationEmail`

## Auth Rate Limiting

Auth endpoints are protected by [auth-rate-limit.middleware.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/middlewares/rate-limit/auth-rate-limit.middleware.ts) with path-specific limits:

| Path | Window | Limit |
|------|--------|-------|
| `/sign-in/email` | 15 min | 5 attempts |
| `/sign-up/email` | 60 min | 5 attempts |
| `/sign-out` | 5 min | 30 attempts |
| `/request-password-reset` | 60 min | 3 attempts |
| `/resend-verification` | 60 min | 5 attempts |

These use `express-rate-limit`. On breach, returns `429 RATE_LIMIT_EXCEEDED` via the `errorResponse` helper (formatted like error middleware output).

# Setup Guide

Step-by-step guide to running the Delok backend locally.

## Prerequisites

| Tool | Minimum Version | How to check |
|------|-----------------|--------------|
| Node.js | 20+ (for ES Modules + modern tsx) | `node --version` |
| npm / pnpm / bun | Any recent | `npm --version` |
| PostgreSQL | 14+ (Prisma 7 support) | `psql --version` or use Supabase/Neon/etc. |

The project uses:
- TypeScript 6+ with `tsx` for dev execution (no build step in dev)
- ES Modules (`type: "module"` in package.json, `"moduleResolution": "Bundler"` in tsconfig)
- Prisma 7 ORM with `@prisma/adapter-pg` driver adapter (not the default `pg` driver inside Prisma)

---

## 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd delok-backend
npm install
```

This installs:
- Runtime dependencies: express, better-auth, prisma, zod, ws, cors, express-rate-limit, resend, delok SDK, etc.
- Dev dependencies: tsx, typescript, @types/*

---

## 2. Configure Environment Variables

Create a `.env` file in the repository root. The backend loads `dotenv/config` first thing in [server.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/server.ts#L3).

### Required Variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/delok?schema=public` | PostgreSQL connection string. Read by Prisma via [prisma.config.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma.config.ts#L12) and by `lib/prisma.ts` (adapter-pg). |
| `PORT` | `8000` | HTTP/WebSocket port. |
| `BETTER_AUTH_URL` | `http://localhost:8000` | Public URL of this backend (used by Better Auth for cookie/redirect logic). |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google OAuth client ID. **Throws at startup if missing.** |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google OAuth client secret. **Throws at startup if missing.** |
| `GITHUB_CLIENT_ID` | `Iv1.abc...` | GitHub OAuth client ID. **Throws at startup if missing.** |
| `GITHUB_CLIENT_SECRET` | `...` | GitHub OAuth client secret. **Throws at startup if missing.** |
| `RESEND_API_KEY` | `re_...` | Resend API key for sending verification emails + password reset emails. |

### OAuth Provider Setup

For Google and GitHub providers, configure the OAuth callback URLs in each provider's developer console to point to Better Auth's expected endpoints. The exact callback paths are managed by Better Auth — refer to Better Auth's documentation for Google and GitHub provider callback URLs.

---

## 3. Run Prisma Migrations

Applies all migrations in `prisma/migrations/` to your database, in timestamp order.

```bash
npm run prisma:migrate
# → expands to: prisma migrate dev --schema prisma/schema/schema.prisma
```

What this does:
1. Reads `prisma.config.ts` → uses `prisma/schema` folder (multi-schema)
2. Connects to `DATABASE_URL`
3. Creates the `_prisma_migrations` tracking table if it doesn't exist
4. Applies any migration not yet recorded as applied
5. On first run, also regenerates the Prisma Client

The command runs in **dev** mode: if you edit the schema later and re-run, it will create a new migration automatically.

---

## 4. Generate Prisma Client (if needed)

The Prisma Client is output to `src/generated/prisma/` (see `output` in [schema.prisma](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma/schema/schema.prisma)). You'll need this any time you change any `.prisma` file:

```bash
npm run prisma:generate
```

This generates TypeScript types for every model (`User`, `Organization`, `Project`, `ApiKey`, `LogEvent`, etc.) that are imported via:
```typescript
import { PrismaClient, OrganizationRole } from "../../generated/prisma/client";
```

If you skip this step after a schema change, TypeScript will show the old types. If the generated folder is missing on a fresh clone, run this first before `type-check`.

---

## 5. Run Development Server

```bash
npm run dev
# → expands to: tsx watch src/server.ts
```

`tsx watch`:
- Compiles TypeScript on the fly (no emit step)
- Restarts automatically on any file save under `src/`
- Handles the ES Module + `.ts` imports correctly with the bundler-style module resolution

You should see:
```
AUTH CONFIG LOADED
Server listen at http://localhost:8000
```

Expected output on first request (e.g., `GET http://localhost:8000/`):

```
[GET] /
req.body: {}
```

And you should see the WebSocket test HTML page.

---

## 6. Verify the Backend Works

Quick smoke tests:

### 6.1 HTTP Test
Open `http://localhost:8000/` in a browser. You'll get the WebSocket test page. Open the dev console — it should log `"Connected!"` if the WS handshake succeeds (or quickly `"Disconnected!"` if the socket closes; either way, the server is up).

### 6.2 TypeScript Check
```bash
npm run type-check
# → expands to: tsc --noEmit
```

No output = success. This checks all `.ts` files in `src/` (per tsconfig's `"include": ["src"]`). Strict mode is enabled (`"strict": true`), so all type errors surface.

---

## Common Setup Issues

### Problem: `Error: Google OAuth env missing` on startup
The `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` env vars are unset. Both are validated at the top of [lib/auth.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/lib/auth.ts#L11-L23) (along with GitHub equivalents). Fill in all four OAuth env vars.

### Problem: Prisma Client not found
Error: `Cannot find module '../generated/prisma/client'`. Solution:
```bash
npm run prisma:generate
```

### Problem: CORS errors when frontend calls backend
Default CORS config in [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L23-L30) only allows `origin: ["http://localhost:3000"]`. If your frontend runs on a different port or a deployed URL, add it to the CORS origins array.

Also note: allowed headers include `x-api-key` (needed for ingestion calls). If you add new custom headers, update `allowedHeaders`.

### Problem: Email sending fails (verification / password reset)
If `RESEND_API_KEY` is missing or invalid, the `sendVerificationEmail` handler in auth.ts catches and logs the error via `delok.error()` then rethrows. You'll see the error in both the backend console AND (if the backend is sending to itself successfully) in your Delok logs.

For development you can also use Resend's test mode / sandbox. The `from` address is hardcoded to `"Delok <onboarding@resend.dev>"` (the Resend demo sender), which only works when sending to your Resend-registered email addresses. For production, change this to a verified domain.

---

## Production Deployment Checklist (Inferred)

The project does not include a production start script or Dockerfile today. A typical production flow would be:

1. **Build**: Add a `tsc -p tsconfig.json` build step (output to `dist/`)
2. **DB migrations**: `prisma migrate deploy` (not `dev`) before starting app
3. **Generate client**: `prisma generate` during build (after schema, before type-check)
4. **Start**: `node dist/server.js` (or `tsx src/server.ts` is possible but slower)
5. **Env vars**: Same as development except `BETTER_AUTH_URL` points to the production origin, OAuth apps configured with production callbacks, `DATABASE_URL` to production PostgreSQL, production Resend API key.

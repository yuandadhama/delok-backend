# Database Schema

Delok uses **PostgreSQL** as its database, accessed via **Prisma ORM**. The schema is split across multiple `.prisma` files (Prisma 7 multi-schema feature). This document describes every model: its purpose, fields, and relationships.

## Schema File Organization

The schema lives in `prisma/schema/`:

| File | Contains |
|------|----------|
| [schema.prisma](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma/schema/schema.prisma) | Generator (client output: `src/generated/prisma`) and datasource declaration |
| [auth.prisma](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma/schema/auth.prisma) | `User`, `Session`, `Account`, `Verification` (Better Auth standard models) |
| [organization.prisma](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma/schema/organization.prisma) | `Organization`, `OrganizationMember`, enum `OrganizationRole` |
| [project.prisma](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma/schema/project.prisma) | `Project`, `ApiKey` |
| [log-event.prisma](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma/schema/log-event.prisma) | `LogEvent` |

Prisma merges all `*.prisma` files in the schema folder at generation time, via [prisma.config.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/prisma.config.ts) (`schema: "prisma/schema"`).

---

## Model: `User`

**Purpose**: Represents a human user of the Delok platform. Authenticated via Better Auth (email/password, Google, or GitHub).

**Table**: `user`

| Field | Type | Constraints / Defaults | Meaning |
|-------|------|----------------------|---------|
| `id` | String | PK, `uuid()` v4 | User identifier |
| `name` | String | Required | Display name |
| `email` | String | Required, `@unique` | Login email (unique globally) |
| `emailVerified` | Boolean | `false` | Whether user verified email |
| `image` | String? | Nullable | Avatar URL (from OAuth or upload) |
| `createdAt` | DateTime | `now()` | Creation timestamp |
| `updatedAt` | DateTime | `@updatedAt` | Last change timestamp |

**Relationships** (see also [relationships.md](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/database/relationships.md)):
- `sessions: Session[]` — Zero or more active login sessions
- `accounts: Account[]` — Zero or more linked auth accounts (one per provider)
- `organizationMembers: OrganizationMember[]` — All organizations this user belongs to
- `apiKeys: ApiKey[]` — API keys this user created (SetNull on user deletion)

---

## Model: `Session`

**Purpose**: Better Auth server-side session storage. Allows sessions to be revoked server-side.

**Table**: `session`

| Field | Type | Constraints / Defaults | Meaning |
|-------|------|----------------------|---------|
| `id` | String | PK | Session ID |
| `token` | String | `@unique` | Hashed session token lookup |
| `expiresAt` | DateTime | Required | Absolute expiry date |
| `ipAddress` | String? | Nullable | Client IP (captured at login) |
| `userAgent` | String? | Nullable | Client User-Agent |
| `userId` | String | FK | Owner user |
| `createdAt` | DateTime | `now()` | Session created |
| `updatedAt` | DateTime | `@updatedAt` | Session touched |

**Relationships**:
- `user: User` (FK: `userId`, `onDelete: Cascade`) — deleting a user destroys all their sessions

**Indexes**:
- `@@unique([token])` — token lookups
- `@@index([userId])` — list sessions for a user

---

## Model: `Account`

**Purpose**: Stores linked authentication accounts. A single `User` can have multiple accounts (e.g., email+password + Google + GitHub).

**Table**: `account`

| Field | Type | Constraints / Defaults | Meaning |
|-------|------|----------------------|---------|
| `id` | String | PK | Internal account ID |
| `accountId` | String | Required | Provider's account ID (e.g., Google `sub`) |
| `providerId` | String | Required | Provider name: `email`, `google`, `github` |
| `userId` | String | FK → User.id | Owner user |
| `accessToken` | String? | Nullable | OAuth access token |
| `refreshToken` | String? | Nullable | OAuth refresh token |
| `idToken` | String? | Nullable | OIDC id token |
| `accessTokenExpiresAt` | DateTime? | Nullable | Access token expiry |
| `refreshTokenExpiresAt` | DateTime? | Nullable | Refresh token expiry |
| `scope` | String? | Nullable | Granted OAuth scopes |
| `password` | String? | Nullable | Hashed password (only for `providerId: "email"`) |
| `createdAt` | DateTime | `now()` | Linked at |
| `updatedAt` | DateTime | `@updatedAt` | Tokens refreshed |

**Relationships**:
- `user: User` (FK: `userId`, `onDelete: Cascade`)

**Indexes**:
- `@@index([userId])` — list accounts for a user

Note: Better Auth manages all rows in this table; the custom application code does not write to it.

---

## Model: `Verification`

**Purpose**: One-time verification tokens (email verification, password reset, magic link).

**Table**: `verification`

| Field | Type | Constraints / Defaults | Meaning |
|-------|------|----------------------|---------|
| `id` | String | PK | Token row ID |
| `identifier` | String | Required | What this verifies (typically email address) |
| `value` | String | Required | The token value (random) |
| `expiresAt` | DateTime | Required | Token validity window |
| `createdAt` | DateTime | `now()` | Token issued |
| `updatedAt` | DateTime | `@updatedAt` | Token touched |

**Indexes**:
- `@@index([identifier])` — find all tokens for an identifier

Note: Better Auth manages all rows in this table; custom code does not write to it.

---

## Model: `Organization`

**Purpose**: Top-level workspace. Users belong to organizations; projects live inside organizations.

**Table**: `organization`

| Field | Type | Constraints / Defaults | Meaning |
|-------|------|----------------------|---------|
| `id` | String | PK, `cuid()` | CUID for URL-friendly, collision-resistant IDs |
| `name` | String | Required | Organization display name (used to derive `slug`) |
| `slug` | String | Required, `@unique` | URL identifier; derived from `name` via `generateSlug` (lowercased, spaces → hyphens, non `[a-z0-9-]` stripped) |
| `createdAt` | DateTime | `now()` | Creation timestamp (added 20260822191930) |
| `updatedAt` | DateTime | `@updatedAt` | Last change timestamp (added 20260822191930) |

**Relationships**:
- `projects: Project[]` — all projects in this org (Cascade delete: deleting org removes all projects)
- `organizationMembers: OrganizationMember[]` — membership join table

---

## Enum: `OrganizationRole`

```prisma
enum OrganizationRole {
  OWNER
  MEMBER
}
```

Used on `OrganizationMember.role`. See [authorization.md](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/backend/authorization.md) for the permissions of each role.

---

## Model: `OrganizationMember`

**Purpose**: Many-to-many join between `User` and `Organization`, plus the user's role in that org. Composite primary key.

**Table**: `organization_member`

| Field | Type | Constraints / Defaults | Meaning |
|-------|------|----------------------|---------|
| `organizationId` | String | PK (part 1), FK | Which org |
| `userId` | String | PK (part 2), FK | Which user |
| `role` | OrganizationRole | Required, default set via migration (`MEMBER` but see code: createOrganization forces `OWNER` for creator) | Access level in org |
| `joinedAt` | DateTime | `now()` | Membership start |

**Relationships**:
- `organization: Organization` (FK: `organizationId`, `onDelete: Cascade`)
- `user: User` (FK: `userId`, `onDelete: Cascade`)

**PK**: `@@id([organizationId, userId])` — one membership per user per org.

Default role inferred from migration history: `20260711061753_added_default_role` added `MEMBER` as default value for the role column.

---

## Model: `Project`

**Purpose**: A monitored application / service. Projects contain API keys (for ingestion) and log events.

**Table**: `project`

| Field | Type | Constraints / Defaults | Meaning |
|-------|------|----------------------|---------|
| `id` | String | PK, `cuid()` | CUID for public URLs |
| `name` | String | Required | Project display name |
| `organizationId` | String | FK → Organization.id | Parent org |
| `createdAt` | DateTime | `now()` | Creation timestamp |
| `updatedAt` | DateTime | `@updatedAt` | Last change timestamp |

**Relationships**:
- `organization: Organization` (FK: `organizationId`, `onDelete: Cascade`)
- `apiKeys: ApiKey[]` — all API keys for this project
- `logEvents: LogEvent[]` — all logs received for this project

**Constraints**:
- Case-insensitive uniqueness on `(organizationId, lower(name))` via raw index `project_organizationId_lower_name_idx` (migration `20260819120000_case_insensitive_project_name`). Two projects in the same org cannot share a name differing only by case. The constraint is enforced at the DB level (not in `project.prisma`/`project.validation.ts`); duplicate returns Prisma `P2002`.

---

## Model: `ApiKey`

**Purpose**: Credential for programmatic log ingestion via Delok SDK. Raw key is never stored (only its SHA-256 hash).

**Table**: `api_key`

| Field | Type | Constraints / Defaults | Meaning |
|-------|------|----------------------|---------|
| `id` | String | PK, `cuid()` | Internal ID |
| `name` | String | Required | Human-given label ("Production SDK", "Staging") |
| `keyHash` | String | `@unique` | SHA-256 hex of the raw key |
| `keyPrefix` | String | First 12 chars of raw key | Displayed in UI so user can identify keys |
| `projectId` | String | FK → Project.id | Project this key writes logs to |
| `createdById` | String? | FK → User.id (nullable) | Which human created this key |
| `revokedAt` | DateTime? | Nullable | Soft-delete: if set, key is rejected at ingestion |
| `lastUsedAt` | DateTime? | Nullable | Last ingestion time (throttled update: only if >5 min since last) |
| `createdAt` | DateTime | `now()` | Key creation timestamp |

**Relationships**:
- `project: Project` (FK: `projectId`, `onDelete: Cascade`) — deleting project removes all keys
- `createdBy: User?` (FK: `createdById`, `onDelete: SetNull`) — deleting user does not remove their keys; `createdById` becomes null

**Indexes**:
- `@@index([projectId])` — list all keys for a project
- `@@index([createdById])` — find all keys a user created

Key format: `dlok_` prefix + 32 random hex bytes = `dlok_[a-f0-9]{64}`. Prefix is not part of the hash lookup; the entire raw key is hashed.

---

## Model: `LogEvent`

**Purpose**: Single recorded log entry ingested from the Delok SDK.

**Table**: `log_event`

| Field | Type | Constraints / Defaults | Meaning |
|-------|------|----------------------|---------|
| `id` | String | PK, `cuid()` | Log entry ID |
| `projectId` | String | FK → Project.id | Which project the log belongs to |
| `environment` | String | Required | Deployment env (`"production"`, `"staging"`, etc.) |
| `level` | String | Required | Log level (`"info"`, `"warn"`, `"error"`, etc.) |
| `event` | String | Required | Semantic event name (e.g., `"auth.signin.failed"`) |
| `message` | String? | Nullable | Human-readable message |
| `occurredAt` | DateTime | Required | When the event happened (client-supplied) |
| `receivedAt` | DateTime | `now()` | When the backend received it (server time) |
| `payload` | Json? | Nullable | Structured context (stack trace, user ID, http path, etc.) |

**Relationships**:
- `project: Project` (FK: `projectId`, `onDelete: Cascade`) — deleting a project deletes all its logs

**Indexes** (performance-critical since logs are the highest-volume table):
| Index | Purpose |
|-------|---------|
| `@@index([projectId])` | Filter logs by project |
| `@@index([occurredAt])` | Time-range queries |
| `@@index([projectId, occurredAt])` | **Primary query index**: project + time ordered |
| `@@index([projectId, level])` | Project + level filter (level tab in UI) |

## Field Type Choices (Inferred)

- **User IDs**: `uuid()` — standard random UUIDs (matching Better Auth default)
- **Domain IDs (Org/Project/ApiKey/LogEvent)**: `cuid()` — collision-resistant sortable IDs suitable for URLs and high ingestion rate
- **All FK cascades**: `onDelete: Cascade` everywhere except `ApiKey.createdBy` which is `SetNull`. Migration `20260711065707_added_ondelete_cascade_for_every_model` applied this globally after schema was bootstrapped.
- **DateTime precision**: Prisma default for PostgreSQL (microsecond via `timestamp`)
- **JSON column**: PostgreSQL native `jsonb` for `LogEvent.payload`. Unstructured schema per event type.

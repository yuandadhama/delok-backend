# Database Relationships

This document visualizes every foreign key, join table, and cascade rule using a Mermaid ER diagram, then explains the relationship semantics.

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Session : "has (Cascade delete)"
    User ||--o{ Account : "has (Cascade delete)"
    User ||--o{ OrganizationMember : "belongs to many orgs"
    User ||--o{ ApiKey : "created by (SetNull on delete)"

    Organization ||--o{ Project : "contains (Cascade delete)"
    Organization ||--o{ OrganizationMember : "has members"

    OrganizationMember }|--|| User : "user"
    OrganizationMember }|--|| Organization : "organization"

    Project ||--o{ ApiKey : "has keys (Cascade delete)"
    Project ||--o{ LogEvent : "has logs (Cascade delete)"

    ApiKey }o--|| Project : "belongs to"
    ApiKey }o--o| User : "created by"

    LogEvent }o--|| Project : "belongs to"

    Verification : (managed by Better Auth, no FK)

    User {
        String id PK
        String name
        String email UK
        Boolean emailVerified
        String image
        DateTime createdAt
        DateTime updatedAt
    }

    Session {
        String id PK
        String token UK
        DateTime expiresAt
        String ipAddress
        String userAgent
        String userId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Account {
        String id PK
        String accountId
        String providerId
        String userId FK
        String accessToken
        String refreshToken
        String idToken
        DateTime accessTokenExpiresAt
        DateTime refreshTokenExpiresAt
        String scope
        String password
        DateTime createdAt
        DateTime updatedAt
    }

    Verification {
        String id PK
        String identifier
        String value
        DateTime expiresAt
        DateTime createdAt
        DateTime updatedAt
    }

    Organization {
        String id PK
        String name
    }

    OrganizationMember {
        String organizationId PK_FK
        String userId PK_FK
        OrganizationRole role
        DateTime joinedAt
    }

    Project {
        String id PK
        String name
        String organizationId FK
    }

    ApiKey {
        String id PK
        String name
        String keyHash UK
        String keyPrefix
        String projectId FK
        String createdById FK
        DateTime revokedAt
        DateTime lastUsedAt
        DateTime createdAt
    }

    LogEvent {
        String id PK
        String projectId FK
        String environment
        String level
        String event
        String message
        DateTime occurredAt
        DateTime receivedAt
        Json payload
    }
```

## Relationship Semantics

### User ↔ Session (1:N, Cascade Delete)
- **Cardinality**: One user has zero or more sessions; one session belongs to exactly one user.
- **Delete rule**: `onDelete: Cascade` — deleting a user destroys all their sessions (no orphaned session rows).
- **Lifecycle**: Better Auth creates sessions on sign-in and deletes them on sign-out or expiry cleanup. Backend code does not manually write to Session; it only reads via `auth.api.getSession()`.
- **Lookups**: Unique index on `token` (fast cookie → session resolution); index on `userId` (list user's sessions).

### User ↔ Account (1:N, Cascade Delete)
- **Cardinality**: One user can have multiple linked auth provider accounts (email, Google, GitHub); each account belongs to one user.
- **Delete rule**: `onDelete: Cascade`.
- **Lifecycle**: Better Auth creates an Account on first sign-in via a provider. For email+password, the `password` hash lives here under `providerId: "email"`.

### User ↔ Organization (M:N via `OrganizationMember` join table)
- **Join table**: `OrganizationMember` with composite PK `[organizationId, userId]`.
- **Cardinality**: A user belongs to 0..N organizations; an organization has 1..N members (practically at least 1 OWNER to be usable).
- **Role**: Each membership has a `role: OrganizationRole` (OWNER or MEMBER). See [authorization.md](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/backend/authorization.md).
- **Delete rules**: Both FKs are `Cascade`. Deleting a user removes all their memberships; deleting an org removes all its members (and via other cascades, all projects, keys, logs).

### Organization ↔ Project (1:N, Cascade Delete)
- **Cardinality**: One org has 0..N projects; a project belongs to exactly one org (project cannot be shared between orgs).
- **Delete rule**: `onDelete: Cascade` — deleting an organization also deletes all its projects, all projects' API keys, and all projects' log events. This is the widest cascade in the system.

### Project ↔ ApiKey (1:N, Cascade Delete)
- **Cardinality**: One project has 0..N API keys. A key belongs to exactly one project.
- **Delete rule**: `Cascade` on `projectId`.
- **Immutable binding**: A key's `projectId` never changes after creation. Revocation is via soft-delete (`revokedAt` field set to timestamp).

### User ↔ ApiKey (1:N, SetNull on Delete)
- **Cardinality**: A user created 0..N API keys; an API key has 0..1 creator (nullable).
- **Delete rule**: `onDelete: SetNull` on `createdById`. If the user who created a key is deleted, the key continues to work; the `createdBy` relation becomes null. This was likely chosen to avoid revoking production-valid keys just because a team member left.

### Project ↔ LogEvent (1:N, Cascade Delete)
- **Cardinality**: One project has many log events (potentially millions). A log event belongs to exactly one project.
- **Delete rule**: `Cascade` — deleting a project immediately deletes all its logs. There is no archive/soft-delete for logs.
- **Partitioning strategy (inferred)**: No native table partitioning is declared in the schema; partitioning is done at the query level via the compound `[projectId, occurredAt]` index, which ensures time-range scans within a project are fast.

### Verification (Standalone, No FKs)
- `Verification` has no foreign key relationships. It stores self-contained time-limited tokens. Better Auth looks rows up by `(identifier, value)` and checks `expiresAt`.

## Cascade Delete Chain

What happens when you delete a `User`?

```
DELETE User (id=X)
  → Cascade on OrganizationMember.user: all member rows for user X deleted
  → Cascade on Session.userId: all sessions deleted
  → Cascade on Account.userId: all linked auth accounts deleted
  → SetNull on ApiKey.createdById: keys created by X keep working, creator becomes NULL
```

What happens when you delete an `Organization`?

```
DELETE Organization (id=Y)
  → Cascade on OrganizationMember.organizationId: memberships deleted
  → Cascade on Project.organizationId:
       → all Projects in org Y deleted
            → Cascade on ApiKey.projectId: all keys deleted
            → Cascade on LogEvent.projectId: all log events deleted
```

This is a **deep cascade**. There is no "trash" or "recycle bin" concept.

## Referential Integrity Notes

- **Unique constraint on `User.email`**: Emails are globally unique. Two users cannot share an email.
- **Unique constraint on `ApiKey.keyHash`**: Two raw keys cannot hash to the same value (SHA-256 collision resistance makes this cryptographically safe; the DB constraint is a belt-and-suspenders measure).
- **Unique constraint on `Session.token`**: Prevents two sessions from sharing a token.
- **Composite PK on `OrganizationMember`**: A user cannot appear twice in the same org with different roles. To change a role, the membership row is updated in place (not deleted+inserted).

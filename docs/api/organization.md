# Organization API

All endpoints under `/api/organization` (plus nested project endpoints documented in [project.md](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/api/project.md)). Every endpoint requires a valid session via `authMiddleware`.

**Base URL**: `/api/organization`  
**Authentication**: Required (Better Auth session)  
**Pagination**: No — list endpoint returns all organizations the user belongs to.

---

## `GET /api/organization` — List My Organizations

Return all organizations where the authenticated user is a member (any role).

### Request

- Method: `GET`
- URL: `/api/organization`
- Headers: Cookies (Better Auth session)
- Body: None
- Query params: None

### Authorization

No explicit authorization helper; the service uses a query-level filter in the repository: only orgs where the user has an `OrganizationMember` row are returned.

### Response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "cl...",
      "name": "Acme Corp",
      "slug": "acme-corp"
    }
  ]
}
```

Each item is the raw Prisma Organization entity (only fields defined on the model are returned; `projects` / `organizationMembers` relations are NOT included).

### Service + Repository

- Service: [organization.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.service.ts#L30-L33) → `getAllOrganizationService(userId)`
- Repository: [organization.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.repository.ts#L27-L37) → `findAllOrganizations(userId)`: `findMany WHERE organizationMembers some { userId }`

### Error Responses

| Scenario                    | Status | Shape                                                                           |
| --------------------------- | ------ | ------------------------------------------------------------------------------- |
| No session cookie / expired | 401    | errorMiddleware: `{ success: false, error: { code, message: "unauthorized" } }` |

---

## `POST /api/organization` — Create Organization

Creates a new organization and automatically adds the authenticated user as `OWNER`.

### Request

- Method: `POST`
- URL: `/api/organization`
- Headers: Cookies + `Content-Type: application/json`
- Body (validated against `organizationSchema`):

```json
{
  "name": "Acme Corp"
}
```

| Field  | Zod rule                                                                     |
| ------ | ---------------------------------------------------------------------------- |
| `name` | Required string, trimmed, min 3 chars, max 100 chars, regex `/^[a-z0-9-]+$/` |

### Authorization

Automatic creator-as-owner pattern: no pre-authz check because the org doesn't exist yet. The repository creates the `OrganizationMember` with role `OWNER` atomically in the same `prisma.organization.create()` call (nested create).

### Slug Generation

The service derives the URL slug on creation via `generateSlug(name)` (lowercase, spaces → hyphens, strip unsupported characters). Because the Zod regex already restricts names to lowercase letters, numbers, and hyphens, `generateSlug` is a safe normalization for the same input.

### Response: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "Acme Corp",
    "slug": "acme-corp"
  }
}
```

### Service + Repository

- Service: [organization.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.service.ts#L18-L23) → `createOrganizationService(name, userId)`
- Repository: [organization.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.repository.ts#L9-L21) → `createOrganization(name, slug, userId)` creates org + nested OWNER membership in one transaction

### Error Responses

| Scenario                 | Status | Shape                                                                                                                  |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| No session               | 401    | errorMiddleware unauthorized                                                                                           |
| Body validation fails    | 400    | validate middleware: `{ success: false, errors: ZodIssue[] }`                                                          |
| Duplicate slug (`P2002`) | 409    | errorMiddleware: `{ success: false, error: { code, message } }` — for `Organization` model this surfaces as a conflict |

---

## `GET /api/organization/:slug` — Get Organization By Slug

Return a single organization if the user is a member.

### Request

- Method: `GET`
- URL: `/api/organization/:slug`
- Params: `slug` (URL slug; string — no format validation, handled by existence check)
- Body: None

### Authorization

Calls `ensureOrganizationMember(slug, userId)` — see [organization.authorization.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.authorization.ts#L13-L35).

### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "Acme Corp",
    "slug": "acme-corp"
  }
}
```

### Error Responses

| Scenario                      | Status | Message                                                           |
| ----------------------------- | ------ | ----------------------------------------------------------------- |
| Not a member OR org not found | 403    | `"Forbidden"` + delok.warn audit log `organization.access_denied` |
| No session                    | 401    | `"unauthorized"`                                                  |

---

## `PATCH /api/organization/:slug` — Update Organization

Change organization name. Requires `OWNER` role. The slug is **regenerated** from the new name so the URL identifier stays in sync.

### Request

- Method: `PATCH`
- URL: `/api/organization/:slug`
- Params: `slug`
- Body:

```json
{
  "name": "New Name"
}
```

Same Zod schema as create (trimmed, 3–100 chars, regex `/^[a-z0-9-]+$/`).

### Authorization

Calls `ensureOrganizationOwner(slug, userId)` — throws 403 if user is not owner.

### Slug Regeneration

`updateOrganizationService` recomputes `generateSlug(name)` and persists both `name` and the new `slug`. The old slug no longer resolves after the update; clients should use the new slug returned in the response.

### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "New Name",
    "slug": "new-name"
  }
}
```

### Error Responses

| Scenario                     | Status | Message                   |
| ---------------------------- | ------ | ------------------------- |
| Not owner (member role only) | 403    | `"Forbidden"` + audit log |
| Body validation fails        | 400    | Zod issues array          |
| Duplicate slug (`P2002`)     | 409    | errorMiddleware conflict  |
| No session                   | 401    | `"unauthorized"`          |

---

## `DELETE /api/organization/:slug` — Delete Organization

Deletes the organization and **cascades** to all projects, API keys, log events, and organization members. Requires `OWNER` role.

### Request

- Method: `DELETE`
- URL: `/api/organization/:slug`
- Params: `slug`
- Body: None

### Authorization

Calls `ensureOrganizationOwner(slug, userId)`.

### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "Deleted Org Name",
    "slug": "deleted-org-name"
  }
}
```

Prisma's `delete()` returns the deleted row, so `data` contains the final state before deletion.

### Cascade Impact (DB-level via FK rules)

- All `OrganizationMember` rows deleted
- All `Project` rows deleted
- All `ApiKey` rows under those projects deleted
- All `LogEvent` rows under those projects deleted

### Error Responses

| Scenario   | Status | Message          |
| ---------- | ------ | ---------------- |
| Not owner  | 403    | `"Forbidden"`    |
| No session | 401    | `"unauthorized"` |

---

## Route File Location

[organization.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.route.ts)

All routes use the pattern:
`authMiddleware → validate(schema, if any) → asyncHandler(controller)`

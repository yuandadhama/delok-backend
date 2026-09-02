# Project API

All project operations are mounted under an explicit **organization boundary**:

- **`/api/organizations/:organizationSlug/projects`** — list / create within an org
- **`/api/organizations/:organizationSlug/projects/:projectId`** — get / update / delete a project within an org

All endpoints require session authentication.

There is **no** standalone project route (e.g. `/api/project/:id`). Project access is always scoped to the organization represented by the request URL. See [Resource Boundary](#resource-boundary) below.

---

## `GET /api/organizations/:organizationSlug/projects` — List Projects in Org

Return all projects belonging to a specific organization.

### Request

- Method: `GET`
- URL: `/api/organizations/:organizationSlug/projects`
- Params: `organizationSlug` (URL slug)
- Query: None
- Body: None

### Authorization

`ensureOrganizationMember(organizationSlug, userId)` — user must be MEMBER or OWNER. The service resolves the slug to the organization, then lists projects by that organization's id.

### Response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "cl...",
      "name": "My Web App",
      "organizationId": "cl...",
      "createdAt": "2026-07-15T08:00:00.000Z",
      "updatedAt": "2026-07-15T08:00:00.000Z"
    }
  ]
}
```

Service: `getAllProjectsService(organizationSlug, userId)` → resolves slug → repo `findAllProjects(organizationId)` (findMany by org FK).

---

## `POST /api/organizations/:organizationSlug/projects` — Create Project

Create a new project inside an organization. Requires org OWNER role.

### Request

- Method: `POST`
- URL: `/api/organizations/:organizationSlug/projects`
- Params: `organizationSlug`
- Body (validated by `projectSchema`):

```json
{
  "name": "My Web App"
}
```

| Field  | Zod rule                              |
| ------ | ------------------------------------- |
| `name` | Required string, trimmed, 3–100 chars; case-insensitive unique per organization (DB index `project_organizationId_lower_name_idx` on `lower(name)`, migration `20260819120000`) — duplicate (case-insensitive) returns `409` via `P2002` |

### Authorization

`ensureOrganizationOwner(organizationSlug, userId)` — only org owners can create projects. The service resolves the slug to the organization id before creating the project row.

### Response: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "My Web App",
    "organizationId": "cl...",
    "createdAt": "2026-07-15T08:00:00.000Z",
    "updatedAt": "2026-07-15T08:00:00.000Z"
  }
}
```

Service: `createProjectService(name, userId, organizationSlug)` → resolves slug → repo `createProject(name, organizationId)`.

### Error Responses

| Scenario                           | Status | Message          |
| ---------------------------------- | ------ | ---------------- |
| Member (not Owner) tries to create | 403    | `"Forbidden"`    |
| Name < 3 or > 100                  | 400    | Zod issues array |

---

## `GET /api/organizations/:organizationSlug/projects/:projectId` — Get Project By ID

Return a single project's details, scoped to the organization.

### Request

- Method: `GET`
- URL: `/api/organizations/:organizationSlug/projects/:projectId`
- Params: `organizationSlug`, `projectId` (project CUID)

### Authorization

Two checks, applied in order:

1. `ensureOrganizationMember(organizationSlug, userId)` — user must be MEMBER or OWNER of the organization in the URL.
2. `ensureProjectInOrganization(projectId, organization.id)` — the project must belong to that organization.

The project's organization boundary is encoded directly in the repository query
(`findProjectByIdAndOrganization(projectId, organizationId)`), so a project that
belongs to a different organization is never returned even if the user is a
member of that other organization too.

### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "My Web App",
    "organizationId": "cl...",
    "createdAt": "2026-07-15T08:00:00.000Z",
    "updatedAt": "2026-07-15T08:00:00.000Z"
  }
}
```

Service: `getProjectByIdService(organizationSlug, projectId, userId)`.

---

## `PATCH /api/organizations/:organizationSlug/projects/:projectId` — Update Project Name

Change a project's name. Requires parent org OWNER role (not just MEMBER), and the project must belong to that organization.

### Request

- Method: `PATCH`
- URL: `/api/organizations/:organizationSlug/projects/:projectId`
- Params: `organizationSlug`, `projectId`
- Body:

```json
{
  "name": "Renamed Project"
}
```

Same Zod rules as create (trimmed, 3–100 chars).

### Authorization

1. `ensureOrganizationOwner(organizationSlug, userId)` — 403 if not an owner.
2. `ensureProjectInOrganization(projectId, member.organizationId)` — 404 if the project does not belong to that organization.

### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "Renamed Project",
    "organizationId": "cl...",
    "createdAt": "2026-07-15T08:00:00.000Z",
    "updatedAt": "2026-07-15T08:15:00.000Z"
  }
}
```

Service: `updateProjectService(organizationSlug, projectId, userId, name)` → repo `updateProject(projectId, name)`.

---

## `DELETE /api/organizations/:organizationSlug/projects/:projectId` — Delete Project

Delete a project and **cascade** all ApiKeys and LogEvents. Requires org OWNER role, and the project must belong to that organization.

### Request

- Method: `DELETE`
- URL: `/api/organizations/:organizationSlug/projects/:projectId`
- Params: `organizationSlug`, `projectId`

### Authorization

1. `ensureOrganizationOwner(organizationSlug, userId)` — 403 if not an owner.
2. `ensureProjectInOrganization(projectId, member.organizationId)` — 404 if the project does not belong to that organization.

### Cascade Impact (DB-level)

- All `ApiKey` rows for this project deleted
- All `LogEvent` rows for this project deleted

### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "Deleted Project",
    "organizationId": "cl...",
    "createdAt": "2026-07-15T08:00:00.000Z",
    "updatedAt": "2026-07-15T08:00:00.000Z"
  }
}
```

Service: `deleteProjectService(organizationSlug, projectId, userId)` → repo `deleteProject(projectId)`.

### Error Responses

| Scenario                                              | Status | Message               |
| ----------------------------------------------------- | ------ | --------------------- |
| No session                                            | 401    | `"unauthorized"`      |
| User is not owner of the URL organization             | 403    | `"Forbidden"`         |
| Project id doesn't exist **in that organization**     | 404    | `"Project not found"` |

---

## Resource Boundary

Project CRUD is deliberately organization-scoped. The backend validates **both**:

1. The authenticated user has the required access to the **organization represented by the URL** (member for read, owner for write).
2. The requested project actually belongs to **that organization** (`project.organizationId === organization.id`).

### Why `projectId` alone is not sufficient

A `projectId` (CUID) does not carry organization context. Given only a project ID, a
request could authorize a project based on its *actual* parent organization while the
frontend URL refers to a *different* organization, causing a resource-boundary
mismatch. For example, a project may belong to `delok-v2` while a user visits
`/orgs/test5/projects/<thatProjectId>`.

The organization in the URL must be the source of truth.

### Wrong-organization behavior (non-leaking)

When a request targets a project that does not belong to the organization in the URL,
the backend returns **404 `"Project not found"`**. It does **not** reveal that the
project exists under a different organization (e.g. no
`"This project belongs to delok-v2"`). This holds even when the user is a member of
**both** organizations — membership is not sufficient; the project must belong to the
URL's organization.

### Authorization order

```
Authenticated user
        ↓
Resolve organization by slug
        ↓
Verify user membership / ownership
        ↓
Resolve project inside that organization
        ↓
Verify project belongs to organization  (ensureProjectInOrganization)
        ↓
Perform operation
```

### Why this matters (examples)

Given: user is a member of `delok-v2` and `test5`; project `P` belongs to `delok-v2`.

| Request                                                          | Result |
| ---------------------------------------------------------------- | ------ |
| `GET /api/organizations/delok-v2/projects/P`                     | 200    |
| `GET /api/organizations/test5/projects/P`                        | 404    |
| `PATCH /api/organizations/test5/projects/P` (even as owner)      | 404    |
| `DELETE /api/organizations/test5/projects/P` (even as owner)     | 404    |
| `PATCH /api/organizations/delok-v2/projects/P` (owner)           | 200    |

---

## Authorization helpers

| Helper | Signature | Purpose |
| ------ | --------- | ------- |
| `ensureOrganizationMember` | `(slug, userId)` | 403 if user is not a member/owner |
| `ensureOrganizationOwner`  | `(slug, userId)` | 403 if user is not an owner |
| `ensureProjectInOrganization` | `(projectId, organizationId)` | 404 if project does not exist in the org |

`ensureProjectInOrganization` uses `findProjectByIdAndOrganization(projectId, organizationId)`,
which encodes the boundary in the query itself — it never fetches a project belonging to
another organization.

---

## Controller / Service / Repository Locations

| Layer         | File                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Controller    | [project.controller.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.controller.ts) |
| Service       | [project.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.service.ts) |
| Repository    | [project.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.repository.ts) |
| Authorization | [project.authorization.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.authorization.ts) |
| Validation    | [project.validation.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.validation.ts) |

## Mounting in App

From [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts):

```typescript
app.use(
  "/api/organizations/:organizationSlug/projects",
  organizationProjectRoute,
);
```

The router uses `{ mergeParams: true }` so controllers can access `req.params.organizationSlug` and `req.params.projectId`.

# Project API

Projects are mounted at **two** URL prefixes:
- **`/api/organizations/:organizationId/projects`** — list/create within an org (uses [organization-project.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/routes/organization-project.route.ts))
- **`/api/project/:id`** — get/update/delete individual project (uses [project.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/routes/project.route.ts))

All endpoints require session authentication.

---

## `GET /api/organizations/:organizationId/projects` — List Projects in Org

Return all projects belonging to a specific organization.

### Request
- Method: `GET`
- URL: `/api/organizations/:organizationId/projects`
- Params: `organizationId` (string CUID)
- Query: None
- Body: None

### Authorization
`ensureOrganizationMember(organizationId, userId)` — user must be MEMBER or OWNER.

### Response: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "cl...",
      "name": "My Web App",
      "organizationId": "cl..."
    }
  ]
}
```

Service: `getAllProjectsService(organizationId, userId)` → repo `findAllProjects(organizationId)` (findMany by org FK).

---

## `POST /api/organizations/:organizationId/projects` — Create Project

Create a new project inside an organization. Requires org OWNER role.

### Request
- Method: `POST`
- URL: `/api/organizations/:organizationId/projects`
- Params: `organizationId`
- Body (validated by `projectSchema`):
```json
{
  "name": "My Web App"
}
```
| Field | Zod rule |
|-------|---------|
| `name` | Required string, trimmed, 3–100 chars |

### Authorization
`ensureOrganizationOwner(organizationId, userId)` — only org owners can create projects.

### Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "My Web App",
    "organizationId": "cl..."
  }
}
```

Service: `createProjectService(name, userId, organizationId)` → repo `createProject(name, organizationId)`.

### Error Responses
| Scenario | Status | Message |
|----------|--------|---------|
| Member (not Owner) tries to create | 403 | `"Forbidden"` |
| Name < 3 or > 100 | 400 | Zod issues array |

---

## `GET /api/project/:id` — Get Project By ID

Return single project details.

### Request
- Method: `GET`
- URL: `/api/project/:id`
- Params: `id` (project CUID)

### Authorization
`ensureProjectMember(id, userId)` — user must be MEMBER or OWNER of the project's parent organization.

### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "My Web App",
    "organizationId": "cl..."
  }
}
```

Service: `getProjectByIdService(id, userId)` → returns the authorized project entity.

---

## `PATCH /api/project/:id` — Update Project Name

Change a project's name. Requires parent org OWNER role (not just MEMBER).

### Request
- Method: `PATCH`
- URL: `/api/project/:id`
- Params: `id`
- Body:
```json
{
  "name": "Renamed Project"
}
```
Same Zod rules as create (trimmed, 3–100 chars).

### Authorization
`ensureProjectManagementAccess(id, userId)`:
1. `findProjectById(id)` → if 404 throw `AppError("Project not found", 404)`
2. `ensureOrganizationOwner(project.organizationId, userId)` → 403 if not owner

### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "name": "Renamed Project",
    "organizationId": "cl..."
  }
}
```

Service: `updateProjectService(id, userId, name)` → repo `updateProject(id, name)`.

---

## `DELETE /api/project/:id` — Delete Project

Delete a project and **cascade** all ApiKeys and LogEvents. Requires org OWNER role.

### Request
- Method: `DELETE`
- URL: `/api/project/:id`
- Params: `id`

### Authorization
`ensureProjectManagementAccess(id, userId)` (same as update; must be org owner).

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
    "organizationId": "cl..."
  }
}
```

Service: `deleteProjectService(id, userId)` → repo `deleteProject(id)`.

### Error Responses
| Scenario | Status | Message |
|----------|--------|---------|
| Project id doesn't exist | 404 | `"Project not found"` |
| Not owner of parent org | 403 | `"Forbidden"` |
| No session | 401 | `"unauthorized"` |

---

## Controller / Service / Repository Locations

| Layer | File |
|-------|------|
| Controller | [project.controller.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.controller.ts) |
| Service | [project.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.service.ts) |
| Repository | [project.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.repository.ts) |
| Authorization | [project.authorization.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.authorization.ts) |
| Validation | [project.validaton.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/project.validaton.ts) (note: typo "validaton" not "validation") |

## Mounting in App

From [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L54-L58):
```typescript
app.use("/api/organizations/:organizationId/projects", organizationProjectRoute);
app.use("/api/project", projectRoute);
```

Both routers use `{ mergeParams: true }` because `organizationProjectRoute` needs access to `req.params.organizationId`.

# API Key API

API keys are mounted at **two** URL prefixes:
- **`/api/projects/:projectId/api-keys`** — create/list keys for a project (uses [project-api-key.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/api-key/routes/project-api-key.route.ts))
- **`/api/api-key/:id`** — rename/revoke an individual key (uses [api-key.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/api-key/routes/api-key.route.ts))

All endpoints require session authentication (not API-key-auth — these are the *management* endpoints for keys, not the ingestion endpoint).

---

## `POST /api/projects/:projectId/api-keys` — Create API Key

Create a new API key for a project. **The plaintext key is returned exactly once** in the 201 response; only a hash is stored.

### Request
- Method: `POST`
- URL: `/api/projects/:projectId/api-keys`
- Params: `projectId` (CUID)
- Body (validated by `ApiKeySchema`):
```json
{
  "name": "Production Backend Service"
}
```
| Field | Zod rule |
|-------|---------|
| `name` | Required string, 3–100 chars |

### Authorization
`ensureProjectManagementAccess(projectId, userId)` — user must be **OWNER** of the project's parent organization. MEMBER role is insufficient.

### Key Generation (Service Layer)
1. Generate 32 random bytes → hex → `rawKey = "dlok_" + hex` (total 64 hex chars + `dlok_` prefix = 69 chars)
2. `keyPrefix = rawKey.slice(0, 12)` (e.g., `"dlok_6d096840"`) — stored to help user identify the key in UI
3. `keyHash = sha256(rawKey)` — only this is persisted (**never the plaintext**)

### Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "key": "dlok_6d096840182d8449a85fe0e0f7a30b5ac2de112558f4a800d39ab413420c74d7"
  }
}
```

⚠️ **The backend never returns `data.key` again.** Subsequent endpoints return only metadata (prefix, created date, revoked status). The UI must prompt the user to copy it immediately.

### Audit Log
After creation, the service emits `delok.info` event: `api-key.created` with org ID, org name, project ID, project name as payload. The backend records its own management actions in itself.

### Service + Repository
- Service: [api-key.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/api-key/api-key.service.ts#L27-L60)
- Repository: [api-key.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/api-key/api-key.repository.ts#L10-L21)

### Error Responses
| Scenario | Status | Message |
|----------|--------|---------|
| Not org owner | 403 | `"Forbidden"` |
| Project not found | 404 | `"Project not found"` (via ensureProjectManagementAccess) |
| Name validation fails | 400 | Zod issues array |

---

## `GET /api/projects/:projectId/api-keys` — List API Keys for Project

Return metadata for all API keys belonging to a project. **The raw key or keyHash is never returned.**

### Request
- Method: `GET`
- URL: `/api/projects/:projectId/api-keys`
- Params: `projectId`
- Query: None

### Authorization
`ensureProjectManagementAccess(projectId, userId)` — must be org owner. (Note: this is stricter than generic project membership; even MEMBERs cannot list/view API keys.)

### Response: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "cl...",
      "name": "Production Backend",
      "keyPrefix": "dlok_ab12cd34",
      "lastUsedAt": "2026-08-02T10:30:00.000Z",
      "createdAt": "2026-07-15T08:00:00.000Z",
      "revokedAt": null
    }
  ]
}
```

Repository `select` clause explicitly whitelists these fields; `keyHash`, `projectId`, and `createdById` are excluded. Result is ordered by `createdAt DESC` (newest first).

### Service + Repository
- Service: [api-key.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/api-key/api-key.service.ts#L70-L77)
- Repository: [api-key.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/api-key/api-key.repository.ts#L40-L57)

---

## `PATCH /api/api-key/:id` — Rename API Key

Change the human-readable name of an API key.

### Request
- Method: `PATCH`
- URL: `/api/api-key/:id`
- Params: `id` (ApiKey CUID)
- Body (validated by `ApiKeySchema`):
```json
{
  "name": "Staging Service"
}
```

### Authorization (Two-Step)
1. `findApiKeyById(id)` — 404 `"ApiKey not found"` if missing
2. If `apiKey.revokedAt` is set → 400 `"API key already revoked cannot update name"` (names are frozen after revocation)
3. `ensureProjectManagementAccess(apiKey.projectId, userId)` — must be org owner of the linked project

### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "API Key name updated",
    "id": "cl...",
    "name": "Staging Service"
  }
}
```

Note: custom shaped response (not raw entity) — only returns a message plus id/name.

---

## `PATCH /api/api-key/:id/revoke` — Revoke API Key

Permanently revoke a key. Revoked keys are rejected by the ingestion flow. **Revocation is irreversible.**

### Request
- Method: `PATCH`
- URL: `/api/api-key/:id/revoke`
- Params: `id`
- Body: None (no schema validated for this endpoint)

### Authorization (Two-Step)
1. `findApiKeyById(id)` — 404 if missing
2. If `revokedAt` already set → 400 `"API key already revoked"` (idempotency protection to avoid confusion)
3. `ensureProjectManagementAccess(apiKey.projectId, userId)` — must be org owner

### Revocation Mechanism

This is a **soft delete** — the row is not removed. Repository function `revokeApiKey(id)` sets:
```prisma
data: { revokedAt: new Date() }
```

Ingestion ([ingestion.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/ingestion/ingestion.service.ts#L36-L38)) checks this field on every request:
```typescript
if (apiKey.revokedAt) {
  throw new AppError("API Key already revoked", 401);
}
```

### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Api Key revoked successfully",
    "id": "cl...",
    "revokedAt": "2026-08-02T11:00:00.000Z"
  }
}
```

---

## Mounting in App

From [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L67-L68):
```typescript
app.use("/api/projects/:projectId/api-keys", projectApiKeyRoute);
app.use("/api/api-key", apiKeyRoute);
```

Both routers use `{ mergeParams: true }` because `projectApiKeyRoute` needs `req.params.projectId`.

## Key Security Properties Summary
- Plaintext key never stored (SHA-256 hashed)
- KeyHash DB unique constraint
- Revocation is permanent, checked every request
- `lastUsedAt` throttled update (every 5+ minutes only, not every single ingestion)
- `createdById` → SetNull on user delete: removing a user does **not** revoke their keys
- `projectId` → Cascade on project delete: removing a project destroys all its keys

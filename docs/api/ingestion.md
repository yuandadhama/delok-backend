# Ingestion API

Single endpoint for the Delok SDK to send log events to the backend.

**Base URL**: `/api/ingestion`  
**Authentication**: Via `x-api-key` request header (**not session cookies**). See [authentication.md API Key section](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/backend/authentication.md#api-key-authentication-ingestion-only).

Unlike other endpoints, no `authMiddleware` is mounted on this route. Authentication is handled in the controller/service.

---

## `POST /api/ingestion` — Ingest Log Event

Receive a single log event from the Delok SDK running in a user's application. Persists it to the database and broadcasts it to any WebSocket subscribers for the linked project.

### Request

- Method: `POST`
- URL: `/api/ingestion`

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `x-api-key` | Yes | Raw API key string in the format `dlok_<64 hex chars>`. HMAC-SHA256'd for lookup. |

**Body** (validated against `createLogEventSchema` by the `validate()` middleware):
```json
{
  "environment": "production",
  "level": "error",
  "event": "auth.signin.failed",
  "message": "Invalid password for user admin@example.com",
  "occurredAt": "2026-08-02T10:30:00.000Z",
  "payload": {
    "userId": "user_123",
    "ip": "192.168.1.1",
    "stack": "..."
  }
}
```

| Field | Zod rule | Notes |
|-------|---------|-------|
| `environment` | Required, non-empty string (min 1) | User-defined env tag. No enum enforcement — any string accepted. |
| `level` | Required, non-empty string (min 1) | User-defined log level. Any string (e.g. "info", "warn", "error"). No case normalization. |
| `event` | Required, non-empty string (min 1) | Semantic event name used for searching. |
| `message` | Optional string | Human-readable message. `null`/omitted allowed. |
| `occurredAt` | Required, `z.coerce.date()` | When the client says the event happened. Prisma stores as timestamp. Coercion means both ISO strings and JS Date (if serialized) work. |
| `payload` | Optional, any JSON (`z.unknown()`) | Arbitrary structured context. Stored in native PostgreSQL Json column. |

Validation fails with `400 + Zod issues` if any required field is missing or has wrong type (e.g., `occurredAt` unparseable as date).

### Authentication Flow (Controller + Service)

```mermaid
flowchart LR
    A[req.get x-api-key] --> B{Exists?}
    B -- No --> C[throw AppError 401: API key required]
    B -- Yes --> D[sha256 rawKey → keyHash]
    D --> E[findApiKeyByKeyHash keyHash]
    E --> F{Found?}
    F -- No --> G[AppError 401 INVALID_API_KEY]
    F -- Yes --> H{revokedAt null?}
    H -- No (revoked) --> I[AppError 401: API Key already revoked]
    H -- Yes --> J{lastUsedAt older than 5 min OR null?}
    J -- Yes --> K[UPDATE ApiKey SET lastUsedAt = now()]
    J -- No --> L[Skip update (save DB write)]
    K --> M[INSERT LogEvent with apiKey.projectId]
    L --> M
    M --> N[realtime.emit log.created]
```

### Response: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "cl...",
    "projectId": "cl...",
    "environment": "production",
    "level": "error",
    "event": "auth.signin.failed",
    "message": "Invalid password for user admin@example.com",
    "occurredAt": "2026-08-02T10:30:00.000Z",
    "receivedAt": "2026-08-02T10:30:00.123Z",
    "payload": {
      "userId": "user_123",
      "ip": "192.168.1.1",
      "stack": "..."
    }
  }
}
```

Returns the full stored LogEvent entity, including:
- `id` (CUID) — generated server-side by Prisma (not client-supplied)
- `receivedAt` — server timestamp, always set to `now()` by the DB default (client cannot spoof)
- `projectId` — taken from the linked API key. Client cannot specify a different project.

### Realtime Broadcast

After the DB INSERT returns, service calls:
```typescript
realtime.emit({
  type: "log.created",
  data: createdLog,
});
```

This sends the full `createdLog` payload to all WebSocket clients subscribed to `projectId`. See [realtime.md](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/backend/realtime.md).

### Performance Notes
- **`lastUsedAt` throttled update**: Only writes to `ApiKey` row if >5 minutes since last write. Prevents a DB UPDATE on every single ingestion (which would double write load for high-volume ingestors).
- **INSERT + broadcast are sequential, not batched**: This endpoint accepts one log event per request. Unable to determine from current implementation whether a batch endpoint exists (no batch route found in code).
- **Key lookup uniqueness**: `keyHash` has a `@unique` DB constraint → single-row lookup is O(1) via B-tree; no hash join or scan needed.
- **Indexes on log_event**: `[projectId, occurredAt]` supports the listing query pattern; `[projectId, level]` supports level filtering.

### Error Responses

| Scenario | Status | error.code | error.message |
|----------|--------|-----------|---------------|
| Missing `x-api-key` header | 401 | UNKNOWN_ERROR | `API key required` |
| Key hash not in DB (wrong/unknown key) | 401 | **`INVALID_API_KEY`** | `Invalid API key` |
| Key exists but revoked (`revokedAt` set) | 401 | UNKNOWN_ERROR | `API Key already revoked` |
| Body validation (missing field, bad date) | 400 | — | Zod `issues` array shape (validate middleware direct response) |
| Body too large? | Unable to determine from current implementation — `express.json()` default limit (100KB) applies; no explicit `limit` option set in app.ts |

### Route / Service / Repository Locations

| Layer | File |
|-------|------|
| Route | [ingestion.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/ingestion/ingestion.route.ts) |
| Controller | [ingestion.controller.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/ingestion/ingestion.controller.ts) |
| Service | [ingestion.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/ingestion/ingestion.service.ts) |
| Repository | [ingestion.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/ingestion/ingestion.repository.ts) |
| Validation | [ingestion.validation.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/ingestion/ingestion.validation.ts) |

### Mounting in App

From [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L61):
```typescript
app.use("/api/ingestion", ingestionRoute);
```

No `authMiddleware` on this route (intentionally).

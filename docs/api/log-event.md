# Log Event API

Single endpoint for listing and filtering log events stored for a project. WebSocket realtime delivery is documented separately in [realtime.md](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/backend/realtime.md) and [ingestion.md](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/api/ingestion.md) for the write path.

**Base URL**: `/api/projects/:projectId/logs`  
**Mounted by**: [project-log-event.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/log-event/routes/project-log-event.route.ts)  
**Authentication**: Required (session via `authMiddleware`)

---

## `GET /api/projects/:projectId/logs` — List Log Events for Project

Return paginated log events for a project, with optional filtering.

### Request

- Method: `GET`
- URL: `/api/projects/:projectId/logs`

**Path params**:
| Param | Description |
|-------|-------------|
| `projectId` | CUID of the project. User must be MEMBER or OWNER of its parent organization. |

**Query params** (validated by `logEventQuerySchema.parse(req.query)` inside controller):

| Param | Zod type | Default | Meaning |
|-------|---------|---------|---------|
| `page` | `z.coerce.number().int().positive()` | 1 | 1-indexed page number. Coerced from string query param. |
| `limit` | `z.coerce.number().int().positive().max(100)` | 50 | Items per page. Max 100 to prevent huge queries. |
| `level` | `z.string().trim().toLowerCase().optional()` | (none) | Filter by exact level match, e.g. `?level=error`. Case-insensitive due to `toLowerCase()`. |
| `environment` | `z.string().trim().optional()` | (none) | Filter by exact environment match, e.g. `?environment=production`. |
| `search` | `z.string().trim().optional()` | (none) | Full-text-ish search: matches `event` OR `message` field with `ILIKE` (case-insensitive contains). |
| `from` | `z.coerce.date().optional()` | (none) | Start of time window. Only events with `occurredAt >= from`. |
| `to` | `z.coerce.date().optional()` | (none) | End of time window. Implementation: `occurredAt < to + 1 day` so querying `?to=2026-08-02` includes all events on that entire day (inclusive day boundary, not instant boundary). |

### Authorization

`ensureProjectMember(projectId, userId)` — user must be a MEMBER or OWNER of the project's parent organization. Checks org membership via a join-query in repository (`findProjectByIdForMember`).

### Pagination Logic (Service Layer)

```
skip = (page - 1) * limit
total  = countLogs(projectId, filter)
logs   = findLogsByProjectId(projectId, { skip, take: limit }, filter)
totalPages = ceil(total / limit)
hasNextPage = page < totalPages
hasPreviousPage = page > 1
```

`countLogs` and `findLogsByProjectId` both apply the same filter so counts and pages align. Both run in parallel via `Promise.all()` to save one round trip.

### Filter Composition (Query Builder)

File: [log-event.query.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/log-event/log-event.query.ts)

Function `buildLogFilter(filter)` returns a `Prisma.LogEventWhereInput`:

| Filter param | Prisma equivalent |
|-------------|-------------------|
| `level` | `{ level: level }` (exact match; lowercased by Zod before reaching here) |
| `environment` | `{ environment: environment }` (exact match) |
| `from` or `to` | `occurredAt: { gte: from }` and/or `lt: nextDay` (see to + 1 day note above) |
| `search` | `OR: [{ event: { contains, mode: insensitive } }, { message: { contains, mode: insensitive } }]` |

All filters are AND-combined (spread into the same `where` object), so e.g. `?level=error&environment=production` returns rows that are both error AND production.

### Ordering

Repository sorts: `orderBy: { occurredAt: "desc" }` — newest events first (most logs UIs want this).

### Response: `201 Created` (note: status code is 201, not 200)

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "cl...",
        "projectId": "cl...",
        "environment": "production",
        "level": "error",
        "event": "auth.signin.failed",
        "message": "Invalid password",
        "occurredAt": "2026-08-02T10:30:00.000Z",
        "receivedAt": "2026-08-02T10:30:00.123Z",
        "payload": { "userId": "user_123", "ip": "..." }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1234,
      "totalPages": 25,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### File Locations

| Layer | File |
|-------|------|
| Route | [project-log-event.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/log-event/routes/project-log-event.route.ts) |
| Controller | [log-event.controller.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/log-event/log-event.controller.ts) |
| Service | [log-event.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/log-event/log-event.service.ts) |
| Repository | [log-event.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/log-event/log-event.repository.ts) |
| Query builder | [log-event.query.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/log-event/log-event.query.ts) |
| Validation (schemas + types) | [log-event.validation.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/log-event/log-event.validation.ts) |
| Types (query options, filter shapes) | [log-event.type.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/log-event/log-event.type.ts) |

### Error Responses

| Scenario | Status | Message / Shape |
|----------|--------|-----------------|
| No session | 401 | errorMiddleware: `"unauthorized"` |
| Not a member of project's org | 403 | `"Forbidden"` |
| Invalid query param (e.g. `?page=abc` or `?limit=1000`) | 500 | Generic `"Internal Server Error"` (note: schema `.parse()` throws ZodError which errorMiddleware categorizes as generic Error. Contrast with body validation's structured 400 Zod issues.) |

### Status Code Note

The controller returns `res.status(201)` for a read-only GET request. Typically GET would be 200; the 201 appears to be a copy-paste artifact from other endpoints. The actual semantics are still list+read, not create. Documented as-is.

### Mounting in App

From [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L64):
```typescript
app.use("/api/projects/:projectId/logs", projectLogEventRoute);
```

Router uses `{ mergeParams: true }` to access `req.params.projectId`.

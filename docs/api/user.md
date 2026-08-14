# User API

The user module exposes a single endpoint: `GET /api/user/me`. Routes file: [user.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/user/user.route.ts).

> The previous standalone user CRUD endpoints (`GET /api/user` list, `GET /api/user/search`, `GET /api/user/:id`, `POST /api/user`, `PUT /api/user/:id`, `DELETE /api/user/:id`) and their `user.service.ts` / `user.repository.ts` / `user.validation.ts` layers were removed. User creation and authentication are handled by Better Auth (`/api/auth/*`). The `user` module now only serves the authenticated session.

---

## `GET /api/user/me` — Current Session User

Return the authenticated user's session object (from Better Auth).

### Request
- Method: `GET`
- URL: `/api/user/me`
- Headers: Cookies (Better Auth session)
- Auth: **Protected** — requires valid session (`authMiddleware`).

### Controller

Returns `req.session` directly — the full Better Auth session object (not just the user entity).

### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "emailVerified": true,
      "image": "https://...",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "session": {
      "id": "...",
      "token": "...",
      "expiresAt": "...",
      ...
    }
  }
}
```

Service: No service call — controller returns `req.session` directly (unique in this module).

### Error Responses
| Scenario | Status | Message |
|----------|--------|---------|
| No session | 401 | `"unauthorized"` |

---

## File Locations

| Layer | File |
|-------|------|
| Route | [user.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/user/user.route.ts) |
| Controller | [user.controller.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/user/user.controller.ts) |

## Mounting in App

From [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L48):
```typescript
app.use("/api/user", userRoute);
```

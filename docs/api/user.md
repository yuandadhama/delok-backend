# User API

All endpoints under `/api/user`. Routes file: [user.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/user/user.route.ts).

> **Important authentication note (from code analysis)**:
> - Only `GET /api/user/me` is protected with `authMiddleware`.
> - `GET /api/user` (list), `GET /api/user/:id`, `GET /api/user/search`, `POST /api/user`, `PUT /api/user/:id`, and `DELETE /api/user/:id` have **no auth middleware** and **no authorization checks**. They are publicly accessible by any caller with network access to the backend. Whether this is intentional could not be determined from the current implementation. Documented behavior below matches the code exactly.

---

## `GET /api/user/me` — Current Session User

Return the authenticated user's session object (from Better Auth).

### Request
- Method: `GET`
- URL: `/api/user/me`
- Headers: Cookies (Better Auth session)
- Auth: **Protected** — requires valid session.

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

## `GET /api/user` — List All Users

Return **all** users in the database (unpaged, unfiltered).

### Request
- Method: `GET`
- URL: `/api/user`
- Auth: **Public** (no auth middleware). No authorization.

### Response: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "emailVerified": true,
      "image": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

Repository: `findAll()` → `prisma.user.findMany()` with no WHERE clause.

---

## `GET /api/user/search?name=<keyword>` — Search Users By Name

Case-insensitive substring match on `User.name`.

### Request
- Method: `GET`
- URL: `/api/user/search`
- Auth: **Public**
- Query:
| Param | Type | Description |
|-------|------|-------------|
| `name` | string | Keyword. Case-insensitive contains search. `searchUserByNameController` coerces with `String(req.query.name)` — if missing, becomes the literal string `"undefined"`. |

### Response: `200 OK`
```json
{
  "success": true,
  "data": [
    { "id": "...", "name": "John Doe", ... }
  ]
}
```

Repository: `findByName(name)` → `findMany WHERE name ILIKE %keyword%`.

---

## `GET /api/user/:id` — Get Single User By ID

Return one user entity.

### Request
- Method: `GET`
- URL: `/api/user/:id`
- Auth: **Public**
- Params: `id` (User UUID v4)

### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid...",
    "name": "...",
    "email": "...",
    ...
  }
}
```

### Error Responses
| Scenario | Status | Message |
|----------|--------|---------|
| ID not found in DB | 404 | `"user not found"` (thrown by service) |

Service: `getUserByIdService(id)` → `findById(id)` → throws `AppError("user not found", 404)` if null.

---

## `POST /api/user` — Create User

Insert a new user into the User table directly. Note: in most cases users are created by Better Auth (sign-up) instead.

### Request
- Method: `POST`
- URL: `/api/user`
- Auth: **Public**
- Body validated via `createUserSchema`:
```json
{
  "name": "Alice",
  "email": "alice@example.com"
}
```
| Field | Zod rule |
|-------|---------|
| `name` | string, min 3 chars, max 100 chars |
| `email` | valid email format via `z.email()` |

### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid...",
    "name": "Alice",
    "email": "alice@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Repository: `createUser(name, email)` → `prisma.user.create`. Does NOT create sessions, accounts, verification tokens — this is a raw user row. To avoid creating "orphan" users (unusable for login), the standard sign-up path via Better Auth should be used instead.

### Error Responses
| Scenario | Status | Message / Shape |
|----------|--------|-----------------|
| Body invalid (name too short / bad email) | 400 | Zod `issues` array |
| Email already exists (unique constraint violation on `email`) | 500 | Generic `"Internal Server Error"` (Prisma error surfaces as 500 via errorMiddleware; no explicit unique-constraint handling in service) |

---

## `PUT /api/user/:id` — Update User

Overwrite a user's name and email.

### Request
- Method: `PUT`
- URL: `/api/user/:id`
- Auth: **Public**
- Body validated via `updateUserSchema`:
```json
{
  "name": "Updated Name",
  "email": "new-email@example.com"
}
```
Same Zod rules as create: `name` (3–100 chars), `email` (valid format).

### Business Logic (Service)
```
existingUser = findById(id)
if (!existingUser) throw AppError("user not found to be updated", 404)
return updateUser(id, { name, email })
```

### Response: `200 OK`
Returns the updated user entity.

### Error Responses
| Scenario | Status | Message |
|----------|--------|---------|
| ID not found | 404 | `"user not found to be updated"` |
| New email duplicates another user's | 500 | Generic internal error (unique constraint) |

---

## `DELETE /api/user/:id` — Delete User

Delete a user row. Cascades to sessions, accounts, organization memberships. Sets `ApiKey.createdById → NULL` on the user's API keys (keys keep working).

### Request
- Method: `DELETE`
- URL: `/api/user/:id`
- Auth: **Public**

### Business Logic (Service)
```
existingUser = findById(id)
if (!existingUser) throw AppError("user not found to be deleted", 404)
return deleteUser(id)
```

### Cascade Impact
- Sessions, Accounts, Verification (if any tied to this user), OrganizationMember rows: **Cascade deleted** by DB FK rules
- ApiKey rows created by this user: **`createdById` → NULL**; keys themselves remain valid

### Response: `200 OK`
Returns the deleted user entity.

### Error Responses
| Scenario | Status | Message |
|----------|--------|---------|
| ID not found | 404 | `"user not found to be deleted"` |

---

## File Locations

| Layer | File |
|-------|------|
| Route | [user.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/user/user.route.ts) |
| Controller | [user.controller.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/user/user.controller.ts) |
| Service | [user.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/user/user.service.ts) |
| Repository | [user.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/user/user.repository.ts) |
| Validation + Types | [user.validation.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/user/user.validation.ts) |

## Mounting in App

From [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L49):
```typescript
app.use("/api/user", userRoute);
```

# Create a New Route

This guide explains how to add a new endpoint to an **existing** module. For creating a whole new module from scratch, see [create-module.md](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/guides/create-module.md).

## 1. Choose the Correct Route File

Routes live in:
- `src/modules/<domain>/<domain>.route.ts` — if the domain has one URL prefix
- `src/modules/<domain>/routes/<prefix>-<domain>.route.ts` — if mounted at multiple prefixes (e.g. project uses both `/api/organizations/:organizationSlug/projects` for list/create and `/api/organizations/:organizationSlug/projects/:projectId` for get/update/delete)

If adding a route whose URL path contains a parameter from the **parent** mount (e.g. `GET /api/organizations/:organizationId/teams` needs access to `req.params.organizationId`), the router **must** be created with `{ mergeParams: true }`. Existing multi-prefix routers already have this set.

## 2. Middleware Order

All route registrations follow the same order. Do NOT reorder.

```
Method:  GET | POST | PATCH | DELETE
Path:    "/path"
1st:     authMiddleware?               ← if protected by session (not ingestion)
2nd:     validate(schema)?             ← if request body exists
3rd:     asyncHandler(controller)      ← ALWAYS wrap async controllers
```

### When to include each middleware

| Middleware | Include if... | Example |
|-----------|---------------|---------|
| `authMiddleware` | The caller must be a logged-in user (session auth) | All organization/project/key/user-me routes |
| `validate(schema)` | The endpoint has a JSON body (POST, PATCH, PUT) | `validate(organizationSchema)` |
| `asyncHandler(controller)` | The controller is `async` or returns a promise | **Always** (all controllers in this codebase are async) |

### When to skip middleware

| Middleware | Skip if... | Example |
|-----------|-----------|---------|
| `authMiddleware` | Endpoint uses API-key auth instead | `POST /api/ingestion` |
| `authMiddleware` | Endpoint is genuinely public (rare) | `GET /api/user/search` (today, though see user.md for security note) |
| `validate(schema)` | No body (GET, DELETE) OR validation is done manually inside controller | Query param validation (currently Zod `.parse` in controller) |
| `authMiddleware` + `validate` | Auth endpoint handled by Better Auth catch-all | `/api/auth/*splat` is delegated to `toNodeHandler(auth)` |

## 3. Three Common Patterns

### Pattern A: Protected Read (GET)

```typescript
organizationRoute.get(
  "/:id",
  authMiddleware,
  asyncHandler(getOrganizationByIdController),
);
```

### Pattern B: Protected Write with Body (POST / PATCH / PUT)

```typescript
organizationRoute.post(
  "/",
  authMiddleware,
  validate(organizationSchema),
  asyncHandler(createOrganizationController),
);
```

### Pattern C: Public Ingestion Endpoint with API Key Auth

No `authMiddleware` — authentication is in the controller/service layer (reads `x-api-key` header).

```typescript
ingestionRoute.post(
  "/",
  validate(createLogEventSchema),
  asyncHandler(createLogEventController),
);
```

## 4. Controller Signature

Controllers always have the signature `async (req: Request, res: Response)` (no `next` parameter in practice since `asyncHandler` bridges errors).

Before writing the controller, **determine the source of each argument** your service will need:

| Parameter | Source | Extract like |
|-----------|--------|--------------|
| Path ID `:id` | `req.params.id` | `String(req.params.id)` |
| Parent path param `:organizationId` (with `mergeParams`) | `req.params.organizationId` | `String(req.params.organizationId)` |
| Authenticated user ID | `req.session.user.id` | Direct access (requires `authMiddleware` to have run) |
| Body fields | `req.body.field` | Destructure `const { name, email } = req.body;` (has been Zod-validated and coerced) |
| Query params | `req.query` | Use `schema.parse(req.query)` inside the controller (today's pattern) |
| Custom header (x-api-key) | `req.get("header-name")` | `const apiKey = req.get("x-api-key");` |

Then call **one** service function with plain arguments.

```typescript
export const getOrganizationByIdController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;
  const data = await getOrganizationByIdService(id, userId);
  res.json({ success: true, data });
};
```

Response status codes:
| Operation | Status | Method |
|-----------|--------|--------|
| Create (POST) success | 201 | `res.status(201).json(...)` |
| Read (GET) success | 200 | `res.json(...)` (defaults to 200) |
| Update (PATCH/PUT) success | 200 | `res.json(...)` |
| Delete (DELETE) success | 200 | `res.json(...)` |
| Errors | Varies | Never manually set errors in controllers — **throw `AppError` and let errorMiddleware handle it** |

## 5. Query Parameter Validation

Today's pattern (from `log-event` module):

```typescript
const query = logEventQuerySchema.parse(req.query);
```

This uses `.parse()` inside the controller and lets the resulting ZodError propagate to errorMiddleware → 500 Internal Server Error (no structured issues in response).

If you want the same structured Zod response format used by the `validate()` body middleware, extract query validation into a middleware similar to `validate()` but operating on `req.query` instead of `req.body`:

```typescript
// Hypothetical pattern for consistency (illustrative, not in codebase today)
export const validateQuery = (schema: ZodType) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) return res.status(400).json({ success: false, errors: result.error.issues });
  req.query = result.data as any;
  next();
};
```

Use either approach, but keep the convention consistent across the project.

## 6. Mount the Router in `app.ts`

If the route file is **new** (not just a new endpoint in an existing router), import and `.use()` it in [app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts).

Ordering convention from app.ts today:
1. CORS, JSON, request logger
2. Auth routes + Better Auth catch-all
3. User routes
4. Organization routes
5. Nested org→projects routes (owns all project CRUD)
6. Ingestion
7. Project→logs, Project→api-keys, standalone api-key routes
8. `/` test page
9. `errorMiddleware` last

Add your new module's router in the section that matches its domain (e.g., a team router would go right after organization routes, before project routes).

## 7. Full End-to-End Example

Let's add `PATCH /api/organization/:id/transfer-ownership` (hypothetical) to the organization module.

### Step 1: Add to validation (no new schema needed — we'll reuse or add)

```typescript
// organization.validation.ts (new export)
export const transferOwnershipSchema = z.object({
  newOwnerUserId: z.string().min(1, "newOwnerUserId required"),
});
```

### Step 2: Add to repository

```typescript
// organization.repository.ts (new function)
export const findOrganizationMembership = async (organizationId: string, userId: string) =>
  prisma.organizationMember.findFirst({ where: { organizationId, userId } });

export const changeMembershipRole = async (organizationId: string, userId: string, role: OrganizationRole) =>
  prisma.organizationMember.update({ where: { organizationId_userId: { organizationId, userId } }, data: { role } });
```

### Step 3: Add to service

```typescript
// organization.service.ts
export const transferOwnershipService = async (
  organizationId: string,
  currentUserId: string,
  newOwnerUserId: string,
) => {
  await ensureOrganizationOwner(organizationId, currentUserId);
  const targetMembership = await findOrganizationMembership(organizationId, newOwnerUserId);
  if (!targetMembership) throw new AppError("Target user is not in organization", 400);
  // Downgrade old owner to member
  await changeMembershipRole(organizationId, currentUserId, OrganizationRole.MEMBER);
  // Promote target to owner
  return changeMembershipRole(organizationId, newOwnerUserId, OrganizationRole.OWNER);
};
```

### Step 4: Add to controller

```typescript
// organization.controller.ts
export const transferOwnershipController = async (req: Request, res: Response) => {
  const organizationId = String(req.params.id);
  const currentUserId = req.session.user.id;
  const { newOwnerUserId } = req.body;
  const data = await transferOwnershipService(organizationId, currentUserId, newOwnerUserId);
  res.json({ success: true, data });
};
```

### Step 5: Add to route

```typescript
// organization.route.ts — add a new endpoint:
import { transferOwnershipSchema } from "./organization.validation";

organizationRoute.patch(
  "/:id/transfer-ownership",
  authMiddleware,
  validate(transferOwnershipSchema),
  asyncHandler(transferOwnershipController),
);
```

### Step 6: Verify

1. Type-check: `npm run type-check`
2. Dev server: `npm run dev` — hit the endpoint with session cookie
3. Ensure: 401 when no auth, 403 when not owner, 400 when body invalid, 200 with new membership when valid.

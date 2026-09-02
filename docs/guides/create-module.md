# Create a New Module

This guide walks through creating a new feature module following the Delok architectural conventions. We'll use a hypothetical `team` module as an example (CRUD for teams inside an organization).

## Step 1: Folder Structure

Create a new folder under `src/modules/<domain>/`. Mature modules contain up to 6 files.

```
src/
└── modules/
    └── team/
        ├── team.route.ts               # Express Router + endpoints
        ├── team.controller.ts          # Thin controllers: extract params → call service
        ├── team.service.ts             # Business logic, authz orchestration
        ├── team.repository.ts          # Prisma queries only
        ├── team.validation.ts          # Zod schemas + inferred types
        └── team.authorization.ts       # ensureTeamMember, ensureTeamAdmin (if needed)
```

If the module has routes mounted at **multiple prefixes**, use a `routes/` subfolder:
```
src/modules/team/routes/organization-team.route.ts   # /api/organizations/:orgId/teams
src/modules/team/routes/team.route.ts                 # /api/team/:id
```
Follow the pattern set by [project/routes/](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/project/routes) and [api-key/routes/](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/api-key/routes).

## Step 2: Validation (`team.validation.ts`)

Always start with validation because it has no module-internal dependencies — you can write it in isolation.

```typescript
import { z } from "zod";

export const teamSchema = z.object({
  name: z.string().trim().min(3).max(100),
});

export type TeamType = z.infer<typeof teamSchema>;
```

Patterns to follow:
- All schemas exported as `const` (not `default export`)
- Export the `z.infer` type with a meaningful name for reuse in services/repos
- Use `.trim()` on free-text strings, then min/max
- Use `z.coerce.number()` / `z.coerce.date()` for query params if accepting them from URLs

## Step 3: Repository (`team.repository.ts`)

Next, the repository — it only depends on Prisma, no other module files.

```typescript
import { prisma } from "../../lib/prisma";

export const createTeam = async (name: string, organizationId: string) => {
  return prisma.team.create({
    data: { name, organizationId },
  });
};

export const findAllTeams = async (organizationId: string) => {
  return prisma.team.findMany({
    where: { organizationId },
  });
};

export const findTeamById = async (id: string) => {
  return prisma.team.findUnique({ where: { id } });
};

// Authz-aware query variant: used by ensureTeamMember helper
export const findTeamByIdForMember = async (id: string, userId: string) => {
  return prisma.team.findFirst({
    where: {
      id,
      organization: {
        organizationMembers: { some: { userId } },
      },
    },
  });
};

export const updateTeam = async (id: string, name: string) => {
  return prisma.team.update({ where: { id }, data: { name } });
};

export const deleteTeam = async (id: string) => {
  return prisma.team.delete({ where: { id } });
};
```

Rules (from [dependency-rules.md](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/docs/architecture/dependency-rules.md)):
- ✅ Import only from `lib/prisma.ts` + generated Prisma types
- ❌ Do NOT throw `AppError` here (caller decides error semantics)
- ❌ Do NOT import from services, controllers, authz, or other modules

## Step 4: Authorization (`team.authorization.ts`)

If this resource is accessed only by some users (most are), write `ensure*()` helpers. They live here, not in middleware.

```typescript
import { AppError } from "../../utils/AppError";
import { delok } from "../../lib/delok";
import { findTeamByIdForMember, findTeamById } from "./team.repository";
import { ensureOrganizationOwner } from "../organization/organization.authorization";

// Read-only access: any org member
export const ensureTeamMember = async (teamId: string, userId: string) => {
  const team = await findTeamByIdForMember(teamId, userId);
  if (!team) {
    delok.warn({
      event: "team.access_denied",
      payload: { userId, teamId },
    });
    throw new AppError("Forbidden", 403);
  }
  return team;
};

// Management access: org owner only
export const ensureTeamManagementAccess = async (teamId: string, userId: string) => {
  const team = await findTeamById(teamId);
  if (!team) throw new AppError("Team not found", 404);
  await ensureOrganizationOwner(team.organizationId, userId); // cross-module authz
  return team;
};
```

Patterns:
- Name pattern: `ensure<Noun><Role>`
- On success, return the entity (so the caller doesn't need to re-query)
- On failure, throw `AppError("Forbidden", 403)` (not 404 — we don't leak existence info)
- Cross-module authz is fine: importing from `../organization/organization.authorization` is the one accepted cross-module import pattern

## Step 5: Service (`team.service.ts`)

This is where business rules live. Service functions accept plain strings/Dates — never `Request` or `Response` objects.

```typescript
import { AppError } from "../../utils/AppError";
import {
  createTeam, deleteTeam, findAllTeams, updateTeam,
} from "./team.repository";
import { ensureTeamManagementAccess, ensureTeamMember } from "./team.authorization";
import { ensureOrganizationMember } from "../organization/organization.authorization";

export const createTeamService = async (
  name: string,
  userId: string,
  organizationId: string,
) => {
  if (name.length < 3) throw new AppError("name too short", 400); // redundant with Zod but defensive
  await ensureOrganizationMember(organizationId, userId); // or Owner, depending on your rules
  return createTeam(name, organizationId);
};

export const getAllTeamsService = async (organizationId: string, userId: string) => {
  await ensureOrganizationMember(organizationId, userId);
  return findAllTeams(organizationId);
};

export const getTeamByIdService = async (id: string, userId: string) => {
  return ensureTeamMember(id, userId);
};

export const updateTeamService = async (id: string, userId: string, name: string) => {
  await ensureTeamManagementAccess(id, userId);
  return updateTeam(id, name);
};

export const deleteTeamService = async (id: string, userId: string) => {
  await ensureTeamManagementAccess(id, userId);
  return deleteTeam(id);
};
```

Patterns:
- Service functions named `<verb><Noun>Service`
- Check authz first, then mutate
- If a repository function returns null, the service decides whether that means 404 or 403
- Emit `delok.info(...)` / `delok.warn(...)` events here for audit trails

## Step 6: Controller (`team.controller.ts`)

Controllers are **thin**. They:
1. Extract params from `req.params`, `req.query`, `req.body`, `req.session.user.id`
2. Call exactly **one** service function (generally)
3. Return `201` for create, `200` for everything else
4. Format JSON: `{ success: true, data: result }`

```typescript
import { Request, Response } from "express";
import {
  createTeamService, deleteTeamService, getAllTeamsService,
  getTeamByIdService, updateTeamService,
} from "./team.service";

export const createTeamController = async (req: Request, res: Response) => {
  const userId = req.session.user.id;
  const organizationId = String(req.params.organizationId);
  const { name } = req.body;
  const data = await createTeamService(name, userId, organizationId);
  res.status(201).json({ success: true, data });
};

export const getAllTeamsController = async (req: Request, res: Response) => {
  const organizationId = String(req.params.organizationId);
  const userId = req.session.user.id;
  const data = await getAllTeamsService(organizationId, userId);
  res.json({ success: true, data });
};

export const getTeamByIdController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;
  const data = await getTeamByIdService(id, userId);
  res.json({ success: true, data });
};

export const updateTeamController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;
  const { name } = req.body;
  const data = await updateTeamService(id, userId, name);
  res.json({ success: true, data });
};

export const deleteTeamController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;
  const data = await deleteTeamService(id, userId);
  res.json({ success: true, data });
};
```

Rules:
- No `try/catch` — `asyncHandler` does that
- No business logic here
- Cast path params with `String()` (since they're strings from Express anyway); for numeric IDs use `parseInt` + validation

## Step 7: Routes (`team.route.ts`)

Wire middleware + controllers. Use the order: `authMiddleware → validate (if body) → asyncHandler(controller)`.

```typescript
import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  createTeamController, deleteTeamController, getAllTeamsController,
  getTeamByIdController, updateTeamController,
} from "./team.controller";
import { teamSchema } from "./team.validation";

// If you need :organizationId from the parent mount (e.g. /organizations/:orgId/teams),
// use mergeParams: true
export const organizationTeamRoute = express.Router({ mergeParams: true });
export const teamRoute = express.Router({ mergeParams: true });

// Mounted at: GET /api/organizations/:organizationId/teams
organizationTeamRoute.get(
  "/",
  authMiddleware,
  asyncHandler(getAllTeamsController),
);
// POST /api/organizations/:organizationId/teams
organizationTeamRoute.post(
  "/",
  authMiddleware,
  validate(teamSchema),
  asyncHandler(createTeamController),
);

// Mounted at: GET /api/team/:id
teamRoute.get("/:id", authMiddleware, asyncHandler(getTeamByIdController));
teamRoute.patch(
  "/:id",
  authMiddleware,
  validate(teamSchema),
  asyncHandler(updateTeamController),
);
teamRoute.delete("/:id", authMiddleware, asyncHandler(deleteTeamController));
```

## Step 8: Mount Routes in `app.ts`

Edit [src/app.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/app.ts#L48-L68) to add your new routers:

```typescript
import { organizationTeamRoute, teamRoute } from "./modules/team/team.route";

// ...
app.use("/api/organizations/:organizationId/teams", organizationTeamRoute);
app.use("/api/team", teamRoute);
```

Keep them grouped with related modules (team next to organization / project routes).

## Step 9: Prisma Schema (If Your Module Needs a New Model)

1. Pick the right domain file in `prisma/schema/` — for a team model, edit `organization.prisma` (since teams are org-scoped) or create a new `team.prisma` file.
2. Write the Prisma model.
3. Run `npm run db:migrate:dev` (= `npx prisma migrate dev`) to generate + apply migration.
4. Run `npm run db:generate` (= `npx prisma generate`) to update generated types (the migrate dev command usually does this automatically, but do it explicitly if types are stale).
5. Run `npm run type-check` to catch any type errors.

## Check Your Work Against Existing Conventions

| Check | Example location to compare |
|-------|-----------------------------|
| All 6 layers present? | Compare with [organization/](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization) module |
| Services don't import Express types? | Compare with [organization.service.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.service.ts) |
| Repos only import Prisma? | Compare with [organization.repository.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.repository.ts) |
| Authz helpers throw AppError(403)? | Compare with [organization.authorization.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.authorization.ts) |
| Route order: auth → validate → asyncHandler? | Compare with [organization.route.ts](file:///c:/Users/Yuan/OneDrive/Desktop/Codes/Delok/delok-backend/src/modules/organization/organization.route.ts) |

// /src/modules/project/project.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../utils/async-handler";
import {
  deleteProjectController,
  getProjectByIdController,
  updateProjectController,
} from "../project.controller";
import { validate } from "../../../middlewares/validate.middleware";
import { projectSchema } from "../project.validaton";

export const projectRoute = express.Router({
  mergeParams: true,
});

/**
 * GET /api/project/:id
 *
 * Get detailed project information.
 *
 * User must be a member of the project organization.
 */
projectRoute.get(
  "/:id",
  authMiddleware,
  asyncHandler(getProjectByIdController),
);

/**
 * PATCH /api/project/:id
 *
 * Update project by id
 */
projectRoute.patch(
  "/:id",
  authMiddleware,
  validate(projectSchema),
  asyncHandler(updateProjectController),
);

/**
 * DELETE /api/project/:id
 *
 * DELETE project by id
 *
 * User must be a member of the project organization.
 */
projectRoute.delete(
  "/:id",
  authMiddleware,
  asyncHandler(deleteProjectController),
);

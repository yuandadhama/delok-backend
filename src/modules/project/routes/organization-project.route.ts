// /src/modules/project/route/organization-project.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../utils/async-handler";
import {
  createProjectController,
  getAllProjectsController,
} from "../project.controller";
import { validate } from "../../../middlewares/validate.middleware";
import { projectSchema } from "../project.validaton";

export const organizationProjectRoute = express.Router({ mergeParams: true });

/**
 * GET /api/organization/:organizationId/projects
 * Get all projects inside an organization.
 *
 * User must be a member of the organization.
 */
organizationProjectRoute.get(
  "/",
  authMiddleware,
  asyncHandler(getAllProjectsController),
);

/**
 * POST /api/project
 * Create a new project.
 *
 * User must be a member of the organization.
 */
organizationProjectRoute.post(
  "/",
  authMiddleware,
  validate(projectSchema),
  asyncHandler(createProjectController),
);

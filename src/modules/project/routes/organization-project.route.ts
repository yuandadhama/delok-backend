// /src/modules/project/route/organization-project.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import {
  createProjectController,
  deleteProjectController,
  getAllProjectsController,
  getProjectByIdController,
  updateProjectController,
} from "../project.controller.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import { projectSchema } from "../project.validation.js";

export const organizationProjectRoute = express.Router({ mergeParams: true });

/**
 * GET /api/organizations/:organizationSlug/projects
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
 * POST /api/organizations/:organizationSlug/projects
 * Create a new project.
 *
 * User must be an owner of the organization.
 */
organizationProjectRoute.post(
  "/",
  authMiddleware,
  validate(projectSchema),
  asyncHandler(createProjectController),
);

/**
 * GET /api/organizations/:organizationSlug/projects/:projectId
 * Get a single project inside an organization.
 *
 * User must be a member of the organization, and the project must belong to
 * that organization.
 */
organizationProjectRoute.get(
  "/:projectId",
  authMiddleware,
  asyncHandler(getProjectByIdController),
);

/**
 * PATCH /api/organizations/:organizationSlug/projects/:projectId
 * Update a project.
 *
 * User must be an owner of the organization, and the project must belong to
 * that organization.
 */
organizationProjectRoute.patch(
  "/:projectId",
  authMiddleware,
  validate(projectSchema),
  asyncHandler(updateProjectController),
);

/**
 * DELETE /api/organizations/:organizationSlug/projects/:projectId
 * Delete a project.
 *
 * User must be an owner of the organization, and the project must belong to
 * that organization.
 */
organizationProjectRoute.delete(
  "/:projectId",
  authMiddleware,
  asyncHandler(deleteProjectController),
);

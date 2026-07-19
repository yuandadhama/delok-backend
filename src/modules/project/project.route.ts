// /src/modules/project/project.route.ts

import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  createProjectController,
  deleteProjectController,
  getAllProjectsController,
  getProjectByIdController,
  updateProjectController,
} from "./project.controller";

export const projectRoute = express.Router();

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

/**
 * PATCH /api/project/:id
 *
 * Update project by id
 */
projectRoute.patch(
  "/:id",
  authMiddleware,
  asyncHandler(updateProjectController),
);

/**
 * GET /api/project/organization/:organizationId
 * Get all projects inside an organization.
 *
 * User must be a member of the organization.
 */
projectRoute.get(
  "/organization/:organizationId",
  authMiddleware,
  asyncHandler(getAllProjectsController),
);

/**
 * POST /api/project
 * Create a new project.
 *
 * User must be a member of the organization.
 */
projectRoute.post("/", authMiddleware, asyncHandler(createProjectController));

import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  createProjectController,
  getAllProjectsController,
} from "./project.controller";

export const projectRoute = express.Router();

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

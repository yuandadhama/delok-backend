import expresss from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  createProjectController,
  getAllProjectsController,
} from "./project.controller";

export const projectRoute = expresss.Router();

projectRoute.post("/", authMiddleware, asyncHandler(createProjectController));

/**
 * GET /api/projects
 * Get all organizations
 */
projectRoute.get(
  "/:organizationId",
  authMiddleware,
  asyncHandler(getAllProjectsController),
);

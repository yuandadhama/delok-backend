// /src/modules/log-event/route/log-event.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { getLogsByProjectIdController } from "../log-event.controller.js";

export const projectLogEventRoute = express.Router({
  mergeParams: true,
});

/**
 * GET /api/projects/:projectId/logs
 *
 * Get all logs for a project.
 *
 * User must be a member of the project organization.
 */
projectLogEventRoute.get(
  "/",
  authMiddleware,
  asyncHandler(getLogsByProjectIdController),
);

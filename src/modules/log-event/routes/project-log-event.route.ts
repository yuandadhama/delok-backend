// /src/modules/log-event/route/log-event.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../utils/async-handler";
import { getLogsByProjectIdController } from "../log-event.controller";

export const projectLogEvent = express.Router({
  mergeParams: true,
});

/**
 * GET /api/projects/:projectId/logs
 *
 * Get all logs for a project.
 *
 * User must be a member of the project organization.
 */
projectLogEvent.get(
  "/",
  authMiddleware,
  asyncHandler(getLogsByProjectIdController),
);

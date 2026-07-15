// /src/modules/log-event/log-event.route.ts

import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { getLogsByProjectIdController } from "./log-event.controller";

export const logEventRoute = express.Router();

/**
 * GET /api/logs/project/:projectId
 *
 * Get all logs for a project.
 *
 * User must be a member of the project organization.
 */
logEventRoute.get(
  "/project/:projectId",
  authMiddleware,
  asyncHandler(getLogsByProjectIdController),
);

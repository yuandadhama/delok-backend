// /src/modules/api-key/routes/project-api-key.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../utils/async-handler";
import {
  createApiKeyController,
  getApiKeysByProjectIdController,
} from "../api-key.controller";
import { validate } from "../../../middlewares/validate.middleware";
import { ApiKeySchema } from "../api-key.validation";

export const projectApiKeyRoute = express.Router({
  mergeParams: true,
});

projectApiKeyRoute.post(
  "/",
  authMiddleware,
  validate(ApiKeySchema),
  asyncHandler(createApiKeyController),
);

/**
 * GET /api/projects/:projectId/api-keys
 *
 * Get all API keys belonging to a project.
 *
 * User must have project management access.
 */
projectApiKeyRoute.get(
  "/",
  authMiddleware,
  asyncHandler(getApiKeysByProjectIdController),
);

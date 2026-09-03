// /src/modules/api-key/routes/project-api-key.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import {
  createApiKeyController,
  getApiKeysByProjectIdController,
} from "../api-key.controller.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import { ApiKeySchema } from "../api-key.validation.js";

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

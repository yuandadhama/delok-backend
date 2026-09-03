// /src/modules/api-key/routes/api-key.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import {
  revokeApiKeyController,
  updateApiKeyNameController,
} from "../api-key.controller.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import { ApiKeySchema } from "../api-key.validation.js";

export const apiKeyRoute = express.Router({
  mergeParams: true,
});

apiKeyRoute.patch(
  "/:id",
  authMiddleware,
  validate(ApiKeySchema),
  asyncHandler(updateApiKeyNameController),
);

/**
 * PATCH /api/api-key/:id/revoke
 *
 * Revoke an API key.
 *
 * User must have project management access.
 */
apiKeyRoute.patch(
  "/:id/revoke",
  authMiddleware,
  asyncHandler(revokeApiKeyController),
);

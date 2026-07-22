// /src/modules/api-key/routes/api-key.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../utils/async-handler";
import {
  revokeApiKeyController,
  updateApiKeyNameController,
} from "../api-key.controller";
import { validate } from "../../../middlewares/validate.middleware";
import { ApiKeySchema } from "../api-key.validation";

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

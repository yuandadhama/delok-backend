// /src/modules/api-key/routes/api-key.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../utils/async-handler";
import { revokeApiKeyController } from "../api-key.controller";

export const apiKeyRoute = express.Router({
  mergeParams: true,
});

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

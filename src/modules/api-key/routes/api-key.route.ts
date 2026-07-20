// /src/modules/api-key/routes/api-key.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../utils/async-handler";
import { revokeApiKeyController } from "../api-key.controller";

export const apiKeyRoute = express.Router({
  mergeParams: true,
});

apiKeyRoute.patch(
  "/:id/revoke",
  authMiddleware,
  asyncHandler(revokeApiKeyController),
);

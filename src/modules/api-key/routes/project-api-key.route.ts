// /src/modules/api-key/routes/project-api-key.route.ts

import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../utils/async-handler";
import { revokeApiKeyController } from "../api-key.controller";

export const projectApiKeyRoute = express.Router({
  mergeParams: true,
});

projectApiKeyRoute.get(
  "/",
  authMiddleware,
  asyncHandler(revokeApiKeyController),
);

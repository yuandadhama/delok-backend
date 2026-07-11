// /src/modules/organization/organization.route.ts

import express from "express";
import { asyncHandler } from "../../utils/async-handler";
import { createOrganizationController } from "./organization.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const organizationRoute = express.Router();

organizationRoute.post(
  "/create",
  authMiddleware,
  asyncHandler(createOrganizationController),
);

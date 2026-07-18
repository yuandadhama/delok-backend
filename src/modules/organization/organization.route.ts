// /src/modules/organization/organization.route.ts

import express from "express";

import { asyncHandler } from "../../utils/async-handler";
import { authMiddleware } from "../../middlewares/auth.middleware";

import {
  createOrganizationController,
  deleteOrganizationController,
  getAllOrganizationController,
  getOrganizationByIdController,
  updateOrganizationController,
} from "./organization.controller";
import { validate } from "../../middlewares/validate.middleware";
import { organizationSchema } from "./organization.validation";

export const organizationRoute = express.Router();

/**
 * GET /api/organization
 * Get all organizations
 */
organizationRoute.get(
  "/",
  authMiddleware,
  asyncHandler(getAllOrganizationController),
);

/**
 * POST /api/organization
 * Create organization
 */
organizationRoute.post(
  "/",
  authMiddleware,
  validate(organizationSchema),
  asyncHandler(createOrganizationController),
);

/**
 * GET /api/organization/:id
 * Get organization by id
 */
organizationRoute.get(
  "/:id",
  authMiddleware,
  asyncHandler(getOrganizationByIdController),
);

/**
 * PATCH /api/organization/:id
 * update organization by id
 */
organizationRoute.patch(
  "/:id",
  authMiddleware,
  validate(organizationSchema),
  asyncHandler(updateOrganizationController),
);

/**
 * DELETE /api/organization/:id
 * delete organization by id
 */
organizationRoute.delete(
  "/:id",
  authMiddleware,
  asyncHandler(deleteOrganizationController),
);

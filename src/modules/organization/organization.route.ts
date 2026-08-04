// /src/modules/organization/organization.route.ts

import express from "express";

import { asyncHandler } from "../../utils/async-handler";
import { authMiddleware } from "../../middlewares/auth.middleware";

import {
  createOrganizationController,
  deleteOrganizationController,
  getAllOrganizationController,
  getOrganizationBySlugController,
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
 * GET /api/organization/:slug
 * Get organization by slug
 */
organizationRoute.get(
  "/:slug",
  authMiddleware,
  asyncHandler(getOrganizationBySlugController),
);

/**
 * PATCH /api/organization/:slug
 * update organization by slug
 */
organizationRoute.patch(
  "/:slug",
  authMiddleware,
  validate(organizationSchema),
  asyncHandler(updateOrganizationController),
);

/**
 * DELETE /api/organization/:slug
 * delete organization by slug
 */
organizationRoute.delete(
  "/:slug",
  authMiddleware,
  asyncHandler(deleteOrganizationController),
);

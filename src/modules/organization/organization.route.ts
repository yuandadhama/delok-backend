// /src/modules/organization/organization.route.ts

import express from "express";

import { asyncHandler } from "../../utils/async-handler";
import { authMiddleware } from "../../middlewares/auth.middleware";

import {
  createOrganizationController,
  deleteOrganizationController,
  getAllOrganizationController,
  getOrganizationByIdController,
} from "./organization.controller";

export const organizationRoute = express.Router();

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
 * DELETE /api/organization/:id
 * delete organization by id
 */
organizationRoute.delete(
  "/:id",
  authMiddleware,
  asyncHandler(deleteOrganizationController),
);

/**
 * POST /api/organization
 * Create organization
 */
organizationRoute.post(
  "/",
  authMiddleware,
  asyncHandler(createOrganizationController),
);

/**
 * GET /api/organization
 * Get all organizations
 */
organizationRoute.get(
  "/",
  authMiddleware,
  asyncHandler(getAllOrganizationController),
);

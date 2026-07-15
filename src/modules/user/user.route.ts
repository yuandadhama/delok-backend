// /src/modules/user/user.route.ts

import express from "express";
import {
  createUserController,
  deleteUserController,
  getAllUserController,
  getUserByIdController,
  meController,
  searchUserByNameController,
  updateUserController,
} from "./user.controller";

import { createUserSchema, updateUserSchema } from "./user.validation";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const userRoute = express.Router();

// validate() to add validation middleware
// asyncHandler() to handle try/catch in every route controller

/**
 * GET /api/user/me
 * Get current user session
 */
userRoute.get("/me", authMiddleware, asyncHandler(meController));

/**
 * GET /api/user/search?name=<keyword>
 * Search users by name
 */
userRoute.get("/search", asyncHandler(searchUserByNameController));

/**
 * GET /api/user/:id
 * Get single user
 */
userRoute.get("/:id", asyncHandler(getUserByIdController));

/**
 * PUT /api/user/:id
 * Update existing user
 */
userRoute.put(
  "/:id",
  validate(updateUserSchema),
  asyncHandler(updateUserController),
);

/**
 * DELETE /api/user/:id
 * Delete user
 */
userRoute.delete("/:id", asyncHandler(deleteUserController));

/**
 * GET /api/user
 * Get all users
 */
userRoute.get("/", asyncHandler(getAllUserController));

/**
 * POST /api/user
 * Create new user
 */
userRoute.post(
  "/",
  validate(createUserSchema),
  asyncHandler(createUserController),
);

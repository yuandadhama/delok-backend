import express from "express";
import {
  createUserController,
  deleteUserController,
  getAllUserController,
  getUserByIdController,
  searchUserByNameController,
  updateUserController,
} from "./user.controller";
import { asyncHandler } from "../utils/async-handler";

export const userRoute = express.Router();

/**
 * Route level logger
 */
userRoute.use((req, res, next) => {
  console.info(`[${req.method}] ${req.originalUrl}`);
  next();
});

// async handler to handle try/catch in every route controller

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
userRoute.put("/:id", asyncHandler(updateUserController));

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
userRoute.post("/", asyncHandler(createUserController));

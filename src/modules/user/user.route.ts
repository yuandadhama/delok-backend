// /src/modules/user/user.route.ts

import express from "express";
import { meController } from "./user.controller";

import { asyncHandler } from "../../utils/async-handler";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const userRoute = express.Router();

// validate() to add validation middleware
// asyncHandler() to handle try/catch in every route controller

/**
 * GET /api/user/me
 * Get current user session
 * this route is specially to check if the user is logged in and get the current user session
 */
userRoute.get("/me", authMiddleware, asyncHandler(meController));

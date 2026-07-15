import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { getLogsByProjectIdController } from "./log-event.controller";

export const logEventRoute = express.Router();

logEventRoute.get(
  "/project/:projectId",
  authMiddleware,
  asyncHandler(getLogsByProjectIdController),
);

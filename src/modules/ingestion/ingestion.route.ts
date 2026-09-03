// /src/modules/ingestion/ingestion.route.ts

import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { createLogEventController } from "./ingestion.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createLogEventSchema } from "./ingestion.validation.js";
import { ingestionRateLimiter } from "../../middlewares/rate-limit/ingestion-rate-limit.middleware.js";

export const ingestionRoute = express.Router();

/**
 * POST /api/ingestion
 *
 * Receive log events from SDK.
 *
 * Authentication:
 * x-api-key header
 */
ingestionRoute.post(
  "/",
  ingestionRateLimiter,
  validate(createLogEventSchema),
  asyncHandler(createLogEventController),
);

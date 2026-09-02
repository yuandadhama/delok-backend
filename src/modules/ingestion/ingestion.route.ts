// /src/modules/ingestion/ingestion.route.ts

import express from "express";
import { asyncHandler } from "../../utils/async-handler";
import { createLogEventController } from "./ingestion.controller";
import { validate } from "../../middlewares/validate.middleware";
import { createLogEventSchema } from "./ingestion.validation";
import { ingestionRateLimiter } from "../../middlewares/rate-limit/ingestion-rate-limit.middleware";

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

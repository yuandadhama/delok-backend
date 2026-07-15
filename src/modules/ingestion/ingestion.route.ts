import express from "express";
import { asyncHandler } from "../../utils/async-handler";
import { createLogEventController } from "./ingestion.controller";
import { validate } from "../../middlewares/validate.middleware";
import { createLogEventSchema } from "./ingestion.validation";

export const ingestionRoute = express.Router();

ingestionRoute.post(
  "/",
  validate(createLogEventSchema),
  asyncHandler(createLogEventController),
);

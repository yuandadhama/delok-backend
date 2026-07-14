import express from "express";
import { asyncHandler } from "../../utils/async-handler";
import { createLogEventController } from "./ingestion.controller";

export const ingestionRoute = express.Router();

ingestionRoute.post("/", asyncHandler(createLogEventController));

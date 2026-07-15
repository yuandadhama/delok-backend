import express from "express";
import { asyncHandler } from "../../utils/async-handler";
import {
  createLogEventController,
  getAllLogEventsByProjectIdController,
} from "./ingestion.controller";

export const ingestionRoute = express.Router();

ingestionRoute.post("/", asyncHandler(createLogEventController));
ingestionRoute.get("/", getAllLogEventsByProjectIdController);

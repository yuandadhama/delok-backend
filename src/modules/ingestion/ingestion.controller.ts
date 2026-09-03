// /src/modules/ingestion/ingestion.controller.ts

import { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { createLogEventService } from "./ingestion.service.js";

/**
 * POST /api/ingestion
 *
 * Create a new log event from SDK request.
 */
export const createLogEventController = async (req: Request, res: Response) => {
  const apiKey = req.get("x-api-key");

  if (!apiKey) {
    throw new AppError("API key required", 401);
  }

  const { environment, level, event, occurredAt, message, payload } = req.body;
  const data = await createLogEventService(
    apiKey,
    environment,
    level,
    event,
    occurredAt,
    message,
    payload,
  );
  res.status(201).json({
    success: true,
    data,
  });
};

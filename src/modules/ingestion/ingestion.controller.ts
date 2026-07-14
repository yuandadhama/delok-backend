import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { createLogEventService } from "./ingestion.service";

export const createLogEventController = async (req: Request, res: Response) => {
  const apiKey = req.get("x-api-key");

  if (!apiKey) {
    throw new AppError("API key required", 401);
  }

  const { environment, level, event, occurredAt, payload } = req.body;
  const data = await createLogEventService(
    apiKey,
    environment,
    level,
    event,
    occurredAt,
    payload,
  );
  res.json({
    success: true,
    data,
  });
};

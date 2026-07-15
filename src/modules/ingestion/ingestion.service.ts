import { JsonObject } from "@prisma/client/runtime/client";
import { AppError } from "../../utils/AppError";
import { createLogEvent, findApiKey } from "./ingestion.repository";

export const createLogEventService = async (
  key: string,
  environment: string,
  level: string,
  event: string,
  occurredAt: Date,
  message?: string,
  payload?: JsonObject,
) => {
  const apiKey = await findApiKey(key);

  if (!apiKey) {
    throw new AppError("Invalid API key", 401);
  }
  const projectId = apiKey.projectId;

  return await createLogEvent(
    projectId,
    environment,
    level,
    event,
    occurredAt,
    message,
    payload,
  );
};

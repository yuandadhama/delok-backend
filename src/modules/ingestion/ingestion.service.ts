// /src/modules/ingestion/ingestion.service.ts

import { JsonObject } from "@prisma/client/runtime/client";
import { AppError } from "../../utils/AppError";
import { createLogEvent, findApiKeyByKey } from "./ingestion.repository";

/**
 * Create new log event.
 *
 * Authentication:
 * API key must belong to an existing project.
 */
export const createLogEventService = async (
  key: string,
  environment: string,
  level: string,
  event: string,
  occurredAt: Date,
  message?: string,
  payload?: JsonObject,
) => {
  const apiKey = await findApiKeyByKey(key);

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

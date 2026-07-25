// /src/modules/ingestion/ingestion.service.ts

import { JsonObject } from "@prisma/client/runtime/client";
import { AppError } from "../../utils/AppError";
import {
  createLogEvent,
  findApiKeyByKeyHash,
  updateApiKeyLastUsedAt,
} from "./ingestion.repository";
import { sha256 } from "../../utils/hash";

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
  const keyHash = sha256(key);

  const apiKey = await findApiKeyByKeyHash(keyHash);

  if (!apiKey) {
    throw new AppError("Invalid API key", 401, "INVALID_API_KEY");
  }

  if (apiKey.revokedAt) {
    throw new AppError("API Key already revoked", 401);
  }

  if (
    !apiKey.lastUsedAt ||
    Date.now() - apiKey.lastUsedAt.getTime() > 5 * 60 * 1000
  ) {
    await updateApiKeyLastUsedAt(apiKey.id);
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

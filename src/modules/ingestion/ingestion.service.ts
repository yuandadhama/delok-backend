import { JsonObject } from "@prisma/client/runtime/client";
import { AppError } from "../../utils/AppError";
import {
  createLogEvent,
  findApiKeybyKey,
  findLogEventsByProjectId,
} from "./ingestion.repository";

export const createLogEventService = async (
  key: string,
  environment: string,
  level: string,
  event: string,
  occuredAt: Date,
  payload?: JsonObject,
) => {
  const apiKey = await findApiKeybyKey(key);

  if (!apiKey) {
    throw new AppError("api key is invalid", 404);
  }
  const projectId = apiKey.projectId;

  return await createLogEvent(
    projectId,
    environment,
    level,
    event,
    occuredAt,
    payload,
  );
};

export const getAllLogEventsByProjectIdService = async (key: string) => {
  const apiKey = await findApiKeybyKey(key);

  if (!apiKey) {
    throw new AppError("api key is invalid", 404);
  }
  const projectId = apiKey.projectId;

  return await findLogEventsByProjectId(projectId);
};

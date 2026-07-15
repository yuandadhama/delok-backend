// /src/modules/ingestion/ingestion.repository.ts

import { JsonObject } from "@prisma/client/runtime/client";
import { prisma } from "../../lib/prisma";

/**
 * Create log event record.
 */
export const createLogEvent = async (
  projectId: string,
  environment: string,
  level: string,
  event: string,
  occurredAt: Date,
  message?: string,
  payload?: JsonObject,
) => {
  return prisma.logEvent.create({
    data: {
      projectId,
      environment,
      level,
      event,
      occurredAt,
      message,
      payload,
    },
  });
};

/**
 * Find API key by key value.
 */
export const findApiKeyByKey = async (key: string) => {
  return prisma.apiKey.findFirst({
    where: {
      key,
    },
  });
};

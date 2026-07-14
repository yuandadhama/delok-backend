import { JsonObject } from "@prisma/client/runtime/client";
import { prisma } from "../../lib/prisma";

export const createLogEvent = async (
  projectId: string,
  environment: string,
  level: string,
  event: string,
  occurredAt: Date,
  payload?: JsonObject,
) => {
  return prisma.logEvent.create({
    data: {
      projectId,
      environment,
      level,
      event,
      occurredAt,
      payload,
    },
  });
};

export const findApiKeybyKey = async (key: string) => {
  return prisma.apiKey.findFirst({
    where: {
      key,
    },
  });
};

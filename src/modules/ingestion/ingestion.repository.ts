import { JsonObject } from "@prisma/client/runtime/client";
import { prisma } from "../../lib/prisma";

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

export const findApiKey = async (key: string) => {
  return prisma.apiKey.findFirst({
    where: {
      key,
    },
  });
};

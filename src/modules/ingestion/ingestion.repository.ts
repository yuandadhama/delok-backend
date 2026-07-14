import { InputJsonObject } from "@prisma/client/runtime/client";
import { prisma } from "../../lib/prisma";

export const createLogEvent = async (
  projectId: string,
  environment: string,
  level: string,
  event: string,
  payload?: InputJsonObject,
) => {
  return await prisma.logEvent.create({
    data: {
      projectId,
      environment,
      level,
      event,
      payload,
    },
  });
};

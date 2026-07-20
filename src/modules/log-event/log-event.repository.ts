// /src/modules/log-event/log-event.repository.ts

import { prisma } from "../../lib/prisma";

/**
 * Find all log events belonging to a project.
 */
export const findLogsByProjectId = async (
  projectId: string,
  skip: number,
  take: number,
) => {
  return prisma.logEvent.findMany({
    where: {
      projectId,
    },
    orderBy: {
      occurredAt: "desc",
    },
    skip,
    take,
  });
};

export const countLogs = async (projectId: string) => {
  return prisma.logEvent.count({
    where: {
      projectId,
    },
  });
};

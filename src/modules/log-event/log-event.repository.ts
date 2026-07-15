// /src/modules/log-event/log-event.repository.ts

import { prisma } from "../../lib/prisma";

/**
 * Find all log events belonging to a project.
 */
export const findLogsByProjectId = async (projectId: string) => {
  return prisma.logEvent.findMany({
    where: {
      projectId,
    },
  });
};

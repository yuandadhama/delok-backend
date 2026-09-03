// /src/modules/log-event/log-event.repository.ts

import { prisma } from "../../lib/prisma.js";
import { buildLogFilter } from "./log-event.query.js";
import { LogFilter, LogQueryOptions } from "./log-event.type.js";

/**
 * Find all log events belonging to a project.
 */
export const findLogsByProjectId = async (
  projectId: string,
  options: LogQueryOptions,
) => {
  const { pagination, filter } = options;
  const { skip, limit: take } = pagination;

  return prisma.logEvent.findMany({
    where: {
      projectId,
      ...buildLogFilter(filter),
    },
    orderBy: {
      occurredAt: "desc",
    },
    skip,
    take,
  });
};

export const countLogs = async (projectId: string, filter: LogFilter) => {
  return prisma.logEvent.count({
    where: {
      projectId,
      ...buildLogFilter(filter),
    },
  });
};

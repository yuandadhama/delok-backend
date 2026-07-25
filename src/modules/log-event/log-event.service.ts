// /src/modules/log-event/log-event.service.ts

import { ensureProjectMember } from "../project/project.authorization";
import { countLogs, findLogsByProjectId } from "./log-event.repository";
import { LogEventQuery } from "./log-event.validation";

/**
 * Get paginated logs for a project.
 *
 * Authorization:
 * User must belong to the project organization.
 */
export const getLogsByProjectIdService = async (
  projectId: string,
  userId: string,
  query: LogEventQuery,
) => {
  await ensureProjectMember(projectId, userId);

  const { page, limit, ...filter } = query;

  const skip = (page - 1) * limit;

  const [total, logs] = await Promise.all([
    countLogs(projectId, filter),
    findLogsByProjectId(projectId, {
      pagination: {
        skip,
        limit,
      },
      filter,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
};

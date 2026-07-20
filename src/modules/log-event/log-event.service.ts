// /src/modules/log-event/log-event.service.ts

import { ensureProjectMember } from "../project/project.authorization";
import { countLogs, findLogsByProjectId } from "./log-event.repository";

/**
 * Get paginated logs for a project.
 *
 * Authorization:
 * User must belong to the project organization.
 */
export const getLogsByProjectIdService = async (
  projectId: string,
  userId: string,
  page: number,
  limit: number,
) => {
  await ensureProjectMember(projectId, userId);

  const skip = (page - 1) * limit;

  const [total, logs] = await Promise.all([
    countLogs(projectId),
    findLogsByProjectId(projectId, skip, limit),
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

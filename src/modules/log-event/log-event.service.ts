// /src/modules/log-event/log-event.service.ts

import { ensureProjectMember } from "../project/project.authorization";
import { findLogsByProjectId } from "./log-event.repository";

/**
 * Get all logs for a project.
 *
 * Authorization:
 * User must be organization member.
 */
export const getLogsByProjectIdService = async (
  projectId: string,
  userId: string,
) => {
  await ensureProjectMember(projectId, userId);

  return await findLogsByProjectId(projectId);
};

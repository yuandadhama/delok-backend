import { ensureProjectMember } from "../project/project.authorization";
import { findLogsByProjectId } from "./log-event.repository";

export const getLogsByProjectIdService = async (
  projectId: string,
  userId: string,
) => {
  await ensureProjectMember(projectId, userId);

  return await findLogsByProjectId(projectId);
};

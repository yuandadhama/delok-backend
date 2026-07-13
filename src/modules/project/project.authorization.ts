import { AppError } from "../../utils/AppError";
import { findProjectByIdForMember } from "./project.repository";

/**
 * Ensure current user can access project.
 *
 * Throws:
 * - 403 Forbidden
 *
 * Returns authorized project.
 */
export const ensureProjectMember = async (
  projectId: string,
  userId: string,
) => {
  const project = await findProjectByIdForMember(projectId, userId);

  if (!project) {
    throw new AppError("Forbidden", 403);
  }

  return project;
};

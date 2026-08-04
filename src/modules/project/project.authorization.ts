// /src/modules/project/project.authorization.ts

import { AppError } from "../../utils/AppError";
import { ensureOrganizationOwner } from "../organization/organization.authorization";
import {
  findProjectById,
  findProjectByIdForMember,
} from "./project.repository";

/**
 * Ensure current user can access project.
 *
 * Throws:
 * - 403 Forbidden
 *
 * Returns authorized project.
 */
export const ensureProjectMember = async (id: string, userId: string) => {
  const project = await findProjectByIdForMember(id, userId);

  if (!project) {
    throw new AppError("Forbidden", 403);
  }

  return project;
};

/**
 * Ensure project owner of the project organization
 *
 * Throws:
 * - 403 Forbidden
 *
 * Returns authorized project.
 */

export const ensureProjectManagementAccess = async (
  id: string,
  userId: string,
) => {
  const project = await findProjectById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await ensureOrganizationOwner(project.organization.slug, userId);

  return project;
};

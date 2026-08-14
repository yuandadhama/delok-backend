// /src/modules/project/project.authorization.ts

import { AppError } from "../../utils/AppError";
import { ensureOrganizationOwner } from "../organization/organization.authorization";
import {
  findProjectById,
  findProjectByIdAndOrganization,
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
 * Ensure the project exists AND belongs to the given organization.
 *
 * The organization boundary is encoded in the query itself, so a project that
 * belongs to a different organization is never returned. This prevents
 * cross-organization resource access even when the caller is a member or owner
 * of multiple organizations.
 *
 * Throws:
 * - 404 Project not found (non-leaking: does not reveal the real parent org)
 *
 * Returns the authorized project.
 */
export const ensureProjectInOrganization = async (
  projectId: string,
  organizationId: string,
) => {
  const project = await findProjectByIdAndOrganization(projectId, organizationId);

  if (!project) {
    throw new AppError("Project not found", 404);
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

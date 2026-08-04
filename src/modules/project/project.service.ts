// /src/modules/project/project.service.ts

import {
  ensureOrganizationMember,
  ensureOrganizationOwner,
} from "../organization/organization.authorization";
import {
  createProject,
  deleteProject,
  findAllProjects,
  updateProject,
} from "./project.repository";
import {
  ensureProjectManagementAccess,
  ensureProjectMember,
} from "./project.authorization";

/**
 * Create new project inside organization.
 *
 * User must be organization owner.
 */
export const createProjectService = async (
  name: string,
  userId: string,
  organizationSlug: string,
) => {
  const organization = await ensureOrganizationOwner(organizationSlug, userId);

  return await createProject(name, organization.organizationId);
};

/**
 * Get all projects inside organization.
 *
 * User must be organization member.
 */
export const getAllProjectsService = async (
  organizationSlug: string,
  userId: string,
) => {
  const organization = await ensureOrganizationMember(organizationSlug, userId);

  return await findAllProjects(organization.id);
};

/**
 * Get project detail.
 *
 * User must be a member of project organization.
 */
export const getProjectByIdService = async (id: string, userId: string) => {
  return ensureProjectMember(id, userId);
};

/**
 * Update project
 *
 * User must be owner of project organization.
 */
export const updateProjectService = async (
  id: string,
  userId: string,
  name: string,
) => {
  await ensureProjectManagementAccess(id, userId);

  return updateProject(id, name);
};

/**
 * Delete project.
 *
 * User must:
 * - belong to organization
 * - be organization owner
 */
export const deleteProjectService = async (id: string, userId: string) => {
  await ensureProjectManagementAccess(id, userId);

  return deleteProject(id);
};

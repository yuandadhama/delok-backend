// /src/modules/project/project.service.ts

import { randomBytes } from "crypto";
import { ensureOrganizationMember } from "../organization/organization.authorization";
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
 * User must be organization member.
 */
export const createProjectService = async (
  name: string,
  userId: string,
  organizationId: string,
) => {
  await ensureOrganizationMember(organizationId, userId);

  const apiKey = `dlok_${randomBytes(32).toString("hex")}`;

  return await createProject(name, organizationId, apiKey);
};

/**
 * Get all projects inside organization.
 *
 * User must be organization member.
 */
export const getAllProjectsService = async (
  organizationId: string,
  userId: string,
) => {
  await ensureOrganizationMember(organizationId, userId);
  return await findAllProjects(organizationId);
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

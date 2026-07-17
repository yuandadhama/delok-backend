// /src/modules/project/project.service.ts

import { randomBytes } from "crypto";
import {
  ensureOrganizationMember,
  ensureOrganizationOwner,
} from "../organization/organization.authorization";
import {
  createProject,
  deleteProject,
  findAllProjects,
} from "./project.repository";
import { AppError } from "../../utils/AppError";
import { ensureProjectMember } from "./project.authorization";

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
  if (name.length < 3) {
    throw new AppError("project name too short", 400);
  }
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
export const getProjectByIdService = async (
  projectId: string,
  userId: string,
) => {
  return ensureProjectMember(projectId, userId);
};

/**
 * Delete project.
 *
 * User must:
 * - belong to organization
 * - be organization owner
 */
export const deleteProjectService = async (
  projectId: string,
  userId: string,
) => {
  const project = await ensureProjectMember(projectId, userId);

  await ensureOrganizationOwner(project.organizationId, userId);

  return deleteProject(projectId);
};

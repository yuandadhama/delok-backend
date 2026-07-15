// /src/modules/project/project.service.ts

import { randomBytes } from "crypto";
import { ensureOrganizationMember } from "../organization/organization.authorization";
import { createProject, findAllProjects } from "./project.repository";
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
  userId: string,
  projectId: string,
) => {
  return ensureProjectMember(projectId, userId);
};

import { ensureOrganizationMember } from "../organization/organization.authorization";
import { createProject, findAllProjects } from "./project.repository";

export const createProjectService = async (
  name: string,
  userId: string,
  organizationId: string,
) => {
  await ensureOrganizationMember(organizationId, userId);

  const apiKey = crypto.randomUUID();

  return await createProject(name, organizationId, apiKey);
};

export const getAllProjectsService = async (
  organizationId: string,
  userId: string,
) => {
  await ensureOrganizationMember(organizationId, userId);
  return await findAllProjects(organizationId);
};

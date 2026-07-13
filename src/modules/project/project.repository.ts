import { prisma } from "../../lib/prisma";

/**
 * Create project and generate its first API key.
 */
export const createProject = async (
  name: string,
  organizationId: string,
  apiKey: string,
) => {
  return await prisma.project.create({
    data: {
      name,
      organizationId,
      apiKeys: {
        create: {
          key: apiKey,
        },
      },
    },
  });
};

/**
 * Find all projects by organization id.
 */
export const findAllProjects = async (organizationId: string) => {
  return await prisma.project.findMany({
    where: {
      organizationId,
    },
  });
};

/**
 * Find project by id.
 *
 * Returns project only when user belongs
 * to the related organization.
 */
export const findProjectByIdForMember = async (
  projectId: string,
  userId: string,
) => {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      organization: {
        organizationMembers: {
          some: {
            userId,
          },
        },
      },
    },
    include: {
      apiKeys: {
        select: {
          key: true,
        },
      },
    },
  });
};

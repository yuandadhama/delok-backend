// /src/modules/project/project.repository.ts

import { prisma } from "../../lib/prisma";

/**
 * Create project and generate its first API key.
 */
export const createProject = async (name: string, organizationId: string) => {
  return prisma.project.create({
    data: {
      name,
      organizationId,
    },
  });
};

/**
 * Find all projects by organization id.
 */
export const findAllProjects = async (organizationId: string) => {
  return prisma.project.findMany({
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
export const findProjectByIdForMember = async (id: string, userId: string) => {
  return prisma.project.findFirst({
    where: {
      id,
      organization: {
        organizationMembers: {
          some: {
            userId,
          },
        },
      },
    },
  });
};

/**
 * Find project with organization relation.
 *
 * Used for ownership validation.
 */
export const findProjectById = async (id: string) => {
  return prisma.project.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      organization: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });
};

/**
 * Update project by id.
 *
 */
export const updateProject = async (id: string, name: string) => {
  return prisma.project.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
};

/**
 * Delete project by id.
 */
export const deleteProject = async (id: string) => {
  return prisma.project.delete({
    where: {
      id,
    },
  });
};

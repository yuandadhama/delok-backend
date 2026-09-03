// /src/modules/project/project.repository.ts

import { prisma } from "../../lib/prisma.js";

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
 *
 * Also returns the total log event count per project via a single
 * aggregated query (avoids N+1 count requests).
 */
export const findAllProjects = async (organizationId: string) => {
  const projects = await prisma.project.findMany({
    where: {
      organizationId,
    },
    include: {
      _count: {
        select: {
          logEvents: true,
        },
      },
    },
  });

  return projects.map(({ _count, ...project }) => ({
    ...project,
    logCount: _count.logEvents,
  }));
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
 * Find a project that belongs to a specific organization.
 *
 * Encodes the organization boundary directly in the query so callers never
 * retrieve a project that belongs to a different organization.
 */
export const findProjectByIdAndOrganization = async (
  projectId: string,
  organizationId: string,
) => {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
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
          slug: true,
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

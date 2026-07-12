import { prisma } from "../../lib/prisma";

/**
 * Create new organization and automatically
 * add creator as organization owner.
 */
export const createOrganization = async (name: string, userId: string) => {
  return prisma.organization.create({
    data: {
      name,
      organizationMembers: {
        create: {
          userId,
        },
      },
    },
  });
};

/**
 * Get all organizations belong to user.
 */
export const findAllOrganization = async (userId: string) => {
  return prisma.organization.findMany({
    where: {
      organizationMembers: {
        some: {
          userId,
        },
      },
    },
  });
};

/**
 * Find organization by id.
 */
export const findOrganizationById = async (id: string) => {
  return prisma.organization.findUnique({
    where: {
      id,
    },
  });
};

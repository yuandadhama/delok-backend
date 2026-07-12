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
 * Get all organizations owned by user.
 */
export const findAllOrganization = async (userId: string) => {
  return prisma.organization.findMany({
    where: {
      organizationMembers: {
        some: {
          userId,
          role: "owner",
        },
      },
    },
  });
};

/**
 * Find organization by id.
 *
 * User must be a member of the organization.
 */
export const findOrganizationById = async (id: string, userId: string) => {
  return prisma.organization.findFirst({
    where: {
      id,
      organizationMembers: {
        some: {
          userId,
        },
      },
    },
  });
};

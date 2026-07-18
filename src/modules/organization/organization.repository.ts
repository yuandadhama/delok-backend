// /src/modules/organization/organization.repository.ts

import { OrganizationRole } from "../../generated/prisma/client";
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
          role: OrganizationRole.OWNER,
        },
      },
    },
  });
};

/**
 * Get all organizations belong to user.
 */
export const findAllOrganizations = async (userId: string) => {
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

/**
 * Update organization by id.
 */
export const updateOrganization = async (id: string, name: string) => {
  return prisma.organization.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
};

/**
 * Delete organization by the id
 */
export const deleteOrganization = async (id: string) => {
  return prisma.organization.delete({
    where: {
      id,
    },
  });
};

/**
 * Find organization by id and ensure user is a member.
 */
export const findOrganizationByIdForMember = async (
  organizationId: string,
  userId: string,
) => {
  return prisma.organization.findFirst({
    where: {
      id: organizationId,
      organizationMembers: {
        some: {
          userId,
        },
      },
    },
  });
};

/**
 * Find organization owner membership.
 */
export const findOwnerMembership = async (
  organizationId: string,
  userId: string,
) => {
  return prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      role: OrganizationRole.OWNER,
    },
  });
};

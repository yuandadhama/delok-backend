// /src/modules/organization/organization.repository.ts

import { OrganizationRole } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

/**
 * Create new organization and automatically
 * add creator as organization owner.
 */
export const createOrganization = async (
  name: string,
  slug: string,
  userId: string,
) => {
  return prisma.organization.create({
    data: {
      name,
      slug,
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
 * Find organization by slug.
 */
export const findOrganizationBySlug = async (slug: string) => {
  return prisma.organization.findUnique({
    where: {
      slug,
    },
  });
};

/**
 * Update organization by slug.
 */
export const updateOrganization = async (
  slug: string,
  newSlug: string,
  name: string,
) => {
  return prisma.organization.update({
    where: {
      slug,
    },
    data: {
      name,
      slug: newSlug,
    },
  });
};

/**
 * Delete organization by the slug
 */
export const deleteOrganization = async (slug: string) => {
  return prisma.organization.delete({
    where: {
      slug,
    },
  });
};

/**
 * Find organization by slug and ensure user is a member.
 */
export const findOrganizationBySlugForMember = async (
  slug: string,
  userId: string,
) => {
  return prisma.organization.findFirst({
    where: {
      slug,
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
 *
 * Filters through the organization relation by slug,
 * since `OrganizationMember` has no `slug` field.
 */
export const findOwnerMembership = async (slug: string, userId: string) => {
  return prisma.organizationMember.findFirst({
    where: {
      userId,
      role: OrganizationRole.OWNER,
      organization: {
        slug,
      },
    },
  });
};

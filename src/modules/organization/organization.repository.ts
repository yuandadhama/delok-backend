// /src/modules/organization/organization.repository.ts

import { prisma } from "../../lib/prisma";

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

export const findAllOrganization = async (userId: string) => {
  return prisma.organization.findMany({
    where: {
      organizationMembers: {
        every: {
          userId,
          role: "owner",
        },
      },
    },
  });
};

export const findOrganizationById = async (id: string) => {
  console.log("finding organization by id");
  return prisma.organization.findUnique({
    where: {
      id,
    },
  });
};

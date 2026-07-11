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

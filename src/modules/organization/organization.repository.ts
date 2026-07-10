import { prisma } from "../../lib/prisma";

export const createOrganization = async (name: string) => {
  await prisma.organization.create({
    data: {
      name,
    },
  });
};

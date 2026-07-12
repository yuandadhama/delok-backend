import { prisma } from "../../lib/prisma";

export const createProject = async (
  name: string,
  organizationId: string,
  apiKey: string,
) => {
  await prisma.project.create({
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

export const findAllProjects = async (organizationId: string) => {
  await prisma.project.findMany({
    where: {
      organizationId,
    },
  });
};

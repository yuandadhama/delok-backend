import { prisma } from "../../lib/prisma";

export const findLogsByProjectId = async (projectId: string) => {
  return prisma.logEvent.findMany({
    where: {
      projectId,
    },
  });
};

// /src/modules/api-key/api-key.repository.ts

import { prisma } from "../../lib/prisma";

export const findApiKeyById = async (id: string) => {
  return prisma.apiKey.findUnique({
    where: {
      id,
    },
  });
};

export const revokeApiKey = async (id: string) => {
  return prisma.apiKey.update({
    where: {
      id,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

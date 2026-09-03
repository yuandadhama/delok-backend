// /src/modules/auth/auth.repository.ts

import { prisma } from "../../lib/prisma.js";

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const updateEmailVerified = (userId: string, verified: boolean) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      emailVerified: verified,
    },
  });
};

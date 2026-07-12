// /src/modules/organization/organization.authorization.ts

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

/**
 * Ensure current user is a member of organization
 *
 * Throws:
 * 403 Forbidden
 * if user is not a member
 */
export const ensureOrganizationMember = async (
  organizationId: string,
  userId: string,
) => {
  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  if (!member) {
    throw new AppError("Organization access denied", 403);
  }

  return member;
};

/**
 * Ensure current user is organization owner
 *
 * Throws:
 * 403 Forbidden
 * if user is not owner
 */
export const ensureOrganizationOwner = async (
  organizationId: string,
  userId: string,
) => {
  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      role: "owner",
    },
  });

  if (!member) {
    throw new AppError("owner access required", 403);
  }

  return member;
};

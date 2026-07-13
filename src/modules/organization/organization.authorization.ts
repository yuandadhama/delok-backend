// /src/modules/organization/organization.authorization.ts

import { prisma } from "../../lib/prisma";

import { AppError } from "../../utils/AppError";
import {
  findOrganizationByIdForMember,
  findOrganizationOwner,
} from "./organization.repository";

/**
 * Ensure current user is a member of organization.
 */
export const ensureOrganizationMember = async (
  organizationId: string,
  userId: string,
) => {
  const organization = await findOrganizationByIdForMember(
    organizationId,
    userId,
  );

  if (!organization) {
    throw new AppError("Forbidden", 403);
  }

  return organization;
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
  const member = await findOrganizationOwner(organizationId, userId);

  if (!member) {
    throw new AppError("owner access required", 403);
  }

  return member;
};

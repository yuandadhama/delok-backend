// /src/modules/organization/organization.authorization.ts

import { AppError } from "../../utils/AppError";
import {
  findOrganizationByIdForMember,
  findOwnerMembership,
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
 * Ensure current user is organization owner.
 *
 * Throws:
 * - 403 Forbidden when user is not an owner.
 *
 * Returns:
 * - Owner membership record.
 */
export const ensureOrganizationOwner = async (
  organizationId: string,
  userId: string,
) => {
  const member = await findOwnerMembership(organizationId, userId);

  if (!member) {
    throw new AppError("Forbidden", 403);
  }

  return member;
};

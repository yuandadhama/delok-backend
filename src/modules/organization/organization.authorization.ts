// /src/modules/organization/organization.authorization.ts

import { delok } from "../../lib/delok";
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
    delok.warn({
      event: "organization.access_denied",
      message: "User is not a member of organization",
      payload: {
        userId,
        organizationId,
      },
    });
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
    delok.warn({
      event: "User try to access owner feature",
      payload: {
        userId,
        organizationId,
      },
    });
    throw new AppError("Forbidden", 403);
  }

  return member;
};

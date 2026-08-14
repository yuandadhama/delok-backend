// /src/modules/organization/organization.authorization.ts

import { delok } from "../../lib/delok";
import { AppError } from "../../utils/AppError";
import {
  findOrganizationBySlugForMember,
  findOwnerMembership,
} from "./organization.repository";

/**
 * Ensure current user is a member of organization.
 */
export const ensureOrganizationMember = async (
  slug: string,
  userId: string,
) => {
  const organization = await findOrganizationBySlugForMember(slug, userId);

  if (!organization) {
    await delok.warn({
      event: "organization.access_denied",
      message: "User is not a member of organization",
      payload: {
        userId,
        slug,
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
export const ensureOrganizationOwner = async (slug: string, userId: string) => {
  const member = await findOwnerMembership(slug, userId);

  if (!member) {
    await delok.warn({
      event: "User try to access owner feature",
      payload: {
        userId,
        slug,
      },
    });
    throw new AppError("Forbidden", 403);
  }

  return member;
};

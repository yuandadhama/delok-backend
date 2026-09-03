// /src/modules/organization/organization.authorization.ts

import { AppError } from "../../utils/AppError.js";
import {
  findOrganizationBySlugForMember,
  findOwnerMembership,
} from "./organization.repository.js";

/**
 * Ensure current user is a member of organization.
 */
export const ensureOrganizationMember = async (
  slug: string,
  userId: string,
) => {
  const organization = await findOrganizationBySlugForMember(slug, userId);

  if (!organization) {
    console.warn(
      JSON.stringify({
        event: "organization.access_denied",
        userId,
        slug,
      }),
    );
    throw new AppError("Forbidden", 403, "organization.access_denied");
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
    console.warn(
      JSON.stringify({
        event: "organization.owner_access_denied",
        userId,
        slug,
      }),
    );
    throw new AppError("Forbidden", 403, "organization.owner_access_denied");
  }

  return member;
};

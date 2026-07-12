import { AppError } from "../../utils/AppError";

import {
  createOrganization,
  findAllOrganization,
  findOrganizationById,
} from "./organization.repository";

/**
 * Create new organization.
 */
export const createOrganizationService = async (
  name: string,
  userId: string,
) => {
  if (name.length < 3) {
    throw new AppError("name too short", 400);
  }

  return createOrganization(name, userId);
};

/**
 * Get all organizations for current user.
 */
export const getAllOrganizationService = async (userId: string) => {
  return findAllOrganization(userId);
};

/**
 * Get organization by id.
 */
export const getOrganizationByIdService = async (
  id: string,
  userId: string,
) => {
  const organization = await findOrganizationById(id, userId);

  if (!organization) {
    throw new AppError("organization not found", 404);
  }

  return organization;
};

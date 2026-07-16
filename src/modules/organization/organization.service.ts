// /src/modules/organization/organization.service.ts

import id from "zod/v4/locales/id.cjs";
import { AppError } from "../../utils/AppError";
import {
  ensureOrganizationMember,
  ensureOrganizationOwner,
} from "./organization.authorization";

import {
  createOrganization,
  deleteOrganization,
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
 *
 *
 * User must be a member of organization
 */
export const getOrganizationByIdService = async (
  id: string,
  userId: string,
) => {
  return ensureOrganizationMember(id, userId);
};

/**
 * delete organization by id.
 *
 *
 * User must be a member of organization
 */
export const deleteOrganizationService = async (id: string, userId: string) => {
  await ensureOrganizationOwner(id, userId);

  return deleteOrganization(id);
};

import {
  createUser,
  deleteUser,
  findAll,
  findById,
  findByName,
  updateUser,
} from "./user.repository";

import { UserType } from "./user.type";
import { AppError } from "../utils/AppError";

/**
 * Get single user by id
 */
export const getUserByIdService = async (id: string) => {
  const user = await findById(id);

  if (!user) {
    throw new AppError("user not found", 404);
  }
  return user;
};

/**
 * Get all users
 */
export const getAllUserService = async () => {
  return findAll();
};

/**
 * Search users by name
 */
export const searchUserByNameService = async (name: string) => {
  return findByName(name);
};

/**
 * Create new user
 */
export const createUserService = async (user: UserType) => {
  const { name, email } = user;

  if (!name) {
    throw new AppError("field name is required", 400);
  }

  if (!email) {
    throw new AppError("field email is required", 400);
  }

  const createdUser = await createUser(name, email);
  return createdUser;
};

/**
 * Update existing user
 */
export const updateUserService = async (id: string, user: UserType) => {
  const { name, email } = user;
  if (!name) {
    throw new AppError("field name is required", 400);
  }

  if (!email) {
    throw new AppError("field email required", 400);
  }

  // Check user existence before update
  const existingUser = await findById(id);

  if (!existingUser) throw new AppError("user not found to be updated", 404);

  return updateUser(id, user);
};

/**
 * Delete user by id
 */
export const deleteUserService = async (id: string) => {
  // Check user existence before delete
  const existingUser = await findById(id);

  if (!existingUser) throw new AppError("user not found to be deleted", 404);

  return deleteUser(id);
};

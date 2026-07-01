import { User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { UserType } from "./user.validation";

/**
 * Get all users from database
 */
export const findAll = async () => {
  return prisma.user.findMany();
};

/**
 * Find a single user by id
 * Returns null if user is not found
 */
export const findById = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};

/**
 * Search users by name (case insensitive)
 * Example:
 * - "john" -> John Doe
 * - "JOHN" -> John Doe
 */
export const findByName = async (name: string) => {
  return prisma.user.findMany({
    where: {
      name: { contains: name, mode: "insensitive" },
    },
  });
};

/**
 * Create a new user
 */
export const createUser = async (
  name: string,
  email: string,
): Promise<User> => {
  return prisma.user.create({
    data: {
      name,
      email,
    },
  });
};

/**
 * Update user data by id
 */
export const updateUser = async (id: string, data: UserType) => {
  return prisma.user.update({
    where: {
      id,
    },
    data,
  });
};

/**
 * Delete user by id
 */
export const deleteUser = async (id: string) => {
  return prisma.user.delete({
    where: {
      id,
    },
  });
};

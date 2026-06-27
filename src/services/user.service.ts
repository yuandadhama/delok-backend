import {
  createUser,
  deleteUser,
  findAll,
  findById,
  findByName,
} from "../repositories/user.repository";

import { User } from "../types/user.type";
import { AppError } from "../utils/AppError";

export const getUserByIdService = (id: string) => {
  const user = findById(id);

  if (!user) {
    throw new AppError("user not found", 404);
  }
  return user;
};

export const getAllUserService = () => {
  const users = findAll();
  return users;
};

export const searchUserByNameService = (name: string) => {
  const user = findByName(name);
  return user;
};

export const createUserService = (user: User) => {
  const { id, name, email } = user;

  if (!id) {
    throw new AppError("field name id required", 400);
  }

  if (!name) {
    throw new AppError("field name is required", 400);
  }

  if (!email) {
    throw new AppError("field name email required", 400);
  }

  createUser(user);
  return `user created with id ${user.id}`;
};

export const deleteUserService = (id: string) => {
  const deleted = deleteUser(id);
  if (!deleted) {
    throw new AppError("user not found", 404);
  }
  return `user with id ${id} deleted`;
};

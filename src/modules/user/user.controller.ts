// /src/modules/user/user.controller.ts

import { Request, Response } from "express";
import {
  createUserService,
  deleteUserService,
  getAllUserService,
  getUserByIdService,
  searchUserByNameService,
  updateUserService,
} from "../user/user.service";

/**
 * GET /api/user/me
 * Get current user session
 */
export const meController = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: req.session,
  });
};

/**
 * GET /api/user
 * Get all users
 */
export const getAllUserController = async (req: Request, res: Response) => {
  const data = await getAllUserService();
  res.json({
    success: true,
    data,
  });
};

/**
 * GET /api/user/search?name=<keyword>
 * Search users by name
 */
export const searchUserByNameController = async (
  req: Request,
  res: Response,
) => {
  const name = String(req.query.name);
  const data = await searchUserByNameService(name);
  res.json({
    success: true,
    data,
  });
};

/**
 * GET /api/user/:id
 * Get single user by id
 */
export const getUserByIdController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await getUserByIdService(id);
  res.json({
    success: true,
    data,
  });
};

/**
 * POST /api/user
 * Create new user
 */
export const createUserController = async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const user = {
    name,
    email,
  };
  const data = await createUserService(user);
  res.json({
    success: true,
    data,
  });
};

/**
 * PUT /api/user/:id
 * Update existing user
 */
export const updateUserController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { name, email } = req.body;
  const user = {
    name,
    email,
  };
  const data = await updateUserService(id, user);
  res.json({
    success: true,
    data,
  });
};

/**
 * DELETE /api/user/:id
 * Delete user by id
 */
export const deleteUserController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await deleteUserService(id);
  res.json({
    success: true,
    data,
  });
};

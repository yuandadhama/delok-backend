import { Request, Response } from "express";
import {
  createUserService,
  deleteUserService,
  getAllUserService,
  getUserByIdService,
  searchUserByNameService,
} from "../services/user.service";

// to get all user
export const getAllUserController = async (req: Request, res: Response) => {
  const data = await getAllUserService();
  res.json({
    success: true,
    data,
  });
};

// to search user by the name query search
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

// to get a user by id
export const getUserByIdController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const data = await getUserByIdService(id as string);
  res.json({
    success: true,
    data,
  });
};

// to create user
export const createUserController = async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const id = crypto.randomUUID();
  const user = {
    id,
    name,
    email,
  };
  const data = await createUserService(user);
  res.json({
    success: true,
    data,
  });
};

export const deleteUserController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await deleteUserService(id as string);
  res.json({
    success: true,
    data,
  });
};

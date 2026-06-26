import { Request } from "express";
import { getUserByIdService } from "../services/user.service";

export const getUserByIdController = (req: Request) => {
  const { id } = req.params;
  return getUserByIdService(id as string);
};

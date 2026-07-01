import { Request, Response } from "express";
import { signUpService } from "./auth.service";

export const signUpController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const data = await signUpService(email, password);

  res.status(201).json({
    success: true,
    data,
  });
};

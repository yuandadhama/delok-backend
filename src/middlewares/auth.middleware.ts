// /middlewares/auth.middleware.ts

import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { AppError } from "../utils/AppError";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    throw new AppError("unauthorized", 401);
  }

  req.session = session;

  next();
};

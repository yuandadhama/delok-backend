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
  console.log("AUTH MIDDLEWARE");
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  console.log("CHECK SESSION");

  if (!session) {
    throw new AppError("unauthorized", 401);
  }

  req.session = session;
  console.log("AUTH MIDDLEWARE SUCCESS");
  next();
};

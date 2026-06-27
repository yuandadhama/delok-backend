// error.middleware.ts

import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

// util to get error message and code
const getErrorInfo = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      code: 500,
      message: error.message,
    };
  }

  return {
    code: 500,
    message: "Internal Server Error",
  };
};

export const errorMiddleWare = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { code, message } = getErrorInfo(error);
  res.status(code).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

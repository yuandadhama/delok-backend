// /src/middlewares/error.middleware.ts

import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { delok, errorLogger } from "../lib/delok";

const getErrorInfo = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      errorCode: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    };
  }

  return {
    statusCode: 500,
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "Internal Server Error",
  };
};

export const errorMiddleware = async (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { statusCode, errorCode, message } = getErrorInfo(error);

  errorLogger(error as Error, req);

  res.status(statusCode).json({
    success: false,

    error: {
      code: errorCode,
      message,
    },

    timestamp: new Date().toISOString(),
  });
};

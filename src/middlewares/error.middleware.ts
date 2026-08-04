// /src/middlewares/error.middleware.ts

import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { errorLogger } from "../lib/delok";
import { Prisma } from "@prisma/client";

const getErrorInfo = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const modelName = error.meta?.modelName;
        const target = error.meta?.target;

        // Organization's unique constraint is on `slug` (the `name` index was
        // dropped in migration 20260804160535_add_organization_slug).
        if (modelName === "Organization" || target === "slug") {
          return {
            statusCode: 409,
            errorCode: "ORGANIZATION_SLUG_ALREADY_EXISTS",
            message: "Organization slug already exists",
          };
        }

        return {
          statusCode: 409,
          errorCode: "UNIQUE_CONSTRAINT_FAILED",
          message: "Duplicate value",
        };
      }
    }
  }
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

// /src/middlewares/error.middleware.ts

import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
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

        // Project's case-insensitive unique constraint on
        // (organizationId, lower(name)).
        if (
          modelName === "Project" ||
          (Array.isArray(target) &&
            target.some((t: string) => t.includes("lower_name")))
        ) {
          return {
            statusCode: 409,
            errorCode: "PROJECT_NAME_ALREADY_EXISTS",
            message: "Project name already exists in this organization",
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
    // Handle body-parser 413
    const anyErr = error as any;
    if (anyErr?.status === 413 || anyErr?.type === "entity.too.large") {
      return {
        statusCode: 413,
        errorCode: "PAYLOAD_TOO_LARGE",
        message: "Request body too large",
      };
    }
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

  // Independent operational logging — no recursive ingestion
  if (error instanceof Error && statusCode >= 500) {
    console.error(
      JSON.stringify({
        event: errorCode,
        message: error.message,
        method: req.method,
        path: req.path,
        stack: error.stack,
      }),
    );
  }

  res.status(statusCode).json({
    success: false,

    error: {
      code: errorCode,
      message,
    },

    timestamp: new Date().toISOString(),
  });
};

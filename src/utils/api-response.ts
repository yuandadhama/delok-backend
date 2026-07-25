// /src/utils/api-response.ts

import { Response } from "express";

export const errorResponse = (
  res: Response,
  status: number,
  code: string,
  message: string,
) => {
  return res.status(status).json({
    success: false,

    errorDetail: {
      code,
      message,
    },

    timestamp: new Date().toISOString(),
  });
};

import { Delok } from "delok";
import { Request } from "express";
import { AppError } from "../utils/AppError";

export const delok = new Delok({
  apiKey:
    "dlok_6d096840182d8449a85fe0e0f7a30b5ac2de112558f4a800d39ab413420c74d7",
  environment: "development",
});

export const errorLogger = async (
  error: Error,
  errorCode: string,
  req: Request,
) => {
  let appErrorPayload = {};
  if (error instanceof AppError) {
    appErrorPayload = error.payload;
  }

  await delok.error({
    event: errorCode,

    message: error.message,

    payload: {
      appErrorPayload,
      method: req.method,
      path: req.path,
      stack: error.stack,
    },
  });
};

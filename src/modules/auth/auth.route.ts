// /src/modules/auth/auth.route.ts

import { Router } from "express";

import { resendVerificationEmailController } from "./auth.controller";
import { asyncHandler } from "../../utils/async-handler";

export const authRoute = Router();

authRoute.post(
  "/resend-verification",
  asyncHandler(resendVerificationEmailController),
);

// /src/modules/auth/auth.route.ts

import { Router } from "express";
import { z } from "zod";
import { resendVerificationEmailController } from "./auth.controller";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middlewares/validate.middleware";

const resendVerificationSchema = z.object({
  email: z.email().max(254),
});

export const authRoute = Router();

authRoute.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  asyncHandler(resendVerificationEmailController),
);

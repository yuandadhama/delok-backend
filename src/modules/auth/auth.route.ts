// /src/modules/auth/auth.route.ts

import { Router } from "express";
import { z } from "zod";
import { resendVerificationEmailController } from "./auth.controller.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { validate } from "../../middlewares/validate.middleware.js";

const resendVerificationSchema = z.object({
  email: z.email().max(254),
});

export const authRoute = Router();

authRoute.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  asyncHandler(resendVerificationEmailController),
);

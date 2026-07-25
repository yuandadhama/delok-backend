// /src/modules/auth/auth.controller.ts

import { Request, Response } from "express";
import { resendVerificationEmailService } from "./auth.service";

export const resendVerificationEmailController = async (
  req: Request,
  res: Response,
) => {
  const { email } = req.body;

  await resendVerificationEmailService(email);

  res.status(200).json({
    success: true,
    message: "Verification email sent",
  });
};

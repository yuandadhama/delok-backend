// /src/modules/auth/auth.service.ts

import { findUserByEmail } from "./auth.repository";
import { auth } from "../../lib/auth";
import { delok } from "../../lib/delok";

export const resendVerificationEmailService = async (email: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    delok.warn({
      event: "auth.verification_email.skipped.user_not_found",
      payload: {
        email,
      },
    });

    return;
  }

  if (user.emailVerified) {
    delok.warn({
      event: "auth.verification_email.skipped.already_verified",
      payload: {
        userId: user.id,
        email,
      },
    });

    return;
  }

  await auth.api.sendVerificationEmail({
    body: {
      email,
    },
  });

  return;
};

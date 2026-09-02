// /src/modules/auth/auth.service.ts

import { findUserByEmail } from "./auth.repository";
import { auth } from "../../lib/auth";

export const resendVerificationEmailService = async (email: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    console.warn(
      JSON.stringify({
        event: "auth.verification_email.skipped.user_not_found",
        email,
      }),
    );

    return;
  }

  if (user.emailVerified) {
    console.warn(
      JSON.stringify({
        event: "auth.verification_email.skipped.already_verified",
        userId: user.id,
        email,
      }),
    );

    return;
  }

  await auth.api.sendVerificationEmail({
    body: {
      email,
    },
  });

  return;
};

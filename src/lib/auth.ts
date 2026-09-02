// /src/lib/auth.ts

import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { resend } from "./resend";
import { createAuthMiddleware } from "better-auth/api";
import { passwordSchema } from "../features/auth/auth.schema";
import { env } from "./env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  onAPIError: {
    errorURL: `${env.FRONTEND_URL}/auth/error`,
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,

    // reset password setup
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "Delok <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset Password",
        html: /* html */ `
        <h1>Reset Password</h1>

        <p>Hi ${user.name},</p>
        <p>Click the link below to reset your password:</p>
        <br />
        <br />
        <br />
        <a href="${url}">
          Reset Password
        </a>
      `,
      });

      console.info(
        JSON.stringify({
          event: "auth.password_reset.sent",
          userId: user.id,
        }),
      );
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const result = passwordSchema.safeParse(ctx.body.password);

      if (!result.success) {
        throw new APIError("BAD_REQUEST", {
          message: result.error.issues[0].message,
        });
      }
    }),
  },

  emailVerification: {
    // verification email setup
    sendVerificationEmail: async ({ user, url }) => {
      const verifyUrl = new URL(url);

      verifyUrl.searchParams.set(
        "callbackURL",
        `${env.FRONTEND_URL}/sign-up/verified`,
      );

      try {
        const response = await resend.emails.send({
          from: "Delok <onboarding@resend.dev>",
          to: user.email,
          subject: "Verify your email",
          html: /* html */ `
          <div>  
          <h1>Verify your email</h1>
          <p>Hi ${user.name},</p>
          <p>Click <a href="${verifyUrl.toString()}">here</a> to verify your email.</p>
          </div>
          `,
        });

        if (response.error) {
          throw new Error(response.error.message);
        }
      } catch (error) {
        console.error(
          JSON.stringify({
            event: "auth.email_verification.failed",
            userId: user.id,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        );

        throw error;
      }

      console.info(
        JSON.stringify({
          event: "auth.email_verification.sent",
          userId: user.id,
        }),
      );
    },
    sendOnSignIn: true,
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
});

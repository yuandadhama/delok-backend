// /src/lib/auth.ts

import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { createAuthMiddleware } from "better-auth/api";
import { passwordSchema } from "../features/auth/auth.schema";
import { env } from "./env";
import {
  sendVerificationEmail as sendVerificationEmailService,
  sendPasswordResetEmail as sendPasswordResetEmailService,
} from "../infrastructure/email/email.service";

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

    sendResetPassword: async ({ user, url }) => {
      try {
        await sendPasswordResetEmailService({
          to: user.email,
          name: user.name,
          resetUrl: url,
        });
      } catch (error) {
        // Error already logged inside email.service (without token)
        throw error;
      }
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
    sendVerificationEmail: async ({ user, url }) => {
      const verifyUrl = new URL(url);
      verifyUrl.searchParams.set(
        "callbackURL",
        `${env.FRONTEND_URL}/sign-up/verified`,
      );

      try {
        await sendVerificationEmailService({
          to: user.email,
          name: user.name,
          verifyUrl: verifyUrl.toString(),
        });
      } catch (error) {
        // Error already logged inside email.service (without token)
        throw error;
      }
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

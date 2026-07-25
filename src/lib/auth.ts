// /src/lib/auth.ts

import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { resend } from "./resend";
import { delok } from "./delok";
import { createAuthMiddleware } from "better-auth/api";
import { passwordSchema } from "../features/auth/auth.schema";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error("Google OAuth env missing");
}

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (!githubClientId || !githubClientSecret) {
  throw new Error("Github OAuth env missing");
}

console.log("AUTH CONFIG LOADED");

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ["http://localhost:3000"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  onAPIError: {
    errorURL: "http://localhost:3000/auth/error",
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

      delok.info({
        event: "auth.password_reset.sent",
        payload: {
          userId: user.id,
        },
      });
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      console.log("PATH:", ctx.path);
      console.log("BODY:", ctx.body);
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
        "http://localhost:3000/sign-up/verified",
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
        delok.error({
          event: "auth.email_verification.failed",
          message: "Failed to send verification email",
          payload: {
            userId: user.id,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw error;
      }

      delok.info({
        event: "auth.email_verification.sent",
        payload: {
          userId: user.id,
          email: user.email,
        },
      });
    },
    sendOnSignIn: true,
  },

  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
    github: {
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    },
  },
});

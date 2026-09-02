// src/infrastructure/email/email.service.ts
// Boundary: Auth/Business decides "an email needs to be sent",
// this service decides how it is constructed and delivered.

import { resend } from "../../lib/resend";
import { env } from "../../lib/env";
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
} from "./email.templates";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  type: string;
};

function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length <= 2 ? "***" : `${local[0]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

async function sendEmailWithTimeout(params: SendEmailParams): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  timeout.unref?.();

  try {
    const start = Date.now();
    // Resend SDK doesn't natively support AbortSignal in all versions,
    // but we race with a timeout rejection to avoid indefinite hang.
    const sendPromise = resend.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () => reject(new Error("Email send timeout")));
    });

    const result: any = await Promise.race([sendPromise, timeoutPromise]);

    clearTimeout(timeout);

    if (result?.error) {
      throw new Error(result.error.message || "Email provider error");
    }

    const duration = Date.now() - start;
    console.info(
      JSON.stringify({
        event: "email.sent",
        type: params.type,
        to: redactEmail(params.to),
        duration,
      }),
    );
  } catch (error) {
    clearTimeout(timeout);
    const message = error instanceof Error ? error.message : "Unknown email error";
    // Never log token/URL — only type + redacted recipient + error message (no stack with tokens)
    console.error(
      JSON.stringify({
        event: "email.failed",
        type: params.type,
        to: redactEmail(params.to),
        error: message,
      }),
    );
    throw error;
  }
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<void> {
  const tpl = verificationEmailTemplate({
    name: params.name,
    verifyUrl: params.verifyUrl,
  });

  await sendEmailWithTimeout({
    to: params.to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    type: "verification",
  });

  console.info(
    JSON.stringify({
      event: "auth.email_verification.sent",
      to: redactEmail(params.to),
    }),
  );
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const tpl = passwordResetEmailTemplate({
    name: params.name,
    resetUrl: params.resetUrl,
  });

  await sendEmailWithTimeout({
    to: params.to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    type: "password_reset",
  });

  console.info(
    JSON.stringify({
      event: "auth.password_reset.sent",
      to: redactEmail(params.to),
    }),
  );
}

// For testing: allow direct inspection of helper
export const _internal = { redactEmail };

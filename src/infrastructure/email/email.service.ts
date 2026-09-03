// src/infrastructure/email/email.service.ts
// Boundary: Auth/Business decides "an email needs to be sent",
// this service decides how it is constructed and delivered.

import { resend } from "../../lib/resend.js";
import { env } from "../../lib/env.js";
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
} from "./email.templates.js";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  type: "verification" | "password_reset";
};

type ResendResult = Awaited<ReturnType<typeof resend.emails.send>>;

function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length <= 2 ? "***" : `${local[0]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

async function sendEmailWithTimeout(params: SendEmailParams): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  // Prevent timeout keeping process alive
  if (typeof timeout === "object" && "unref" in timeout) {
    (timeout as unknown as { unref: () => void }).unref();
  }

  const start = Date.now();
  let providerMessage: string | undefined;

  try {
    // Pass AbortSignal so underlying fetch (if supported) is actually cancelled.
    // Resend SDK forwards `...options` to fetch: fetch(url, { ...options, signal }).
    // If the SDK version does not support signal, the application-level timeout race still bounds execution.
    const sendPromise = resend.emails.send(
      {
        from: env.EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      },
      { signal: controller.signal } as Record<string, unknown>,
    );

    const timeoutPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () =>
        reject(new Error("Email send timeout")),
      );
    });

    const result = (await Promise.race([sendPromise, timeoutPromise])) as ResendResult;

    clearTimeout(timeout);

    if (result?.error) {
      providerMessage = result.error.message || "Email provider error";
      throw new Error(providerMessage);
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
    const rawMessage = error instanceof Error ? error.message : "Unknown email error";
    providerMessage = providerMessage ?? rawMessage;

    // Never log token/URL — only type + redacted recipient + provider message
    console.error(
      JSON.stringify({
        event: "email.failed",
        type: params.type,
        to: redactEmail(params.to),
        error: providerMessage,
      }),
    );

    // Sanitize error for client: do not leak provider internals, tokens, or API keys
    const sanitized =
      params.type === "verification"
        ? "Failed to send verification email. Please try again later."
        : "Failed to send password reset email. Please try again later.";

    throw new Error(sanitized);
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

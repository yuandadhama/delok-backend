// src/infrastructure/email/email.templates.ts

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export function verificationEmailTemplate(params: {
  name: string;
  verifyUrl: string;
}): EmailTemplate {
  const safeName = escapeHtml(params.name);
  const safeUrl = escapeHtml(params.verifyUrl);

  return {
    subject: "Verify your Delok email",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px;">Verify your email</h1>
        <p>Hi ${safeName},</p>
        <p>Click the link below to verify your email address for Delok.</p>
        <p><a href="${safeUrl}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Verify email</a></p>
        <p style="color:#666;font-size:13px;">Or copy this URL into your browser:</p>
        <p style="word-break:break-all;"><a href="${safeUrl}">${safeUrl}</a></p>
        <p style="color:#666;font-size:13px;">This link will expire. If you didn't create a Delok account, you can ignore this email.</p>
      </div>
    `,
    text: `Verify your email

Hi ${params.name},

Click the link below to verify your email address for Delok:

${params.verifyUrl}

This link will expire. If you didn't create a Delok account, you can ignore this email.`,
  };
}

export function passwordResetEmailTemplate(params: {
  name: string;
  resetUrl: string;
}): EmailTemplate {
  const safeName = escapeHtml(params.name);
  const safeUrl = escapeHtml(params.resetUrl);

  return {
    subject: "Reset your Delok password",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 20px;">Reset your password</h1>
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your Delok password. Click below to choose a new password.</p>
        <p><a href="${safeUrl}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a></p>
        <p style="color:#666;font-size:13px;">Or copy this URL into your browser:</p>
        <p style="word-break:break-all;"><a href="${safeUrl}">${safeUrl}</a></p>
        <p style="color:#666;font-size:13px;">This link will expire. If you didn't request a reset, you can ignore this email.</p>
      </div>
    `,
    text: `Reset your password

Hi ${params.name},

We received a request to reset your Delok password. Use the link below to choose a new password:

${params.resetUrl}

This link will expire. If you didn't request a reset, you can ignore this email.`,
  };
}

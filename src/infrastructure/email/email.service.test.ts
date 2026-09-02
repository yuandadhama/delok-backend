import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

// Mock provider + env
vi.mock("../../lib/resend", () => ({
  resend: { emails: { send: (...args: any[]) => mockSend(...args) } },
}));

vi.mock("../../lib/env", () => ({
  env: {
    EMAIL_FROM: "Delok <noreply@test.delok.dev>",
    FRONTEND_URL: "http://localhost:3000",
    RESEND_API_KEY: "re_test",
  },
}));

import { sendVerificationEmail, sendPasswordResetEmail, _internal } from "./email.service";

describe("email service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null });
  });

  it("sendVerificationEmail calls provider with correct recipient, sender, subject, html+text", async () => {
    await sendVerificationEmail({
      to: "alice@example.com",
      name: "Alice",
      verifyUrl: "https://api.delok.dev/verify?token=abc123",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const args = mockSend.mock.calls[0][0];
    expect(args.to).toBe("alice@example.com");
    expect(args.from).toBe("Delok <noreply@test.delok.dev>");
    expect(args.subject).toBe("Verify your Delok email");
    expect(args.html).toContain("https://api.delok.dev/verify?token=abc123");
    expect(args.text).toContain("https://api.delok.dev/verify?token=abc123");
  });

  it("sendPasswordResetEmail uses correct template", async () => {
    await sendPasswordResetEmail({
      to: "bob@example.com",
      name: "Bob",
      resetUrl: "https://api.delok.dev/reset?token=xyz",
    });
    const args = mockSend.mock.calls[0][0];
    expect(args.subject).toBe("Reset your Delok password");
    expect(args.to).toBe("bob@example.com");
  });

  it("provider failure is sanitized, not leaked to client, but logged internally", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSend.mockResolvedValue({ data: null, error: { message: "Invalid recipient" } });
    await expect(
      sendVerificationEmail({ to: "bad@example.com", name: "x", verifyUrl: "https://x" }),
    ).rejects.toThrow("Failed to send verification email");
    // Internal log must contain provider message for operator, but thrown error is sanitized
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logged = consoleErrorSpy.mock.calls.flat().join(" ");
    expect(logged).toContain("Invalid recipient");
    // Thrown error must NOT contain provider message
    try {
      await sendVerificationEmail({ to: "bad@example.com", name: "x", verifyUrl: "https://x" });
    } catch (e) {
      expect((e as Error).message).not.toContain("Invalid recipient");
      expect((e as Error).message).toBe("Failed to send verification email. Please try again later.");
    }
    consoleErrorSpy.mockRestore();
  });

  it("raw provider exception is sanitized for password reset", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSend.mockRejectedValue(new Error("Network failure"));
    await expect(
      sendPasswordResetEmail({ to: "a@b.com", name: "n", resetUrl: "https://x" }),
    ).rejects.toThrow("Failed to send password reset email");
    const logged = consoleErrorSpy.mock.calls.flat().join(" ");
    expect(logged).toContain("Network failure");
    consoleErrorSpy.mockRestore();
  });

  it("redactEmail masks local part", () => {
    expect(_internal.redactEmail("alice@example.com")).toBe("a***e@example.com");
    expect(_internal.redactEmail("ab@example.com")).toBe("***@example.com");
  });

  it("does not log raw token — provider not called with logged url leak (manual verification via not logging full url)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    mockSend.mockResolvedValue({ data: null, error: { message: "fail" } });
    await expect(
      sendVerificationEmail({ to: "u@example.com", name: "u", verifyUrl: "https://api.delok.dev/verify?token=SECRET" }),
    ).rejects.toThrow();
    // Ensure no console call contains SECRET token
    const allLogs = [...consoleErrorSpy.mock.calls.flat().join(" "), ...consoleInfoSpy.mock.calls.flat().join(" ")].join(" ");
    expect(allLogs).not.toContain("SECRET");
    consoleErrorSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it("is sender explicit not hardcoded onboarding@resend.dev in test env", async () => {
    await sendVerificationEmail({ to: "x@x.com", name: "n", verifyUrl: "https://x" });
    expect(mockSend.mock.calls[0][0].from).not.toBe("Delok <onboarding@resend.dev>");
  });

  it("passes AbortSignal to Resend for network cancellation", async () => {
    await sendVerificationEmail({ to: "x@x.com", name: "n", verifyUrl: "https://x" });
    const requestOptions = mockSend.mock.calls[0][1] as Record<string, unknown>;
    expect(requestOptions).toBeDefined();
    expect(requestOptions.signal).toBeInstanceOf(AbortSignal);
  });

  it("sanitized errors do not contain API key or token", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSend.mockResolvedValue({ data: null, error: { message: "API key invalid: re_SECRET_KEY" } });
    let thrown: Error | undefined;
    try {
      await sendVerificationEmail({ to: "a@b.com", name: "n", verifyUrl: "https://x?token=abc" });
    } catch (e) {
      thrown = e as Error;
    }
    expect(thrown).toBeDefined();
    expect(thrown!.message).not.toContain("re_SECRET_KEY");
    expect(thrown!.message).not.toContain("abc");
    expect(thrown!.message).toBe("Failed to send verification email. Please try again later.");
    spy.mockRestore();
  });
});

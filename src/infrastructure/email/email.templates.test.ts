import { describe, it, expect } from "vitest";
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
} from "./email.templates";

describe("email templates", () => {
  it("verification template escapes html in name and url", () => {
    const tpl = verificationEmailTemplate({
      name: '<script>alert("x")</script>',
      verifyUrl: "https://api.delok.dev/auth/verify?token=abc&callback=https://app.delok.dev",
    });
    expect(tpl.subject).toBe("Verify your Delok email");
    expect(tpl.html).not.toContain("<script>");
    expect(tpl.html).toContain("&lt;script&gt;");
    expect(tpl.html).toContain("https://api.delok.dev/auth/verify?token=abc");
    expect(tpl.text).toContain("https://api.delok.dev/auth/verify?token=abc");
    expect(tpl.text).toContain('<script>alert("x")</script>'); // text fallback is plain, not escaped needlessly
  });

  it("verification html contains verify link and text fallback", () => {
    const url = "https://api.delok.dev/verify?token=123";
    const tpl = verificationEmailTemplate({ name: "Alice", verifyUrl: url });
    expect(tpl.html).toContain(url);
    expect(tpl.html).toContain("Verify email");
    expect(tpl.text).toContain(url);
  });

  it("password reset template has correct subject and contains url", () => {
    const tpl = passwordResetEmailTemplate({
      name: "Bob",
      resetUrl: "https://api.delok.dev/reset?token=xyz",
    });
    expect(tpl.subject).toBe("Reset your Delok password");
    expect(tpl.html).toContain("Reset password");
    expect(tpl.html).toContain("https://api.delok.dev/reset?token=xyz");
    expect(tpl.text).toContain("https://api.delok.dev/reset?token=xyz");
  });

  it("escapes user name with special chars in reset template", () => {
    const tpl = passwordResetEmailTemplate({
      name: 'Bob & "Alice" <test>',
      resetUrl: "https://example.com",
    });
    expect(tpl.html).toContain("Bob &amp; &quot;Alice&quot; &lt;test&gt;");
  });

  it("never includes hardcoded localhost", () => {
    const v = verificationEmailTemplate({ name: "u", verifyUrl: "https://api.delok.dev/x" });
    const r = passwordResetEmailTemplate({ name: "u", resetUrl: "https://api.delok.dev/y" });
    expect(v.html + v.text).not.toContain("localhost");
    expect(r.html + r.text).not.toContain("localhost");
    expect(v.html + v.text).not.toContain("127.0.0.1");
  });
});

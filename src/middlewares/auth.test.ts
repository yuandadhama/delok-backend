import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock better-auth before importing middleware
vi.mock("../lib/auth", () => ({
  auth: {
    api: { getSession: vi.fn() },
  },
}));

import { authMiddleware } from "./auth.middleware";
import { auth } from "../lib/auth";

describe("authMiddleware", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws 401 when no session", async () => {
    (auth.api.getSession as any).mockResolvedValue(null);
    const req: any = { headers: {} };
    const res: any = {};
    await expect(authMiddleware(req, res, () => {})).rejects.toMatchObject({ statusCode: 401 });
  });

  it("sets req.session and calls next on valid session", async () => {
    const fakeSession = { user: { id: "u1" } };
    (auth.api.getSession as any).mockResolvedValue(fakeSession);
    const req: any = { headers: { cookie: "a=b" } };
    let nextCalled = false;
    await authMiddleware(req, resEmpty(), () => {
      nextCalled = true;
    });
    expect(req.session).toEqual(fakeSession);
    expect(nextCalled).toBe(true);
  });
});

function resEmpty(): any {
  return {};
}

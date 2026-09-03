import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./ingestion.repository", () => ({
  findApiKeyByKeyHash: vi.fn(),
  createLogEvent: vi.fn(async (_a: any, _b: any, _c: any, _d: any, _e: any, _f: any, _g: any) => ({
    id: "log1", projectId: "proj1", environment: "production", level: "error", event: "e", message: "m", occurredAt: new Date(), receivedAt: new Date(), payload: null,
  })),
  countProjectLogs: vi.fn(async () => 1),
  updateApiKeyLastUsedAt: vi.fn(async () => {}),
}));

vi.mock("../../infrastructure/realtime/realtime.service", () => ({
  realtime: { emit: vi.fn() },
}));

import { findApiKeyByKeyHash } from "./ingestion.repository.js";
import { createLogEventService } from "./ingestion.service.js";
import { sha256 } from "../../utils/hash.js";

describe("ingestion service", () => {
  beforeEach(() => vi.resetAllMocks());

  it("succeeds with valid key", async () => {
    (findApiKeyByKeyHash as any).mockResolvedValue({ id: "k1", projectId: "proj1", revokedAt: null, lastUsedAt: null });
    const key = "dlok_" + "a".repeat(64);
    const res = await createLogEventService(key, "production", "error", "test", new Date(), "msg", undefined);
    expect(res).toBeDefined();
  });

  it("rejects invalid key", async () => {
    (findApiKeyByKeyHash as any).mockResolvedValue(null);
    await expect(createLogEventService("bad", "production", "error", "e", new Date(), undefined, undefined)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects revoked key", async () => {
    (findApiKeyByKeyHash as any).mockResolvedValue({ id: "k1", projectId: "proj1", revokedAt: new Date(), lastUsedAt: null });
    await expect(createLogEventService("dlok_x", "production", "error", "e", new Date(), undefined, undefined)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("updates lastUsedAt only when stale", async () => {
    const { updateApiKeyLastUsedAt } = await import("./ingestion.repository.js");
    (findApiKeyByKeyHash as any).mockResolvedValue({ id: "k1", projectId: "proj1", revokedAt: null, lastUsedAt: new Date() });
    await createLogEventService("dlok_y".padEnd(20, "a"), "production", "error", "e", new Date(), undefined, undefined);
    // lastUsedAt is now, so no update (within 5min)
    expect(updateApiKeyLastUsedAt).not.toHaveBeenCalled();
  });
});

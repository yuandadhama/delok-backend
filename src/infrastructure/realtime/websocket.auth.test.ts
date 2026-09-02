import { describe, it, expect, vi } from "vitest";

// Mock authorization helper
vi.mock("../../modules/project/project.authorization", () => ({
  ensureProjectMember: vi.fn(async (projectId: string, userId: string) => {
    if (projectId === "proj-allowed" && userId === "user1") return { id: projectId };
    throw new Error("Forbidden");
  }),
}));

import { WebSocket } from "ws";
import { EventEmitter } from "node:events";
import { subscriptions, socketUsers, websocket } from "./websocket";

function makeSocket(userId?: string) {
  const s: any = new EventEmitter();
  s.readyState = WebSocket.OPEN;
  s.send = vi.fn();
  s.ping = vi.fn();
  s.terminate = vi.fn();
  s.close = vi.fn();
  if (userId) socketUsers.set(s, userId);
  websocket.emit("connection", s);
  return s as unknown as WebSocket;
}

describe("websocket authorization", () => {
  it("rejects unauthenticated socket subscription", async () => {
    const sock = makeSocket(undefined);
    const msg = JSON.stringify({ type: "project.subscribe", data: { projectId: "proj-allowed" } });
    sock.emit("message", Buffer.from(msg));
    // Wait tick for async handler
    await new Promise((r) => setTimeout(r, 50));
    expect((sock as any).send).toHaveBeenCalled();
    const sent = JSON.parse(((sock as any).send.mock.calls[0] as any)[0]);
    expect(sent.error.code).toBe("UNAUTHORIZED");
    expect(subscriptions.get(sock)).toBeUndefined();
    sock.removeAllListeners();
    subscriptions.delete(sock);
    socketUsers.delete(sock as any);
  });

  it("allows authorized subscription and blocks unauthorized", async () => {
    const sock = makeSocket("user1");
    // authorized
    sock.emit("message", Buffer.from(JSON.stringify({ type: "project.subscribe", data: { projectId: "proj-allowed" } })));
    await new Promise((r) => setTimeout(r, 50));
    expect(subscriptions.get(sock as any)?.has("proj-allowed")).toBe(true);

    // unauthorized
    sock.emit("message", Buffer.from(JSON.stringify({ type: "project.subscribe", data: { projectId: "proj-other" } })));
    await new Promise((r) => setTimeout(r, 50));
    expect(subscriptions.get(sock)?.has("proj-other")).toBe(false);
    // Should have sent FORBIDDEN
    const calls = (sock as any).send.mock.calls;
    const last = JSON.parse(calls[calls.length - 1][0]);
    expect(last.error.code).toBe("FORBIDDEN");

    sock.removeAllListeners();
    subscriptions.delete(sock);
    socketUsers.delete(sock as any);
  });

  it("does not crash on malformed JSON", async () => {
    const sock = makeSocket("user1");
    sock.emit("message", Buffer.from("not-json{{{"));
    await new Promise((r) => setTimeout(r, 20));
    expect((sock as any).send).toHaveBeenCalled();
    const sent = JSON.parse(((sock as any).send.mock.calls[0] as any)[0]);
    expect(sent.error.code).toBe("INVALID_MESSAGE");
    sock.removeAllListeners();
    subscriptions.delete(sock);
    socketUsers.delete(sock as any);
  });

  it("enforces max subscriptions", async () => {
    const sock = makeSocket("user1");
    // Mock ensureProjectMember to allow any proj for this test
    const mod = await import("../../modules/project/project.authorization");
    (mod.ensureProjectMember as any).mockResolvedValue({ id: "x" });

    for (let i = 0; i < 10; i++) {
      sock.emit("message", Buffer.from(JSON.stringify({ type: "project.subscribe", data: { projectId: `p${i}` } })));
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(subscriptions.get(sock)?.size).toBe(10);
    // 11th should be rejected
    sock.emit("message", Buffer.from(JSON.stringify({ type: "project.subscribe", data: { projectId: "p10" } })));
    await new Promise((r) => setTimeout(r, 20));
    expect(subscriptions.get(sock)?.size).toBe(10);
    const last = JSON.parse(((sock as any).send.mock.calls.at(-1) as any)[0]);
    expect(last.error.code).toBe("LIMIT_EXCEEDED");

    sock.removeAllListeners();
    subscriptions.delete(sock);
    socketUsers.delete(sock as any);
    vi.resetAllMocks();
  });
});

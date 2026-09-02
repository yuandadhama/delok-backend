import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock prisma for health tests
vi.mock("./lib/prisma", () => ({
  prisma: { $queryRaw: vi.fn(async () => [{ "?column?": 1 }]) },
}));

vi.mock("./lib/env", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 8000,
    DATABASE_URL: "postgresql://test",
    BETTER_AUTH_SECRET: "test-secret-32chars-long-xxxxxxxx",
    BETTER_AUTH_URL: "http://localhost:8000",
    FRONTEND_URL: "http://localhost:3000",
    RESEND_API_KEY: "re_test",
    GOOGLE_CLIENT_ID: "x",
    GOOGLE_CLIENT_SECRET: "x",
    GITHUB_CLIENT_ID: "x",
    GITHUB_CLIENT_SECRET: "x",
  },
}));

const { app } = await import("./app");

describe("health & readiness", () => {
  it("GET /health returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /readiness returns 200 when DB ok", async () => {
    const res = await request(app).get("/readiness");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
  });

  it("GET / returns service info", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("delok-backend");
  });

  it("anonymous cannot access protected route", async () => {
    const res = await request(app).get("/api/organization");
    expect([401, 403]).toContain(res.status);
  });

  it("ingestion without key -> 401", async () => {
    const res = await request(app)
      .post("/api/ingestion")
      .send({ environment: "production", level: "error", event: "e", occurredAt: new Date().toISOString() });
    expect(res.status).toBe(401);
  });

  it("ingestion rejects oversized body (1mb limit) -> 413", async () => {
    const big = "a".repeat(1_100_000);
    const res = await request(app)
      .post("/api/ingestion")
      .set("x-api-key", "dlok_test")
      .send({ environment: "production", level: "error", event: "e", occurredAt: new Date().toISOString(), message: big });
    // express.json limit triggers 413 Payload Too Large before validation
    expect([400, 413]).toContain(res.status);
  });
});

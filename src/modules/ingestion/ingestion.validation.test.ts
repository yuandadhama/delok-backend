import { describe, it, expect } from "vitest";
import { createLogEventSchema } from "./ingestion.validation";

describe("ingestion validation", () => {
  const base = {
    environment: "production",
    level: "error",
    event: "test.event",
    occurredAt: new Date().toISOString(),
    message: "hello",
  };

  it("accepts valid payload", () => {
    expect(() => createLogEventSchema.parse(base)).not.toThrow();
  });

  it("rejects empty environment", () => {
    expect(() => createLogEventSchema.parse({ ...base, environment: "" })).toThrow();
  });

  it("rejects event exceeding max length", () => {
    expect(() => createLogEventSchema.parse({ ...base, event: "a".repeat(201) })).toThrow();
  });

  it("rejects message exceeding 5000", () => {
    expect(() => createLogEventSchema.parse({ ...base, message: "a".repeat(5001) })).toThrow();
  });

  it("rejects payload >10kb", () => {
    const big = "a".repeat(11 * 1024);
    expect(() => createLogEventSchema.parse({ ...base, payload: { data: big } })).toThrow();
  });

  it("rejects occurredAt in distant future", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(() => createLogEventSchema.parse({ ...base, occurredAt: future })).toThrow();
  });

  it("rejects occurredAt older than 30 days", () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    expect(() => createLogEventSchema.parse({ ...base, occurredAt: old })).toThrow();
  });

  it("accepts optional payload missing", () => {
    const { payload, ...rest } = base as any;
    expect(() => createLogEventSchema.parse(rest)).not.toThrow();
  });
});

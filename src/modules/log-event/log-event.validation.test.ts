import { describe, it, expect } from "vitest";
import { logEventQuerySchema } from "./log-event.validation.js";

describe("log-event query validation", () => {
  it("defaults page/limit", () => {
    const r = logEventQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(50);
  });
  it("rejects search >200", () => {
    expect(() => logEventQuerySchema.parse({ search: "a".repeat(201) })).toThrow();
  });
  it("rejects limit >250", () => {
    expect(() => logEventQuerySchema.parse({ limit: 251 })).toThrow();
  });
});

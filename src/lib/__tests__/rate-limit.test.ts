import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, RATE_LIMITS } from "../rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    const windows = new Map();
  });

  it("allows requests within limit", () => {
    const result = rateLimit("test-ip", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over limit", () => {
    const key = "block-test-ip";
    for (let i = 0; i < 5; i++) {
      rateLimit(key, 5);
    }
    const result = rateLimit(key, 5);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = "reset-test-ip";
    for (let i = 0; i < 5; i++) {
      rateLimit(key, 5, 0);
    }
    const result = rateLimit(key, 5, 0);
    expect(result.allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const r1 = rateLimit("ip-a", 2);
    const r2 = rateLimit("ip-b", 2);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);

    rateLimit("ip-a", 2);
    const r1Third = rateLimit("ip-a", 2);
    const r2Second = rateLimit("ip-b", 2);
    expect(r1Third.allowed).toBe(false);
    expect(r2Second.allowed).toBe(true);
  });

  it("RATE_LIMITS constants are valid", () => {
    expect(RATE_LIMITS.agentExecute.limit).toBeGreaterThan(0);
    expect(RATE_LIMITS.payments.limit).toBeGreaterThan(0);
    expect(RATE_LIMITS.general.limit).toBeGreaterThan(0);
    expect(RATE_LIMITS.agentExecute.windowMs).toBeGreaterThan(0);
  });
});

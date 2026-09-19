import { describe, expect, it } from "vitest";
import { RateLimitService, subjectHash } from "./rate-limit.service.js";

describe("RateLimitService", () => {
  it("uses a secret-derived subject and rejects requests over the configured limit", async () => {
    let count = 0;
    let storedSubject = "";
    const secret = "test-rate-limit-secret-that-is-at-least-32";
    const service = new RateLimitService({ increment: async (_scope, subject) => { storedSubject = subject; return ++count; } }, secret);
    for (let attempt = 0; attempt < 5; attempt += 1) await service.check("loginAccount", "member@example.com");
    await expect(service.check("loginAccount", "member@example.com")).rejects.toThrow("RATE_LIMITED");
    expect(storedSubject).toBe(subjectHash(secret, "member@example.com"));
    expect(storedSubject).not.toContain("member@example.com");
  });
});

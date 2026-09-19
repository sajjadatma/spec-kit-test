import { describe, expect, it } from "vitest";
import { hashPassword } from "./password.service.js";
import { AuthenticationService } from "./authentication.service.js";
import { SessionService } from "./session.service.js";

const sessions = new SessionService({
  createSession: async ({ userId, authVersion, expiresAt }) => ({
    id: "session-1", userId, familyExpiresAt: expiresAt, revokedAt: null, authVersionAtIssue: authVersion,
  }),
  rotate: async () => null,
  revoke: async () => undefined,
}, "test-access-secret-that-is-at-least-32-bytes");

describe("AuthenticationService", () => {
  it("creates a session only for an approved and enabled account", async () => {
    const passwordHash = await hashPassword("a-long-safe-password");
    const service = new AuthenticationService({
      findByNormalizedEmail: async () => ({ id: "user-1", passwordHash, role: "USER", approval: "APPROVED", disabledAt: null, authVersion: 4 }),
    }, sessions);

    const result = await service.login("member@example.com", "a-long-safe-password");
    expect(result.access).toBe("APPROVED");
    expect("refreshToken" in result).toBe(true);
  });

  it("returns access status only after a valid password is supplied", async () => {
    const passwordHash = await hashPassword("a-long-safe-password");
    const service = new AuthenticationService({
      findByNormalizedEmail: async () => ({ id: "user-1", passwordHash, role: "USER", approval: "PENDING", disabledAt: null, authVersion: 0 }),
    }, sessions);

    await expect(service.login("member@example.com", "wrong-password")).rejects.toThrow("INVALID_CREDENTIALS");
    await expect(service.login("member@example.com", "a-long-safe-password")).resolves.toEqual({ access: "PENDING" });
  });
});

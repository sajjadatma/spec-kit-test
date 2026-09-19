import { describe, expect, it } from "vitest";
import { SessionService } from "./session.service.js";
describe("SessionService", () => {
  const store = { createSession: async () => ({ id: "s", userId: "u", familyExpiresAt: new Date(Date.now() + 60_000), revokedAt: null, authVersionAtIssue: 0 }), rotate: async () => "REPLAY" as const, revoke: async () => undefined };
  it("rejects a replayed refresh family", async () => {
    const service = new SessionService(store, "test-access-secret-that-is-at-least-32-bytes");
    await expect(service.rotate("token")).rejects.toThrow("REFRESH_REPLAY");
  });
  it("issues and verifies a short-lived signed access token", async () => {
    const service = new SessionService(store, "test-access-secret-that-is-at-least-32-bytes");
    const created = await service.create("u", 2);
    expect(service.verifyAccessToken(created.accessToken)).toMatchObject({ sub: "u", sid: "s", ver: 0 });
    expect(() => service.verifyAccessToken(`${created.accessToken}tampered`)).toThrow("ACCESS_TOKEN_INVALID");
  });
});

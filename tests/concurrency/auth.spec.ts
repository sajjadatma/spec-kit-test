import { describe, expect, it } from "vitest";
import { SessionService } from "../../packages/backend/src/identity/session.service.js";
describe("auth concurrency", () => { it("rejects a consumed refresh token as a replay", async () => { const service = new SessionService({ createSession: async () => ({ id: "s", userId: "u", familyExpiresAt: new Date(), revokedAt: null, authVersionAtIssue: 0 }), rotate: async () => "REPLAY", revoke: async () => undefined }, "test-access-secret-that-is-at-least-32-bytes"); await expect(service.rotate("reused-token")).rejects.toThrow("REFRESH_REPLAY"); }); });

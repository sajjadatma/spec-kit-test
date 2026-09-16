import { describe, expect, it } from "vitest";
import { SessionService } from "./session.service.js";
describe("SessionService", () => { it("rejects a replayed refresh family", async () => { const service = new SessionService({ createSession: async () => ({ id: "s", userId: "u", familyExpiresAt: new Date(), revokedAt: null, authVersionAtIssue: 0 }), rotate: async () => "REPLAY", revoke: async () => undefined }); await expect(service.rotate("token")).rejects.toThrow("REFRESH_REPLAY"); }); });

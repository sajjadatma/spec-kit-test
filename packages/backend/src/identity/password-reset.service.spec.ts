import { describe, expect, it } from "vitest";
import { PasswordResetService } from "./password-reset.service.js";
describe("PasswordResetService", () => {
  it("issues opaque reset tokens", async () => { let saved = ""; const service = new PasswordResetService({ issue: async (_id, tokenHash) => { saved = tokenHash; return "reset-1"; }, consume: async () => true }); const reset = await service.issue("u"); expect(reset.token).not.toBe(saved); expect(reset.token.length).toBeGreaterThan(20); expect(reset.resetId).toBe("reset-1"); });

  it("leaves only the latest link usable and rejects a consumed-link replay", async () => {
    let currentHash = "";
    let consumed = false;
    const service = new PasswordResetService({
      issue: async (_userId, tokenHash) => { currentHash = tokenHash; consumed = false; return "reset"; },
      consume: async (tokenHash) => { if (tokenHash !== currentHash || consumed) return false; consumed = true; return true; },
    });
    const first = await service.issue("u");
    const second = await service.issue("u");
    await expect(service.consume(first.token, "a-long-safe-password")).resolves.toBe(false);
    await expect(service.consume(second.token, "a-long-safe-password")).resolves.toBe(true);
    await expect(service.consume(second.token, "a-long-safe-password")).resolves.toBe(false);
  });
});

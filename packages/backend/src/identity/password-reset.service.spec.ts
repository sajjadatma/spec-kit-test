import { describe, expect, it } from "vitest";
import { PasswordResetService } from "./password-reset.service.js";
describe("PasswordResetService", () => { it("issues opaque reset tokens", async () => { let saved = ""; const service = new PasswordResetService({ issue: async (_id, tokenHash) => { saved = tokenHash; }, consume: async () => true }); const token = await service.issue("u"); expect(token).not.toBe(saved); expect(token.length).toBeGreaterThan(20); }); });

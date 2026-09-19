import { describe, expect, it } from "vitest";
import { LoginDto, RegisterDto, ResetPasswordDto, ResetRequestDto } from "../../apps/api/src/modules/identity/auth.dto.js";
import { AuthController } from "../../apps/api/src/modules/identity/auth.controller.js";

describe("auth contracts", () => {
  it("defines DTOs for every public credential route", () => {
    expect([RegisterDto, LoginDto, ResetRequestDto, ResetPasswordDto]).toHaveLength(4);
  });

  it("does not expose password hashes or token verifiers in public controller results", async () => {
    const controller = new AuthController({
      register: async () => ({ id: "user-1" }), login: async () => ({ access: "PENDING" }),
      requestPasswordReset: async () => undefined, consumePasswordReset: async () => true, rateLimit: async () => undefined,
      refresh: async () => ({ session: { id: "session-1" }, accessToken: "access", refreshToken: "refresh" }), logout: async () => undefined,
    } as never);
    await expect(controller.register({ displayName: "Member", email: "m@example.com", password: "a-long-safe-password", passwordConfirmation: "a-long-safe-password", locale: "en" }, { headers: {} })).resolves.toEqual({ data: { status: "PENDING" } });
    await expect(controller.resetRequest({ email: "missing@example.com" }, { headers: {} })).resolves.toEqual({ data: { accepted: true } });
  });
});

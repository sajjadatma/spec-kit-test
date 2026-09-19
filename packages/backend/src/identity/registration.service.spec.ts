import { describe, expect, it } from "vitest";
import { RegistrationService } from "./registration.service.js";

describe("RegistrationService", () => {
  it("normalizes email and creates only pending USER accounts", async () => {
    let received: Record<string, unknown> | undefined;
    const service = new RegistrationService({
      findByNormalizedEmail: async () => null,
      createPendingUser: async (data) => {
        received = data;
        return { id: "user-1", ...data };
      },
    });

    await service.register("  Member ", " Member@Example.com ", "a-long-safe-password", "fa");
    expect(received).toMatchObject({
      displayName: "Member", emailNormalized: "member@example.com", role: "USER", approval: "PENDING", locale: "fa",
    });
    expect(received?.passwordHash).not.toBe("a-long-safe-password");
  });

  it("rejects a duplicate normalized email without changing the existing account", async () => {
    const existing = { id: "user-1", displayName: "Member", email: "member@example.com", emailNormalized: "member@example.com", role: "USER" as const, approval: "PENDING" as const, locale: "en" as const };
    const service = new RegistrationService({
      findByNormalizedEmail: async () => existing,
      createPendingUser: async () => { throw new Error("must not create"); },
    });
    await expect(service.register("Another", " MEMBER@example.com ", "a-long-safe-password", "en")).rejects.toThrow("EMAIL_TAKEN");
    expect(existing.approval).toBe("PENDING");
  });
});

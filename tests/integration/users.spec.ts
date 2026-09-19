import { describe, expect, it } from "vitest";
import { UserManagementService } from "../../packages/backend/src/identity/user-management.service.js";

describe("account-management boundaries", () => {
  it("hides non-USER details from an ADMIN", async () => {
    const service = new UserManagementService({ user: { findUnique: async () => ({ id: "sa", role: "SUPER_ADMIN" }) } } as never);
    await expect(service.get({ id: "admin", role: "ADMIN" }, "sa")).rejects.toThrow("RECORD_NOT_FOUND");
  });
});

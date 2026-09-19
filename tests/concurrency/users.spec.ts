import { describe, expect, it } from "vitest";
import { UserManagementService } from "../../packages/backend/src/identity/user-management.service.js";

describe("last SUPER_ADMIN protection", () => {
  it("rejects disabling the sole enabled SUPER_ADMIN", async () => {
    const target = { id: "sa", role: "SUPER_ADMIN", disabledAt: null, approval: "APPROVED", revision: 1 };
    const tx = { governanceLock: { update: async () => undefined }, user: { findUnique: async () => target, count: async () => 0, updateMany: async () => ({ count: 1 }), findUniqueOrThrow: async () => ({ ...target, displayName: "SA", email: "sa@example.com", locale: "en", createdAt: new Date() }) }, auditEvent: { create: async () => undefined } };
    const prisma = { $transaction: async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx) };
    const service = new UserManagementService(prisma as never);
    await expect(service.setAccess({ id: "sa", role: "SUPER_ADMIN" }, "sa", true, 1)).rejects.toThrow("LAST_SUPER_ADMIN");
  });
});

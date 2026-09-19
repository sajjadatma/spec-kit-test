import { describe, expect, it } from "vitest";
import { UserManagementService } from "./user-management.service.js";

describe("UserManagementService", () => {
  it("scopes an ADMIN list to USER accounts before search and count", async () => {
    const captured: unknown[] = [];
    const prisma = { user: { findMany: (input: unknown) => { captured.push(input); return Promise.resolve([]); }, count: (input: unknown) => { captured.push(input); return Promise.resolve(0); } }, $transaction: (input: Promise<unknown>[]) => Promise.all(input) };
    const service = new UserManagementService(prisma as never);
    const result = await service.list({ id: "admin", role: "ADMIN" }, { q: "tile", page: 1, pageSize: 20 });
    expect(result.total).toBe(0);
    expect(captured).toHaveLength(2);
    expect(JSON.stringify(captured)).toContain('"role":"USER"');
  });

  it("never offers fixed-role inspection to ADMIN", () => {
    const service = new UserManagementService({} as never);
    expect(() => service.fixedRoles({ id: "admin", role: "ADMIN" })).toThrow("FORBIDDEN");
  });
});

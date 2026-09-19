import { describe, expect, it } from "vitest";
import { AccessDto, ApprovalDto, RoleDto, UserListQueryDto } from "../../apps/api/src/modules/identity/auth.dto.js";
import { UsersController } from "../../apps/api/src/modules/identity/users.controller.js";

describe("user-management route contracts", () => {
  const identity = { listUsers: async () => ({ items: [], total: 0 }), getUser: async () => ({ id: "u" }), setApproval: async () => ({ id: "u" }), setAccess: async () => ({ id: "u" }), setRole: async () => ({ id: "u" }), fixedRoles: () => [{ role: "USER", capabilities: [] }] };
  const actor = { id: "actor", role: "SUPER_ADMIN" as const };
  it("defines validated account route DTOs", () => expect([ApprovalDto, AccessDto, RoleDto, UserListQueryDto]).toHaveLength(4));
  it("uses revisions for all access-changing routes and exposes fixed roles only", async () => {
    const controller = new UsersController(identity as never);
    await expect(controller.approval({ user: actor }, "u", { decision: "APPROVED" }, '"4"')).resolves.toEqual({ data: { id: "u" } });
    await expect(controller.access({ user: actor }, "u", { disabled: true }, '"4"')).resolves.toEqual({ data: { id: "u" } });
    expect(controller.roles({ user: actor })).toEqual({ data: [{ role: "USER", capabilities: [] }] });
  });
});

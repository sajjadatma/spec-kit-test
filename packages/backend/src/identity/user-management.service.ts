import type { PrismaClient, Role } from "@prisma/client";

export type FixedRole = "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER";
export type Actor = { id: string; role: FixedRole };
export type UserSummary = { id: string; displayName: string; email: string; role: FixedRole; approval: "PENDING" | "APPROVED" | "REJECTED"; disabled: boolean; locale: "fa" | "en"; revision: number; createdAt: Date };
const roles: FixedRole[] = ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "USER"];
const select = { id: true, displayName: true, email: true, role: true, approval: true, disabledAt: true, locale: true, revision: true, createdAt: true } as const;
const summary = (user: { id: string; displayName: string; email: string; role: Role; approval: "PENDING" | "APPROVED" | "REJECTED"; disabledAt: Date | null; locale: "fa" | "en"; revision: number; createdAt: Date }): UserSummary => ({ ...user, role: user.role, disabled: Boolean(user.disabledAt) });

export class UserManagementService {
  constructor(private readonly prisma: PrismaClient) {}

  private assertManager(actor: Actor) { if (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN"); }
  private assertVisible(actor: Actor, target: { role: Role }) { this.assertManager(actor); if (actor.role === "ADMIN" && target.role !== "USER") throw new Error("RECORD_NOT_FOUND"); }
  private assertRevision(value: number | undefined): asserts value is number { if (value === undefined) throw new Error("REVISION_REQUIRED"); }

  async list(actor: Actor, options: { q?: string; approval?: "PENDING" | "APPROVED" | "REJECTED"; disabled?: boolean; page: number; pageSize: number }) {
    this.assertManager(actor);
    const where = {
      ...(actor.role === "ADMIN" ? { role: "USER" as const } : {}),
      ...(options.approval ? { approval: options.approval } : {}),
      ...(options.disabled === undefined ? {} : { disabledAt: options.disabled ? { not: null } : null }),
      ...(options.q ? { OR: [{ displayName: { contains: options.q, mode: "insensitive" as const } }, { email: { contains: options.q, mode: "insensitive" as const } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select, orderBy: [{ displayName: "asc" }, { email: "asc" }], skip: (options.page - 1) * options.pageSize, take: options.pageSize }),
      this.prisma.user.count({ where }),
    ]);
    return { items: items.map(summary), page: options.page, pageSize: options.pageSize, total };
  }

  async get(actor: Actor, id: string) {
    const target = await this.prisma.user.findUnique({ where: { id }, select });
    if (!target) throw new Error("RECORD_NOT_FOUND");
    this.assertVisible(actor, target);
    return summary(target);
  }

  async setApproval(actor: Actor, id: string, approval: "APPROVED" | "REJECTED", revision?: number) {
    this.assertRevision(revision);
    return this.mutate(actor, id, revision, "ACCOUNT_APPROVED", (target) => {
      this.assertVisible(actor, target);
      if (target.role !== "USER") throw new Error("FORBIDDEN");
      return { approval, authVersion: { increment: 1 } };
    }, approval === "APPROVED" ? "ACCOUNT_APPROVED" : "ACCOUNT_REJECTED");
  }

  async setAccess(actor: Actor, id: string, disabled: boolean, revision?: number) {
    this.assertRevision(revision);
    return this.mutate(actor, id, revision, disabled ? "ACCOUNT_DISABLED" : "ACCOUNT_ENABLED", (target, tx) => {
      this.assertVisible(actor, target);
      if (disabled && target.role === "SUPER_ADMIN" && !target.disabledAt) return this.ensureAnotherEnabledSuperAdmin(tx, target.id);
      return { disabledAt: disabled ? new Date() : null, authVersion: { increment: 1 } };
    });
  }

  async setRole(actor: Actor, id: string, role: FixedRole, revision?: number) {
    this.assertRevision(revision);
    if (actor.role !== "SUPER_ADMIN" || !roles.includes(role)) throw new Error("FORBIDDEN");
    return this.mutate(actor, id, revision, "ROLE_CHANGED", (target, tx) => {
      if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN" && !target.disabledAt) return this.ensureAnotherEnabledSuperAdmin(tx, target.id, { role, authVersion: { increment: 1 } });
      return { role, authVersion: { increment: 1 } };
    });
  }

  fixedRoles(actor: Actor) {
    if (actor.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
    return roles.map((role) => ({ role, capabilities: role === "SUPER_ADMIN" ? ["MANAGE_ROLES", "VIEW_ALL_HISTORY"] : role === "ADMIN" ? ["MANAGE_USER_ACCOUNTS"] : [] }));
  }

  private async mutate(actor: Actor, id: string, revision: number, action: "ACCOUNT_APPROVED" | "ACCOUNT_REJECTED" | "ACCOUNT_DISABLED" | "ACCOUNT_ENABLED" | "ROLE_CHANGED", changes: (target: { id: string; role: Role; disabledAt: Date | null }, tx: PrismaClient) => Promise<Record<string, unknown>> | Record<string, unknown>, auditAction = action) {
    return this.prisma.$transaction(async (tx) => {
      // Lock governance before a target so concurrent last-SA changes use one order.
      await tx.governanceLock.update({ where: { id: "governance" }, data: { revision: { increment: 1 } } });
      const target = await tx.user.findUnique({ where: { id }, select: { id: true, role: true, disabledAt: true, approval: true, revision: true } });
      if (!target) throw new Error("RECORD_NOT_FOUND");
      const data = await changes(target, tx as PrismaClient);
      const changed = await tx.user.updateMany({ where: { id, revision }, data: { ...data, revision: { increment: 1 } } });
      if (changed.count !== 1) throw new Error("REVISION_CONFLICT");
      const updated = await tx.user.findUniqueOrThrow({ where: { id }, select });
      await tx.auditEvent.create({ data: { actorId: actor.id, action: auditAction, targetType: "USER", targetIdentifier: id, before: { role: target.role, approval: target.approval, disabled: Boolean(target.disabledAt), revision: target.revision }, after: { role: updated.role, approval: updated.approval, disabled: Boolean(updated.disabledAt), revision: updated.revision } } });
      return summary(updated);
    });
  }

  private async ensureAnotherEnabledSuperAdmin(tx: PrismaClient, excludedId: string, result: Record<string, unknown> = {}) {
    const count = await tx.user.count({ where: { role: "SUPER_ADMIN", disabledAt: null, id: { not: excludedId } } });
    if (count < 1) throw new Error("LAST_SUPER_ADMIN");
    return result;
  }
}

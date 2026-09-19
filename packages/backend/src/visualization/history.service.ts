import type { PrismaClient } from "@prisma/client";
export type HistoryActor = { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" };
export class HistoryService {
  constructor(private readonly prisma: PrismaClient) {}
  async list(actor: HistoryActor, query: { page?: number; pageSize?: number; status?: "PREPARING" | "GENERATING" | "COMPLETED" | "FAILED"; ownerId?: string } = {}) {
    const page = Math.max(1, query.page ?? 1), pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const ownerId = actor.role === "SUPER_ADMIN" ? query.ownerId : actor.id;
    const where = { deletedAt: null, ...(ownerId ? { ownerId } : {}), ...(query.status ? { attempts: { some: { status: query.status } } } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.visualizationSession.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { attempts: { orderBy: { acceptedAt: "desc" }, include: { surfaces: true } } } }),
      this.prisma.visualizationSession.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}

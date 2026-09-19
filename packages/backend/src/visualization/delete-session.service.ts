import type { PrismaClient } from "@prisma/client";
import type { HistoryActor } from "./history.service.js";

/** Tombstones revoke history access before asynchronous binary cleanup. */
export class DeleteSessionService {
  constructor(private readonly prisma: PrismaClient) {}
  async delete(actor: HistoryActor, sessionId: string) {
    if (actor.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.visualizationSession.findUnique({ where: { id: sessionId }, include: { attempts: { select: { status: true } } } });
      if (!session || session.deletedAt) throw new Error("RECORD_NOT_FOUND");
      if (session.attempts.some((attempt) => attempt.status === "PREPARING" || attempt.status === "GENERATING")) throw new Error("SESSION_ACTIVE");
      await tx.visualizationSession.update({ where: { id: sessionId }, data: { deletedAt: new Date(), deletedById: actor.id } });
      return { id: sessionId, deleted: true };
    });
  }
}

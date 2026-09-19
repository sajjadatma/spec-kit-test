import type { PrismaClient } from "@prisma/client";
/** Deletes only tombstoned relational rows; binary cleanup is performed by the storage adapter worker. */
export async function cleanupDeletedSessions(prisma: PrismaClient) {
  const sessions = await prisma.visualizationSession.findMany({ where: { deletedAt: { not: null } }, select: { id: true } });
  for (const session of sessions) await prisma.generationAttempt.deleteMany({ where: { sessionId: session.id } });
  return sessions.length;
}

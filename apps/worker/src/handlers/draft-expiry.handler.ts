import type { PrismaClient } from "@prisma/client";

export async function expireRoomDrafts(prisma: PrismaClient, now = new Date()) {
  return prisma.roomDraft.deleteMany({ where: { expiresAt: { lte: now } } });
}

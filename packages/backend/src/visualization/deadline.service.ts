import type { PrismaClient } from "@prisma/client";
import type { Attempt } from "./attempt.service.js";

export function reconcileDeadline(attempt: Attempt, now = new Date()) {
  if (attempt.deadlineAt <= now && ["PREPARING", "GENERATING"].includes(attempt.status)) attempt.status = "FAILED";
  return attempt;
}

export class PersistentDeadlineService {
  constructor(private readonly prisma: PrismaClient) {}
  async reconcile(now = new Date()) {
    return this.prisma.generationAttempt.updateMany({
      where: { deadlineAt: { lte: now }, status: { in: ["PREPARING", "GENERATING"] } },
      data: { status: "FAILED", finishedAt: now, safeErrorCode: "GENERATION_TIMEOUT", revision: { increment: 1 } },
    });
  }
}

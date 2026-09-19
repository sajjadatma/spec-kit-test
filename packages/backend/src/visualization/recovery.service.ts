import type { PrismaClient } from "@prisma/client";

/** Safe startup repair: never re-dispatch an unknown paid provider request. */
export class GenerationRecoveryService {
  constructor(private readonly prisma: PrismaClient) {}
  async recover(now = new Date()) {
    const timedOut = await this.prisma.generationAttempt.updateMany({
      where: { deadlineAt: { lte: now }, status: { in: ["PREPARING", "GENERATING"] } },
      data: { status: "FAILED", finishedAt: now, safeErrorCode: "GENERATION_TIMEOUT", revision: { increment: 1 } },
    });
    const expiredLeases = await this.prisma.backgroundJob.updateMany({
      where: { status: "RUNNING", leaseUntil: { lte: now } },
      data: { status: "FAILED", safeErrorCode: "OUTCOME_UNKNOWN", leaseUntil: null },
    });
    return { timedOut: timedOut.count, expiredLeases: expiredLeases.count };
  }
}

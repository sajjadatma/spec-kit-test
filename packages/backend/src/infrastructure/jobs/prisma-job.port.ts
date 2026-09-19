import type { PrismaClient } from "@prisma/client";
import type { JobKind, JobPort, LeasedJob } from "./job-runner.js";

/** Database-backed leases prevent two workers from completing the same image job. */
export class PrismaJobPort implements JobPort {
  constructor(private readonly prisma: PrismaClient) {}
  async claim(kind: JobKind, workerId: string): Promise<LeasedJob | null> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + 60_000);
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.backgroundJob.findFirst({ where: { kind, OR: [{ status: "QUEUED" }, { status: "RUNNING", leaseUntil: { lt: now } }] }, orderBy: { createdAt: "asc" } });
      if (!job) return null;
      const claimed = await tx.backgroundJob.updateMany({ where: { id: job.id, OR: [{ status: "QUEUED" }, { status: "RUNNING", leaseUntil: { lt: now } }] }, data: { status: "RUNNING", workerId, leaseUntil, fencingToken: { increment: 1 }, attempts: { increment: 1 } } });
      if (!claimed.count) return null;
      const current = await tx.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
      return { id: current.id, kind, fencingToken: current.fencingToken };
    });
  }
  async heartbeat(job: LeasedJob): Promise<boolean> {
    const changed = await this.prisma.backgroundJob.updateMany({ where: { id: job.id, status: "RUNNING", fencingToken: job.fencingToken }, data: { leaseUntil: new Date(Date.now() + 60_000) } });
    return changed.count === 1;
  }
  async complete(job: LeasedJob, outcome: "SUCCEEDED" | "FAILED", safeErrorCode?: string): Promise<void> {
    const changed = await this.prisma.backgroundJob.updateMany({ where: { id: job.id, status: "RUNNING", fencingToken: job.fencingToken }, data: { status: outcome, leaseUntil: null, safeErrorCode: safeErrorCode ?? null } });
    if (!changed.count) throw new Error("JOB_FENCE_LOST");
  }
}

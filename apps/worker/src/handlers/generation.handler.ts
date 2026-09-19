import type { PrismaClient } from "@prisma/client";
import type { GenerationInput, ImageGenerationService, LeasedJob, StorageService } from "@industrial-dashboard/backend";

export async function runGeneration(service: ImageGenerationService, input: GenerationInput) {
  return service.generate(input);
}

/** Runs one fenced job. The caller supplies only already-authorized, private image bytes. */
export async function persistStoredGeneration(prisma: PrismaClient, storage: StorageService, job: LeasedJob, service: ImageGenerationService) {
  const record = await prisma.backgroundJob.findUnique({ where: { id: job.id }, include: { attempt: { include: { roomAsset: true, surfaces: { include: { asset: true } } } } } });
  const attempt = record?.attempt;
  if (!attempt) throw new Error("GENERATION_INPUT_UNAVAILABLE");
  const references = await Promise.all(attempt.surfaces.map(async (surface) => ({ surface: surface.surface as "FLOOR" | "WALL", image: await storage.get(surface.asset.storageKey) })));
  return persistGeneration(prisma, storage, job, service, { room: await storage.get(attempt.roomAsset.storageKey), references, deadline: attempt.deadlineAt });
}

export async function persistGeneration(
  prisma: PrismaClient, storage: StorageService, job: LeasedJob,
  service: ImageGenerationService, input: GenerationInput,
): Promise<"COMPLETED" | "FAILED"> {
  const record = await prisma.backgroundJob.findUnique({ where: { id: job.id }, include: { attempt: true } });
  if (!record?.attempt || record.status !== "RUNNING" || record.fencingToken !== job.fencingToken) throw new Error("JOB_FENCE_LOST");
  if (record.attempt.deadlineAt <= new Date()) {
    await prisma.generationAttempt.update({ where: { id: record.attempt.id }, data: { status: "FAILED", finishedAt: new Date(), safeErrorCode: "GENERATION_TIMEOUT", revision: { increment: 1 } } });
    return "FAILED";
  }
  await prisma.generationAttempt.update({ where: { id: record.attempt.id, status: "PREPARING" }, data: { status: "GENERATING", revision: { increment: 1 } } });
  const heartbeat = setInterval(() => {
    void prisma.backgroundJob.updateMany({ where: { id: job.id, status: "RUNNING", fencingToken: job.fencingToken }, data: { leaseUntil: new Date(Date.now() + 60_000) } });
  }, 15_000);
  try {
    const result = await service.generate(input);
    if (result.image.byteLength > 25 * 1024 * 1024) throw new Error("GENERATION_RESULT_INVALID");
    const key = `visualizations/${record.attempt.ownerId}/${record.attempt.id}.png`;
    await storage.put(key, result.image);
    const committed = await prisma.generationAttempt.updateMany({
      where: { id: record.attempt.id, status: "GENERATING", deadlineAt: { gt: new Date() } },
      data: { status: "COMPLETED", finishedAt: new Date(), resultStorageKey: key, resultMediaType: result.mediaType, revision: { increment: 1 } },
    });
    if (!committed.count) throw new Error("GENERATION_TIMEOUT");
    return "COMPLETED";
  } catch (error) {
    const code = error instanceof Error && error.message === "GENERATION_TIMEOUT" ? "GENERATION_TIMEOUT" : "GENERATION_FAILED";
    await prisma.generationAttempt.updateMany({ where: { id: record.attempt.id, status: { in: ["PREPARING", "GENERATING"] } }, data: { status: "FAILED", finishedAt: new Date(), safeErrorCode: code, revision: { increment: 1 } } });
    return "FAILED";
  } finally {
    clearInterval(heartbeat);
  }
}

import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export type AttemptStatus = "PREPARING" | "GENERATING" | "COMPLETED" | "FAILED";
export type Attempt = { id: string; ownerId: string; status: AttemptStatus; acceptedAt: Date; deadlineAt: Date; floorProductId?: string | undefined; wallProductId?: string | undefined };
type DraftForAttempt = { floorSelected: boolean; wallSelected: boolean; floorProductId?: string | undefined; wallProductId?: string | undefined; roomAssetId?: string | undefined };

const validate = (draft: DraftForAttempt) => {
  if ((draft.floorSelected && !draft.floorProductId) || (draft.wallSelected && !draft.wallProductId) || (!draft.floorSelected && !draft.wallSelected)) throw new Error("ATTEMPT_INVALID");
};

export class AttemptService {
  private readonly attempts = new Map<string, Attempt>();

  constructor(private readonly prisma?: PrismaClient) {}

  async submit(ownerId: string, draft: DraftForAttempt, consentVersion = "room-surfaces-v1"): Promise<Attempt> {
    validate(draft);
    if (consentVersion !== "room-surfaces-v1") throw new Error("CONSENT_REQUIRED");
    if (!this.prisma) {
      if ([...this.attempts.values()].some((a) => a.ownerId === ownerId && ["PREPARING", "GENERATING"].includes(a.status))) throw new Error("ATTEMPT_ACTIVE");
      const attempt: Attempt = { id: randomUUID(), ownerId, status: "PREPARING", acceptedAt: new Date(), deadlineAt: new Date(Date.now() + 600_000), floorProductId: draft.floorProductId, wallProductId: draft.wallProductId };
      this.attempts.set(attempt.id, attempt);
      return attempt;
    }
    return this.prisma.$transaction(async (tx) => {
      const active = await tx.generationAttempt.findFirst({ where: { ownerId, status: { in: ["PREPARING", "GENERATING"] } } });
      if (active) throw new Error("ATTEMPT_ACTIVE");
      const session = await tx.visualizationSession.create({ data: { ownerId } });
      if (!draft.roomAssetId) throw new Error("ROOM_IMAGE_REQUIRED");
      const selected = [["FLOOR", draft.floorProductId], ["WALL", draft.wallProductId]] as const;
      const references = [] as { surface: string; productId: string; assetId: string; productSnapshot: object }[];
      for (const [surface, productId] of selected) {
        if (!productId) continue;
        const product = await tx.product.findFirst({ where: { id: productId, active: true, archivedAt: null }, select: { primaryImageId: true, name: true, sku: true, widthMm: true, heightMm: true, material: true, finish: true, color: true, texture: true, floorCompatible: true, wallCompatible: true } });
        if (!product?.primaryImageId) throw new Error("PRODUCT_REFERENCE_REQUIRED");
        const image = await tx.productImage.findUnique({ where: { id: product.primaryImageId }, select: { assetId: true } });
        if (!image) throw new Error("PRODUCT_REFERENCE_REQUIRED");
        references.push({ surface, productId, assetId: image.assetId, productSnapshot: { name: product.name, sku: product.sku, widthMm: product.widthMm.toString(), heightMm: product.heightMm.toString(), material: product.material, finish: product.finish, color: product.color, texture: product.texture, floorCompatible: product.floorCompatible, wallCompatible: product.wallCompatible } });
      }
      const attempt = await tx.generationAttempt.create({ data: { id: randomUUID(), ownerId, sessionId: session.id, status: "PREPARING", deadlineAt: new Date(Date.now() + 600_000), consentVersion, consentAcceptedAt: new Date(), roomAssetId: draft.roomAssetId } });
      await tx.attemptSurface.createMany({ data: references.map((reference) => ({ attemptId: attempt.id, ...reference })) });
      await tx.product.updateMany({ where: { id: { in: references.map((reference) => reference.productId) } }, data: { everVisualized: true } });
      await tx.backgroundJob.create({ data: { kind: "image", attemptId: attempt.id } });
      return { id: attempt.id, ownerId, status: attempt.status, acceptedAt: attempt.acceptedAt, deadlineAt: attempt.deadlineAt, floorProductId: draft.floorProductId, wallProductId: draft.wallProductId };
    });
  }

  async get(ownerId: string, id: string): Promise<Attempt> {
    if (!this.prisma) {
      const attempt = this.attempts.get(id);
      if (!attempt || attempt.ownerId !== ownerId) throw new Error("RECORD_NOT_FOUND");
      if (attempt.deadlineAt <= new Date() && ["PREPARING", "GENERATING"].includes(attempt.status)) attempt.status = "FAILED";
      return attempt;
    }
    return this.prisma.generationAttempt.findFirst({ where: { id, ownerId } }).then(async (attempt) => {
      if (!attempt) throw new Error("RECORD_NOT_FOUND");
      if (attempt.deadlineAt <= new Date() && ["PREPARING", "GENERATING"].includes(attempt.status)) {
        await this.prisma!.generationAttempt.update({ where: { id }, data: { status: "FAILED", finishedAt: new Date(), safeErrorCode: "GENERATION_TIMEOUT", revision: { increment: 1 } } });
        attempt.status = "FAILED";
      }
      return { id: attempt.id, ownerId: attempt.ownerId, status: attempt.status, acceptedAt: attempt.acceptedAt, deadlineAt: attempt.deadlineAt };
    });
  }
}

import type { PrismaClient } from "@prisma/client";

export type RoomDraft = {
  ownerId: string;
  floorSelected: boolean;
  wallSelected: boolean;
  floorProductId?: string | undefined;
  wallProductId?: string | undefined;
  roomAssetId?: string | undefined;
  revision: number;
  expiresAt: Date;
};

type DraftInput = Omit<RoomDraft, "ownerId" | "revision" | "expiresAt">;

const virtualDraft = (ownerId: string): RoomDraft => ({
  ownerId, floorSelected: false, wallSelected: false, revision: 0,
  expiresAt: new Date(Date.now() + 86_400_000),
});

export class DraftService {
  private readonly drafts = new Map<string, RoomDraft>();

  constructor(private readonly prisma?: PrismaClient) {}

  get(ownerId: string): RoomDraft | Promise<RoomDraft> {
    if (!this.prisma) return this.drafts.get(ownerId) ?? virtualDraft(ownerId);
    return this.prisma.roomDraft.findUnique({ where: { ownerId } }).then((draft) => {
      if (!draft || draft.expiresAt <= new Date()) return virtualDraft(ownerId);
      return {
        ownerId: draft.ownerId, floorSelected: draft.floorSelected, wallSelected: draft.wallSelected,
        floorProductId: draft.floorProductId ?? undefined, wallProductId: draft.wallProductId ?? undefined, roomAssetId: draft.roomAssetId ?? undefined,
        revision: draft.revision, expiresAt: draft.expiresAt,
      };
    });
  }

  save(ownerId: string, input: DraftInput, revision: number): RoomDraft | Promise<RoomDraft> {
    if (!this.prisma) {
      const existing = this.drafts.get(ownerId) ?? virtualDraft(ownerId);
      if (existing.revision !== revision) throw new Error("REVISION_CONFLICT");
      const next = { ...input, ownerId, revision: revision + 1, expiresAt: new Date(Date.now() + 86_400_000) };
      this.drafts.set(ownerId, next);
      return next;
    }
    return this.prisma.roomDraft.upsert({
      where: { ownerId },
      create: { ownerId, ...input, floorProductId: input.floorProductId ?? null, wallProductId: input.wallProductId ?? null, roomAssetId: input.roomAssetId ?? null, revision: 1, expiresAt: new Date(Date.now() + 86_400_000) },
      update: {},
    }).then(async (existing) => {
      if (existing.revision !== revision) throw new Error("REVISION_CONFLICT");
      const changed = await this.prisma!.roomDraft.updateMany({
        where: { ownerId, revision },
        data: { ...input, floorProductId: input.floorProductId ?? null, wallProductId: input.wallProductId ?? null, roomAssetId: input.roomAssetId ?? null, revision: { increment: 1 }, expiresAt: new Date(Date.now() + 86_400_000) },
      });
      if (!changed.count) throw new Error("REVISION_CONFLICT");
      return this.get(ownerId) as Promise<RoomDraft>;
    });
  }

  discard(ownerId: string): void | Promise<void> {
    if (!this.prisma) { this.drafts.delete(ownerId); return; }
    return this.prisma.roomDraft.deleteMany({ where: { ownerId } }).then(() => undefined);
  }
}

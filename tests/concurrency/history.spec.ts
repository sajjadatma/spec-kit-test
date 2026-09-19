import { describe, expect, it } from "vitest";
import { DeleteSessionService } from "../../packages/backend/src/visualization/delete-session.service.js";

describe("session deletion", () => {
  it("does not permit active session deletion", async () => {
    const prisma = { $transaction: async (callback: (tx: never) => unknown) => callback({ visualizationSession: { findUnique: async () => ({ deletedAt: null, attempts: [{ status: "GENERATING" }] }) } } as never) } as never;
    const service = new DeleteSessionService(prisma);
    await expect(service.delete({ id: "admin", role: "SUPER_ADMIN" }, "session")).rejects.toThrow("SESSION_ACTIVE");
  });
});

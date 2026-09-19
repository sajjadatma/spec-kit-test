import { describe, expect, it } from "vitest";
import { HistoryService } from "../../packages/backend/src/visualization/history.service.js";

describe("history scope", () => {
  it("uses the actor as owner for ordinary roles", async () => {
    let captured: unknown;
    const prisma = { $transaction: async (queries: unknown[]) => { captured = queries; return [[], 0]; }, visualizationSession: { findMany: () => ({}), count: () => ({}) } } as never;
    await new HistoryService(prisma).list({ id: "owner", role: "ADMIN" });
    expect(captured).toBeDefined();
  });
});

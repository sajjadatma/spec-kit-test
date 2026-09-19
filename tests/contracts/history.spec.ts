import { describe, expect, it } from "vitest";
import { DeleteSessionService } from "../../packages/backend/src/visualization/delete-session.service.js";

describe("visualization history policy", () => {
  it("rejects deletion by a non-super-admin before reading persistence", async () => {
    const service = new DeleteSessionService({} as never);
    await expect(service.delete({ id: "actor", role: "ADMIN" }, "session")).rejects.toThrow("FORBIDDEN");
  });
});

import { describe, expect, it } from "vitest";
import { AttemptService } from "../../packages/backend/src/visualization/attempt.service.js";

describe("generation acceptance", () => {
  it("rejects a draft without a selected surface product", async () => {
    const attempts = new AttemptService();
    await expect(attempts.submit("owner", { floorSelected: true, wallSelected: false, roomAssetId: "room" })).rejects.toThrow("ATTEMPT_INVALID");
  });
  it("requires the current consent policy", async () => {
    const attempts = new AttemptService();
    await expect(attempts.submit("owner", { floorSelected: true, wallSelected: false, floorProductId: "product", roomAssetId: "room" }, "old-policy")).rejects.toThrow("CONSENT_REQUIRED");
  });
});

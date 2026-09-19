import { describe, expect, it } from "vitest";
import { AttemptService } from "../../packages/backend/src/visualization/attempt.service.js";

describe("generation active slot", () => {
  it("permits only one active attempt for an owner", async () => {
    const attempts = new AttemptService();
    const draft = { floorSelected: true, wallSelected: false, floorProductId: "product", roomAssetId: "room" };
    await attempts.submit("owner", draft);
    await expect(attempts.submit("owner", draft)).rejects.toThrow("ATTEMPT_ACTIVE");
  });
});

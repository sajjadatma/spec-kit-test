import { describe, expect, it } from "vitest";
import { DraftService } from "../../packages/backend/src/visualization/draft.service.js";

describe("generation draft contract", () => {
  it("returns a virtual draft without persisting it", async () => {
    const drafts = new DraftService();
    const draft = await drafts.get("owner");
    expect(draft).toMatchObject({ ownerId: "owner", revision: 0, floorSelected: false, wallSelected: false });
  });
  it("requires the caller revision for an update", async () => {
    const drafts = new DraftService();
    await drafts.save("owner", { floorSelected: true, wallSelected: false }, 0);
    expect(() => drafts.save("owner", { floorSelected: false, wallSelected: true }, 0)).toThrow("REVISION_CONFLICT");
  });
});

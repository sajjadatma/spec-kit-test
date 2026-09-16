import { describe, expect, it } from "vitest";
import type { ApiEnvelope, Currency, Role } from "@industrial-dashboard/contracts";

describe("public contracts", () => {
  it("exports only transport-safe values", () => {
    const envelope: ApiEnvelope<{ currency: Currency; role: Role }> = { data: { currency: "IRR", role: "USER" } };
    expect(envelope.data.currency).toBe("IRR");
  });
});

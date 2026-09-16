import { describe, expect, it } from "vitest";
import { assertSafeAuditValue } from "./audit.service.js";
describe("audit redaction", () => { it("rejects credential values", () => expect(() => assertSafeAuditValue({ passwordHash: "x" })).toThrow("UNSAFE_AUDIT_FIELD")); });

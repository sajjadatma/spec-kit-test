import { describe, expect, it } from "vitest";
import { normalizeEmail, validatePassword } from "../../packages/backend/src/identity/password.service.js";
describe("auth", () => { it("normalizes emails and rejects short passphrases", () => { expect(normalizeEmail(" A@EXAMPLE.COM ")).toBe("a@example.com"); expect(() => validatePassword("short")).toThrow(); }); });

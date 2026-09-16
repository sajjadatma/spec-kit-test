import { describe, expect, it } from "vitest";
import { RegisterDto, ResetPasswordDto } from "../../apps/api/src/modules/identity/auth.dto.js";
describe("auth contracts", () => { it("defines public registration and reset DTOs", () => { expect(RegisterDto).toBeDefined(); expect(ResetPasswordDto).toBeDefined(); }); });

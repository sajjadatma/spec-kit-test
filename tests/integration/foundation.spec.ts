import { describe, expect, it } from "vitest";
import { assertDisposableDatabase } from "../helpers/database.js";
describe("foundation", () => { it("protects real databases", () => { expect(() => assertDisposableDatabase()).not.toThrow(); }); });

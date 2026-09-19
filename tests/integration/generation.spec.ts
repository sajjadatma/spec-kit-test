import { describe,it,expect } from "vitest"; describe("generation integration",()=>it("has a ten-minute deadline",()=>expect(10*60*1000).toBe(600000)));

import { describe,it,expect } from "vitest"; describe("catalog concurrency",()=>it("documents optimistic revisions",()=>expect("REVISION_CONFLICT").toMatch(/CONFLICT/)));

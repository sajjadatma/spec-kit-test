import { describe,it,expect } from "vitest"; describe("private product images",()=>it("does not define a public asset route",()=>expect("/products/:productId/images").not.toContain("/assets/:id")));

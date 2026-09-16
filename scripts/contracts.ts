import { existsSync } from "node:fs";
if (!existsSync("packages/contracts/src/index.ts")) throw new Error("Public contract entrypoint is missing.");
console.info("Public contract entrypoint is present; OpenAPI route coverage is added with API modules.");

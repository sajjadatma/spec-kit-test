import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["apps/web/**/*.spec.ts?(x)", "packages/**/*.spec.ts", "tests/**/*.spec.ts"] } });

import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";
const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/test", WEB_ORIGIN: "http://localhost:3000", JWT_ACCESS_SECRET: "a".repeat(32), JWT_REFRESH_SECRET: "b".repeat(32), CSRF_SECRET: "c".repeat(32), TOKEN_HASH_SECRET: "d".repeat(32), IMAGE_PROVIDER: "fake", STORAGE_DRIVER: "local" };
describe("loadConfig", () => { it("rejects unsafe production defaults", () => expect(() => loadConfig({ ...base, NODE_ENV: "production" })).toThrow()); });

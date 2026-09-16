import { TEST_DATABASE_URL } from "./environment.js";
export function assertDisposableDatabase() { if (!TEST_DATABASE_URL.includes("_test")) throw new Error("Refusing to use a non-test database."); }
export async function resetDatabase() { assertDisposableDatabase(); }

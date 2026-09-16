export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://dashboard:dashboard@localhost:5432/industrial_dashboard_test";
if (!TEST_DATABASE_URL.includes("_test")) throw new Error("TEST_DATABASE_URL must target a dedicated test database.");

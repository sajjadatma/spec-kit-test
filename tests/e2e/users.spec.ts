import { expect, test } from "@playwright/test";
const baseUrl = process.env.E2E_WEB_ORIGIN ?? "http://127.0.0.1:3000";
test("unauthenticated visitors cannot open user management", async ({ page }) => { await page.goto(`${baseUrl}/users`); await expect(page).toHaveURL(/\/login/); });

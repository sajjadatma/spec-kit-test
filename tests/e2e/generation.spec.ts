import { expect, test } from "@playwright/test";

const email = "visualization@example.test";
const password = "Development-Only-Password-123!";
async function login(page: import("@playwright/test").Page) {
  await page.goto("http://localhost:3000/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/dashboard/);
}
test("visualization route requires an authorized session", async ({ page }) => { await page.goto("http://localhost:3000/visualization"); await expect(page).toHaveURL(/login/); });
test("approved user can open the visualization workspace", async ({ page }) => { await login(page); await page.goto("http://localhost:3000/visualization"); await expect(page.getByRole("heading", { name: "AI Visualization" })).toBeVisible(); await expect(page.getByText("I consent to use this room image for generation.")).toBeVisible(); await expect(page.getByRole("button", { name: "Generate" })).toBeDisabled(); });

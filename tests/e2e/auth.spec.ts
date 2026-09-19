import { expect, test } from "@playwright/test";

const baseUrl = process.env.E2E_WEB_ORIGIN ?? "http://127.0.0.1:3000";

test.describe("authentication", () => {
  test("registers a bilingual pending account without exposing credentials", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto(`${baseUrl}/register`);
    await page.getByLabel("Name").fill("E2E Member");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).first().fill("a-long-safe-password");
    await page.getByLabel("Password", { exact: true }).last().fill("a-long-safe-password");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Your account is awaiting administrator approval.")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("a-long-safe-password");
  });

  test("always shows a generic password recovery acknowledgement", async ({ page }) => {
    await page.goto(`${baseUrl}/forgot-password`);
    await page.getByLabel("Email").fill(`missing-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("If an account exists, recovery instructions will be sent.")).toBeVisible();
  });

  test("switches the registration form to Persian", async ({ page }) => {
    await page.goto(`${baseUrl}/register`);
    await page.getByRole("button", { name: "Switch to Persian" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByLabel("ایمیل")).toBeVisible();
  });

  test("keeps an expired reset attempt on the recovery screen and does not sign in", async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=expired-token`);
    await expect(page.getByLabel("Reset token")).toHaveValue("expired-token");
    await page.getByLabel("Password", { exact: true }).first().fill("a-long-safe-password");
    await page.getByLabel("Password", { exact: true }).last().fill("a-long-safe-password");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/reset-password/);
    await expect(page.getByText("We could not complete that request.")).toBeVisible();
  });

  test("shows the generic recovery acknowledgement in Persian", async ({ page }) => {
    await page.goto(`${baseUrl}/forgot-password`);
    await page.getByRole("button", { name: "Switch to Persian" }).click();
    await page.getByLabel("ایمیل").fill(`missing-fa-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "ادامه" }).click();
    await expect(page.getByText("اگر حسابی وجود داشته باشد، دستور بازیابی ارسال می‌شود.")).toBeVisible();
  });
});

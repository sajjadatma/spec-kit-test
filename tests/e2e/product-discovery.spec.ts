import { test,expect } from "@playwright/test"; test("catalog route is protected",async({page})=>{await page.goto("http://localhost:3000/products");await expect(page).toHaveURL(/login/);});

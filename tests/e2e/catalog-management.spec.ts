import { test,expect } from "@playwright/test"; test("product entry page is protected",async({page})=>{await page.goto("http://localhost:3000/products/new");await expect(page).toHaveURL(/login/);});

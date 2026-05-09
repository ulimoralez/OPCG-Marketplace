import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("has search bar that accepts input", async ({ page }) => {
    await page.goto("/");
    const searchBar = page.getByPlaceholder(/buscar/i);
    await expect(searchBar).toBeVisible();
    await searchBar.fill("Luffy");
    await searchBar.press("Enter");
    await expect(page).toHaveURL(/\/search\?.*q=Luffy/);
  });

  test("shows quick-access expansion buttons linking to /search", async ({ page }) => {
    await page.goto("/");
    const op01Button = page.getByRole("link", { name: /OP01/i }).first();
    await expect(op01Button).toBeVisible();
    await op01Button.click();
    await expect(page).toHaveURL(/\/search\?.*set=OP01/);
  });

  test("register CTA redirects to /register", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});

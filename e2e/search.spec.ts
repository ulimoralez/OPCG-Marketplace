import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test("loads search page with filter controls", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: /resultados|publicaciones/i })).toBeVisible();
    await expect(page.getByText("Expansión")).toBeVisible();
    await expect(page.getByText("Color")).toBeVisible();
  });

  test("search bar navigates to /search with q param", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/buscar/i).fill("Luffy");
    await page.getByPlaceholder(/buscar/i).press("Enter");
    await expect(page).toHaveURL(/\/search\?.*q=Luffy/);
  });

  test("expansion filter updates URL", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: "OP01" }).first().click();
    await expect(page).toHaveURL(/set=OP01/);
  });
});

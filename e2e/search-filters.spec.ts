import { test, expect } from "@playwright/test";

test.describe("Search filters", () => {
  test("color filter button updates URL with ?color= param", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: "Rojo" }).click();
    await expect(page).toHaveURL(/color=Red/);
  });

  test("price min/max filters update URL params", async ({ page }) => {
    await page.goto("/search");
    await page.getByPlaceholder("Mín").fill("500");
    await expect(page).toHaveURL(/price_min=500/);
    await page.getByPlaceholder("Máx").fill("5000");
    await expect(page).toHaveURL(/price_max=5000/);
  });

  test("clear filters button removes all filter params", async ({ page }) => {
    await page.goto("/search?set=OP01&color=Red");
    await page.getByRole("button", { name: /limpiar filtros/i }).click();
    await expect(page).not.toHaveURL(/set=/);
    await expect(page).not.toHaveURL(/color=/);
  });
});

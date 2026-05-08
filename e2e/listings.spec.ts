import { test, expect } from "@playwright/test";

test.describe("OPTCG API proxy", () => {
  test("returns card data for valid card ID", async ({ request }) => {
    const response = await request.get("/api/cards/OP01-001");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("cardId", "OP01-001");
    expect(data).toHaveProperty("cardName");
    expect(data).toHaveProperty("cardImageUrl");
    expect(data).toHaveProperty("setCode");
    expect(Array.isArray(data.colors)).toBe(true);
  });

  test("returns 404 for invalid card ID", async ({ request }) => {
    const response = await request.get("/api/cards/INVALID-000");
    expect(response.status()).toBe(404);
  });
});

test.describe("Listing detail", () => {
  test("shows 404 page for non-existent listing", async ({ page }) => {
    await page.goto("/listings/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText(/not found|no encontrada/i)).toBeVisible();
  });
});

test.describe("Homepage", () => {
  test("loads homepage with expansion grid", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Marketplace de One Piece TCG")).toBeVisible();
    await expect(page.getByText("OP01")).toBeVisible();
    await expect(page.getByText("OP09")).toBeVisible();
  });
});

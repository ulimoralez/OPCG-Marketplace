import { test, expect } from "@playwright/test";

test.describe("Auth redirect", () => {
  test("redirects unauthenticated user from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated user from /settings to /login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("home page is publicly accessible", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });
});

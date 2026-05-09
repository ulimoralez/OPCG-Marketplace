import { test, expect } from "@playwright/test";

test.describe("Register page", () => {
  test("renders all form fields and submit button", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("has link to sign in page", async ({ page }) => {
    await page.goto("/register");
    // Use the in-page link, not the header button (both exist)
    await page.getByRole("paragraph").getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("rejects password shorter than 8 characters via HTML5 validation", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Username").fill("testuser");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    // HTML5 minLength prevents submission — URL stays on /register
    await expect(page).toHaveURL(/\/register/);
  });
});

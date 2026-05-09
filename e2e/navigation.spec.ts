import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("header shows logo and auth links for guests", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("OPTCG")).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /register/i })).toBeVisible();
  });

  test("all protected routes redirect unauthenticated users to /login", async ({
    page,
  }) => {
    const protectedRoutes = [
      "/dashboard",
      "/settings",
      "/messages",
      "/listings/new",
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page, `${route} should redirect to /login`).toHaveURL(
        /\/login/
      );
    }
  });

  test("login page has link to register", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    // Use the in-page link, not the header button (both exist)
    await expect(page.getByRole("paragraph").getByRole("link", { name: "Register" })).toBeVisible();
  });
});

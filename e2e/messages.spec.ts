import { test, expect } from "@playwright/test";

test.describe("Messages (unauthenticated)", () => {
  test("redirects unauthenticated user from /messages to /login", async ({
    page,
  }) => {
    await page.goto("/messages");
    await expect(page).toHaveURL(/\/login/);
  });
});

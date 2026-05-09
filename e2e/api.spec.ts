import { test, expect } from "@playwright/test";

test.describe("OPTCG Card API", () => {
  test("returns normalized card data for a valid card ID", async ({ request }) => {
    const res = await request.get("/api/cards/OP01-001");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toMatchObject({
      cardId: "OP01-001",
      setCode: "OP01",
    });
    expect(data.cardName).toBeTruthy();
    expect(data.cardImageUrl).toBeTruthy();
    expect(Array.isArray(data.colors)).toBe(true);
  });

  test("returns 404 for a non-existent card ID", async ({ request }) => {
    const res = await request.get("/api/cards/XX99-999");
    expect(res.status()).toBe(404);
  });

  test("strips hyphen from set ID in response (OP-01 → OP01)", async ({ request }) => {
    const res = await request.get("/api/cards/OP02-001");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.setCode).toBe("OP02");
    expect(data.setCode).not.toContain("-");
  });
});

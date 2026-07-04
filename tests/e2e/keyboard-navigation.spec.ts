import { expect, test } from "@playwright/test";

test("calendar selection moves with keyboard arrows", async ({ page }) => {
  await page.goto("/calendar");

  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  const selected = page.locator('button[aria-pressed="true"]').first();
  const before = await selected.getAttribute("aria-label");

  await selected.press("ArrowRight");

  await expect.poll(async () => page.locator('button[aria-pressed="true"]').first().getAttribute("aria-label")).not.toBe(before);
});

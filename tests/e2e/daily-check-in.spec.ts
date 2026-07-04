import { expect, test } from "@playwright/test";

test("daily check-in can complete enough habits to reach Good", async ({ page }) => {
  await page.goto("/tracker");

  await expect(page.getByRole("heading", { name: "Weekly quest board" })).toBeVisible();
  const checkboxes = page.getByRole("checkbox");
  await expect(checkboxes.first()).toBeVisible();

  for (let index = 0; index < 6; index += 1) {
    await checkboxes.nth(index).check();
  }

  await expect(page.getByText("Good").first()).toBeVisible();
});

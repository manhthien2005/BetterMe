import { expect, test } from "@playwright/test";

test("habit check-in survives a page reload through local storage", async ({ page }) => {
  await page.goto("/tracker");

  const wakeHabit = page.getByRole("checkbox", { name: "Wake up on time" });
  await expect(wakeHabit).toBeVisible();
  await wakeHabit.check();
  await expect(wakeHabit).toBeChecked();

  await page.reload();

  await expect(page.getByRole("checkbox", { name: "Wake up on time" })).toBeChecked();
});

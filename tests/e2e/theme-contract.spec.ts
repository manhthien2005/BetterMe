import { expect, test } from "@playwright/test";

test("theme preference updates semantic theme runtime", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  const settings = page.getByRole("region", { name: "Settings" });
  await settings.getByLabel("Theme", { exact: true }).selectOption("minimal-calm");
  await settings.getByRole("button", { name: "Save settings" }).click();

  await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.theme)).toBe("minimal-calm");
  await expect(page.getByRole("complementary", { name: "Theme preview" })).toContainText("Minimal Calm");
});

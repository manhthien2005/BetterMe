import { expect, test } from "@playwright/test";

test("redirects legacy dashboard route to English by default", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.documentElement.lang)).toBe("en");
});

test("renders Vietnamese locale routes and locale-aware navigation", async ({ page }) => {
  await page.goto("/vi/dashboard");

  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Theo dõi" })).toHaveAttribute("href", "/vi/tracker");
  await expect.poll(async () => page.evaluate(() => document.documentElement.lang)).toBe("vi");
});

test("remembers explicit language selection", async ({ page }) => {
  await page.goto("/en/settings");

  await page.getByTestId("language-switcher").selectOption("vi");

  await expect(page).toHaveURL(/\/vi\/settings$/);
  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible();

  await page.goto("/settings");

  await expect(page).toHaveURL(/\/vi\/settings$/);
});

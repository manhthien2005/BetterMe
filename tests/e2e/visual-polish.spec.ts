import { expect, test } from "@playwright/test";

test("dashboard uses the themed component layout instead of raw document flow", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const headerStyles = await page.locator(".app-shell__header").evaluate(readCoreStyles);
  expect(headerStyles.display).toBe("flex");
  expect(headerStyles.paddingTop).not.toBe("0px");

  const navStyles = await page.locator(".app-navigation").evaluate(readCoreStyles);
  expect(navStyles.display).toBe("flex");
  expect(navStyles.gap).not.toBe("normal");

  const metricsStyles = await page.locator(".dashboard-overview__metrics").evaluate(readCoreStyles);
  expect(metricsStyles.display).toBe("grid");
  expect(metricsStyles.gap).not.toBe("normal");

  const cardStyles = await page.locator(".chart-card").first().evaluate(readCoreStyles);
  expect(cardStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(cardStyles.borderRadius).not.toBe("0px");
  expect(cardStyles.paddingTop).not.toBe("0px");

  const motivationStyles = await page.locator(".motivation-card").evaluate(readCoreStyles);
  expect(motivationStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(motivationStyles.borderRadius).not.toBe("0px");
});

function readCoreStyles(element: Element) {
  const styles = window.getComputedStyle(element);

  return {
    backgroundColor: styles.backgroundColor,
    borderRadius: styles.borderRadius,
    display: styles.display,
    gap: styles.gap,
    paddingTop: styles.paddingTop
  };
}

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home renders without console errors or a11y violations", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("admin is reachable", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.ok()).toBe(true);
});

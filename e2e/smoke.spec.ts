import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home renders without console errors or a11y violations", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    // Ignore the dev-only Reticle bridge when its local daemon is not running.
    if (msg.type() === "error" && !/localhost:\d+\/reticle/.test(msg.text()))
      errors.push(msg.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    // Reticle's dev-only overlay is not part of the site (absent in production builds).
    .exclude('[class*="reticle-"]')
    .analyze();
  expect(
    violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => `${n.target.join(" ")} ${n.html}`).join(" | ")}`,
    ),
  ).toEqual([]);
  expect(errors).toEqual([]);
});

test("admin is reachable", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.ok()).toBe(true);
});

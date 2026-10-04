import { expect, test } from "@playwright/test";

import { hideDevOverlays } from "./_admin";

// A content page shows its CMS text and the pages below it as cards. Content from
// scripts/seed-data.ts.

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
});

test("/ueber-uns shows its text and leads to the page below it", async ({ page }) => {
  await page.goto("/ueber-uns");
  await expect(page.getByRole("heading", { level: 1, name: "Über uns" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Wer wir sind" })).toBeVisible();
  const more = page.getByRole("region", { name: "Weiterlesen" });
  await more.getByRole("link", { name: "Arbeitsweise" }).click();
  await expect(page).toHaveURL(/\/ueber-uns\/arbeitsweise$/);
  // A nested page shows the trail back to its parent.
  await expect(
    page.getByRole("navigation", { name: "Brotkrumen" }).getByRole("link", { name: "Über uns" }),
  ).toBeVisible();
});

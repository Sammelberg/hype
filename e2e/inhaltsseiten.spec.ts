import { expect, test } from "@playwright/test";

import { hideDevOverlays } from "./_admin";

// Content pages lay their text out in parts, one per h2 of the CMS text; a page without parts of
// its own is an overview whose child pages are its body. Content from scripts/seed-data.ts.

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
});

test("/ueber-uns shows its text in parts and points onward", async ({ page }) => {
  await page.goto("/ueber-uns");
  for (const name of ["Wer hinter Schwarzwald Systems steht", "Wie wir arbeiten", "Weiterlesen"]) {
    const heading = page.getByRole("heading", { level: 2, name });
    await expect(heading).toBeVisible();
    // Each part is a region named by its heading.
    await expect(page.getByRole("region", { name })).toBeVisible();
  }
  await page
    .getByRole("region", { name: "Weiterlesen" })
    .getByRole("link", { name: "Unsere Arbeitsweise" })
    .click();
  await expect(page).toHaveURL(/\/ueber-uns\/arbeitsweise$/);
  await expect(page.getByRole("heading", { level: 2, name: "1. Verstehen" })).toBeVisible();
});

test("/branchen lists its pages as its body", async ({ page }) => {
  await page.goto("/branchen");
  const list = page.getByRole("list", { name: "Branchen" });
  await expect(list.getByRole("heading", { level: 2, name: "Handwerk" })).toBeVisible();
  await list.getByRole("link", { name: "Handwerk" }).click();
  await expect(page).toHaveURL(/\/branchen\/handwerk$/);
  await expect(
    page.getByRole("main").getByRole("link", { name: "Meistrum für Krone Parkett" }),
  ).toHaveAttribute("href", "/projekte/meistrum-krone-parkett");
});

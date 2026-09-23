import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { SEED_REDIRECT } from "../scripts/seed-data";

// Needs `pnpm seed` (redirect, search index, contact form).

// In dev, Reticle overlays (dev tooling, not part of the site) can appear mid-test and
// swallow clicks. Hide it; production builds (CI) never load it.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent =
        "[data-reticle-tour], [data-reticle-overlay] { display: none !important; }";
      document.head.append(style);
    });
  });
});

test("a redirect from the admin leads to its target", async ({ page }) => {
  await page.goto(SEED_REDIRECT.from);
  await expect(page).toHaveURL(new RegExp(`/projekte/${SEED_REDIRECT.toProject}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Stadtmuseum Freiburg");
});

test("search finds a project by a word from its summary", async ({ page }) => {
  await page.goto("/suche");
  const field = page.getByLabel("Suchbegriff");
  await field.fill("Genossenschaft");
  await field.press("Enter");
  await expect(page).toHaveURL(/\/suche\?q=Genossenschaft/);
  await expect(page.getByRole("heading", { name: /Ergebnis/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Energiegenossenschaft Kinzigtal" })).toBeVisible();
});

test("search says so when nothing matches", async ({ page }) => {
  await page.goto("/suche?q=xylophon");
  await expect(
    page.getByRole("heading", { name: "Keine Ergebnisse für „xylophon“" }),
  ).toBeVisible();
});

test.describe("contact form", () => {
  test("explains missing fields and focuses the first one", async ({ page }) => {
    await page.goto("/kontakt");
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    const name = page.getByLabel("Name");
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Bitte füllen Sie dieses Feld aus.")).toHaveCount(3);
  });

  test("sends a message and confirms it", async ({ page }) => {
    await page.goto("/kontakt");
    await page.getByLabel("Name").fill("Erika Test");
    await page.getByLabel("E-Mail").fill("erika@example.com");
    await page.getByLabel("Nachricht").fill("Automatischer Test aus e2e/features.spec.ts.");
    // Stay above the minimum fill time of the spam filter (lib/contact.ts).
    await page.waitForTimeout(3100);
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect(page.getByRole("status")).toContainText("Vielen Dank für Ihre Nachricht");
  });
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });

  for (const path of ["/", "/kontakt", `/projekte/${SEED_REDIRECT.toProject}`]) {
    test(`${path} has no a11y violations in dark mode`, async ({ page }) => {
      await page.goto(path);
      // The dark tokens must actually apply: the page background is not the light one.
      const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(background).not.toMatch(/^(rgb\(255, 255, 255\)|oklch\(1 0 0\))$/);
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude('[class*="reticle-"]')
        .analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
    });
  }
});

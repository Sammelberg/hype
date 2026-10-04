import { expect, test } from "@playwright/test";

import { E2E_EMAIL, SEED_REDIRECT } from "../scripts/seed-data";

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
  await expect(page).toHaveURL(new RegExp(`${SEED_REDIRECT.toPath}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Über uns");
});

test("search finds a page by a word from its title", async ({ page }) => {
  await page.goto("/suche");
  const field = page.getByLabel("Suchbegriff");
  await field.fill("Datenschutz");
  await field.press("Enter");
  await expect(page).toHaveURL(/\/suche\?q=Datenschutz/);
  await expect(page.getByRole("heading", { name: /Ergebnis/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Datenschutzerklärung" })).toBeVisible();
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
    await page.getByLabel("E-Mail").fill(E2E_EMAIL);
    await page.getByLabel("Nachricht").fill("Automatischer Test aus e2e/features.spec.ts.");
    // Stay above the minimum fill time of the spam filter (src/app/(frontend)/kontakt/_lib/validation.ts).
    await page.waitForTimeout(3100);
    await page.getByRole("button", { name: "Nachricht senden" }).click();
    await expect(page.getByRole("status")).toContainText("Vielen Dank für Ihre Nachricht");
  });
});

test("pages without a CMS image share their own drawn preview", async ({ page, request }) => {
  for (const path of ["/ueber-uns", "/ueber-uns/arbeitsweise", "/projekte"]) {
    await page.goto(path);
    const url = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(url).toMatch(new RegExp(`/vorschaubild${path}$`));
    const response = await request.get(new URL(url!).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  }
  expect((await request.get("/vorschaubild/gibt-es-nicht")).status()).toBe(404);
});

test("search finds a word from deep inside a page, not only its title", async ({ page }) => {
  await page.goto("/suche?q=Elternseite");
  const results = page.getByRole("region", { name: /Ergebnis/ });
  await expect(results.getByRole("link", { name: "Arbeitsweise" })).toBeVisible();
});

test("a project in the overview opens its own page", async ({ page }) => {
  await page.goto("/projekte");
  const first = page.getByRole("list", { name: "Projekte" }).getByRole("link").first();
  // The seed brings no projects (real ones are entered in /admin); a fresh database has none.
  test.skip((await first.count()) === 0, "no project in this database");
  const title = await first.innerText();
  await first.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.getByRole("navigation", { name: "Brotkrumen" })).toContainText("Projekte");
});

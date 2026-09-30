import { expect, test } from "@playwright/test";

import { hideDevOverlays, signIn } from "./_admin";

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
});

// The editor's account: the site's content, not the office, the accounts or the log.
test("an editor works on the site, but the office and the accounts stay closed", async ({
  page,
}) => {
  // Five admin screens compiled on first visit in dev.
  test.setTimeout(90_000);
  await signIn(page, "redakteur");
  const nav = page.getByRole("navigation", { name: "Bereiche" });
  for (const label of ["Seiten", "Projekte", "Anfragen", "Medien", "Website", "Weiterleitungen"])
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
  for (const label of ["Kunden", "Rechnungen", "Firmendaten", "Benutzer"])
    await expect(nav.getByRole("link", { name: label, exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Büro" })).toHaveCount(0);

  await page.goto("/admin/seiten");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seiten");

  // Typed in by hand, the admin's pages do not exist for this account.
  for (const path of ["/admin/rechnungen", "/admin/kunden", "/admin/benutzer", "/admin/firma"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
  // And the office's data does not come out through a route either.
  const xml = await page.request.get("/admin/rechnungen/1/xrechnung");
  expect(xml.status()).toBe(401);
  expect(await xml.text()).toBe("Dafür fehlt Ihrem Zugang die Berechtigung.");
});

test("an admin sees the office and the accounts", async ({ page }) => {
  await signIn(page);
  const nav = page.getByRole("navigation", { name: "Bereiche" });
  for (const label of ["Kunden", "Rechnungen", "Benutzer"])
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { hideDevOverlays, signIn } from "./_admin";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
});

test("a wrong password and an unknown address get the same answer", async ({ page }) => {
  await page.goto("/admin/login");
  test.skip(
    page.url().includes("/admin/einrichtung"),
    "no account yet: the setup page comes first",
  );
  await page.getByLabel("E-Mail-Adresse").fill("niemand@example.com");
  await page.getByLabel("Passwort").fill("falsches-passwort-123");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Passwort/ })).toHaveText(
    "E-Mail-Adresse oder Passwort ist falsch.",
  );
});

test("the admin signs in, reaches every section and signs out", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Guten (Morgen|Tag|Abend)/);

  const nav = page.getByRole("navigation", { name: "Bereiche" });
  for (const label of [
    "Seiten",
    "Projekte",
    "Anfragen",
    "Medien",
    "Website",
    "Kontaktformular",
    "Weiterleitungen",
    "Benutzer",
  ]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  await nav.getByRole("link", { name: "Seiten" }).click();
  await expect(page).toHaveURL(/\/admin\/seiten$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seiten");

  // ⌘K opens the palette; a section is one keystroke away.
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog");
  await expect(palette).toBeVisible();
  await palette.getByPlaceholder(/Wohin/).fill("Weiterl");
  await expect(palette.getByRole("option", { name: "Weiterleitungen" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/admin\/weiterleitungen$/);

  await page.getByRole("button", { name: "Konto und Darstellung" }).click();
  await page.getByRole("menuitem", { name: "Abmelden" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin/seiten");
  await expect(page).toHaveURL(/\/admin\/login\?weiter=/);
});

test("the setup page is closed once an account exists", async ({ page }) => {
  await signIn(page);
  const response = await page.goto("/admin/einrichtung");
  expect(response?.status()).toBe(404);
});

// WCAG 2 AA on the admin's own screens, signed in; the login page without a session.
test("the admin's screens have no accessibility violations", async ({ page }) => {
  // Eleven screens, each compiled on first visit in dev and scanned by axe.
  test.setTimeout(120_000);
  const check = async (path: string) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Entrances fade in; axe measures the settled colours.
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude('[class*="reticle-"]')
      .analyze();
    expect(
      violations.map(
        (v) => `${path} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
      ),
    ).toEqual([]);
  };
  await signIn(page);
  for (const path of [
    "/admin",
    "/admin/seiten",
    "/admin/seiten/neu",
    "/admin/projekte",
    "/admin/einstellungen",
    "/admin/medien",
    "/admin/weiterleitungen",
    "/admin/formular",
    "/admin/anfragen",
    "/admin/benutzer",
  ]) {
    await check(path);
  }
  await page.getByRole("button", { name: "Konto und Darstellung" }).click();
  await page.getByRole("menuitem", { name: "Abmelden" }).click();
  await check("/admin/login");
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { hideDevOverlays, signIn } from "./_admin";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
});

test("a wrong password and an unknown address get the same answer", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-Mail-Adresse").fill("niemand@example.com");
  await page.getByLabel("Passwort").fill("falsches-passwort-123");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Passwort/ })).toHaveText(
    "E-Mail-Adresse oder Passwort ist falsch.",
  );
});

test("one address gets twenty sign-in attempts in ten minutes, then waits", async ({ browser }) => {
  // Twenty password checks, argon2id each: slow on purpose.
  test.setTimeout(120_000);
  // Its own address (TEST-NET-3), so the limit it reaches blocks nobody else.
  const address = `203.0.113.${1 + Math.floor(Math.random() * 254)}`;
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": address } });
  const page = await context.newPage();
  await hideDevOverlays(page);
  await page.goto("/admin/login");
  // The form clears the password after every answer; fill it again only once that has happened,
  // or the reset lands after the fill and the empty required field blocks the next submit.
  const password = page.getByLabel("Passwort");
  const attempt = async () => {
    await page.getByLabel("E-Mail-Adresse").fill("niemand@example.com");
    await password.fill("falsches-passwort-123");
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST"),
      page.getByRole("button", { name: "Anmelden" }).click(),
    ]);
    await expect(password).toHaveValue("");
  };
  for (let i = 0; i < 20; i++) await attempt();
  await expect(page.getByRole("alert").filter({ hasText: /Passwort/ })).toBeVisible();
  await attempt();
  await expect(page.getByRole("alert").filter({ hasText: /Zu viele Versuche/ })).toBeVisible();
  await context.close();
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
    "Kunden",
    "Angebote",
    "Aufträge",
    "Verträge",
    "Kalender",
    "Wiedervorlagen",
    "Rechnungen",
    "Offene Posten",
    "Steuerberater",
    "Firmendaten",
    "Website",
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

test("there is no setup page: the first account comes from the shell", async ({ page }) => {
  await signIn(page);
  const response = await page.goto("/admin/einrichtung");
  expect(response?.status()).toBe(404);
});

// WCAG 2 AA on the admin's own screens, signed in; the login page without a session.
test("the admin's screens have no accessibility violations", async ({ page }) => {
  // Every screen, and the section editors of each kind of page, each compiled on first visit in
  // dev and scanned by axe.
  test.setTimeout(180_000);
  const check = async (path: string) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Entrances fade in, some only once scrolled into view (the overview's charts): scroll
    // through the page first, so axe measures the settled colours everywhere.
    await page.evaluate(async () => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((r) => setTimeout(r, 400));
      window.scrollTo(0, 0);
    });
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude('[class*="reticle-"]')
      // Reticle's dev overlays inside the preview frame (the site itself is scanned by smoke).
      .exclude(['iframe[title^="Vorschau"]', '[class*="reticle-"]'])
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
    "/admin/seiten/reihenfolge",
    "/admin/projekte",
    "/admin/einstellungen",
    "/admin/medien",
    "/admin/weiterleitungen",
    "/admin/formular",
    "/admin/anfragen",
    "/admin/benutzer",
    "/admin/protokoll",
    "/admin/kunden",
    "/admin/kunden/neu",
    "/admin/angebote",
    "/admin/angebote/neu",
    "/admin/wiedervorlagen",
    "/admin/kalender",
    "/admin/kalender?ansicht=woche",
    "/admin/kalender?ansicht=liste",
    "/admin/auftraege",
    "/admin/auftraege/neu",
    "/admin/vertraege",
    "/admin/vertraege/neu",
    "/admin/rechnungen",
    "/admin/rechnungen/neu",
    "/admin/offene-posten",
    "/admin/steuerberater",
    "/admin/firma",
    "/admin/email-versand",
  ]) {
    await check(path);
  }
  // One editor per kind of page: home, Projekte, Kontakt, a content page.
  await page.goto("/admin/seiten");
  for (const title of ["Startseite", "Projekte", "Kontakt", "Über uns"]) {
    const href = await page
      .getByRole("main")
      .getByRole("link", { name: title, exact: true })
      .first()
      .getAttribute("href");
    await check(href!);
    await page.goto("/admin/seiten");
  }
  await page.getByRole("button", { name: "Konto und Darstellung" }).click();
  await page.getByRole("menuitem", { name: "Abmelden" }).click();
  await check("/admin/login");
  await check("/admin/passwort-vergessen");
  await check("/admin/passwort-vergessen/kein-gueltiger-link");
});

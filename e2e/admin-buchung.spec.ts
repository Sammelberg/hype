import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { hideDevOverlays, signIn } from "./_admin";

// The booking admin (stammdaten, week plan, bookings): every screen without WCAG 2 AA
// violations, and the dialogs usable by keyboard.
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
  await signIn(page);
});

const SEITEN = [
  "/admin/buchung/kalender",
  "/admin/buchung/buchungen",
  "/admin/buchung/buchungen/neu",
  "/admin/buchung/figuren",
  "/admin/buchung/figuren/neu",
  "/admin/buchung/darsteller",
  "/admin/buchung/darsteller/neu",
  "/admin/buchung/angebot",
  "/admin/buchung/pakete/neu",
  "/admin/buchung/extras/neu",
  "/admin/buchung/gebiet",
  "/admin/buchung/zonen/neu",
  "/admin/buchung/orte/neu",
  "/admin/buchung/einstellungen",
];

async function ohneVerstoesse(page: Page, path: string) {
  // Screens fade in (admin template, list entrances): measure the settled colours.
  await page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 400));
    window.scrollTo(0, 0);
  });
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude('[class*="reticle-"]')
    .analyze();
  expect(
    violations.map((v) => `${path} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
  ).toEqual([]);
}

test("every booking admin screen has no WCAG 2 AA violations", async ({ page }) => {
  for (const path of SEITEN) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await ohneVerstoesse(page, path);
  }
  // A booking's card, when there is one.
  await page.goto("/admin/buchung/buchungen?ansicht=alle");
  const karte = page.locator('main a[href^="/admin/buchung/buchungen/"]:not([href$="/neu"])');
  if ((await karte.count()) > 0) {
    await karte.first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("BU-");
    await ohneVerstoesse(page, "Buchungskarte");
  }
});

test("„Zeit sperren“ opens by keyboard, closes with Escape and hands focus back", async ({
  page,
}) => {
  await page.goto("/admin/buchung/kalender");
  const knopf = page.getByRole("button", { name: "Zeit sperren" });
  test.skip(await knopf.isDisabled(), "Ohne Darsteller gibt es nichts zu sperren.");
  await knopf.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Zeit sperren" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Darsteller")).toBeVisible();
  await ohneVerstoesse(page, "Dialog Zeit sperren");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(knopf).toBeFocused();
});

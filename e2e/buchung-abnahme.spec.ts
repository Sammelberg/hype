import { expect, test, type Browser, type Page } from "@playwright/test";

import { hideDevOverlays, signIn } from "./_admin";

// Acceptance of the booking engine from the outside (the database tests cover the locking itself):
// two people after one slot, a phone order closing a slot on the website at once, Extras that
// cannot be made in time left out. Bookings use e2e-…@example.com; scripts/clean-e2e.ts removes them.

test.describe.configure({ timeout: 120_000 });

const WOCHENTAGE = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];
const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

/** A German day `n` days from today, as ISO and as the calendar names it. */
function tagIn(n: number) {
  const heute = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
  const d = new Date(`${heute}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return {
    iso: d.toISOString().slice(0, 10),
    text: `${WOCHENTAGE[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]}`,
  };
}

const weiter = (page: Page) =>
  page
    .getByRole("button", { name: /^(Weiter|Zahlungspflichtig buchen|Anfrage senden)$/ })
    .locator("visible=true");

async function ohneOverlays(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent =
        "[data-reticle-tour], [data-reticle-overlay] { display: none !important; }";
      document.head.append(style);
    });
  });
}

/** Opens the calendar for Eisprinzessin, Mini, Aschaffenburg and pages to the day. */
async function zumTag(page: Page, tag: { text: string }) {
  await page.goto("/buchen?figur=eisprinzessin&ort=aschaffenburg&paket=mini");
  await weiter(page).click();
  const knopf = page.getByRole("button", { name: new RegExp(`^${tag.text}, `) });
  for (let i = 0; i < 3 && !(await knopf.isVisible()); i++)
    await page.getByRole("button", { name: "Später" }).click();
  await expect(page.getByRole("group", { name: "Tag der Feier" })).toHaveAttribute(
    "aria-busy",
    "false",
  );
  return knopf;
}

async function bisZumPruefen(page: Page, tag: { text: string }, uhrzeit: string, email: string) {
  await (await zumTag(page, tag)).click();
  await page.getByRole("radio", { name: `${uhrzeit} Uhr` }).check({ force: true });
  await weiter(page).click();
  await weiter(page).click();
  await page.getByLabel("Ihr Name").fill("E2E Abnahme");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Telefon").fill("06021 123456");
  await page.getByLabel("Straße und Hausnummer").fill("Teststraße 2");
  await page.getByLabel("PLZ").fill("63739");
  await page.getByLabel("Ort", { exact: true }).fill("Aschaffenburg");
  await weiter(page).click();
  await page.getByLabel(/Bedingungen für Absagen gelesen/).check();
}

async function neueSeite(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await ohneOverlays(page);
  return { context, page };
}

test("of two people after one slot, the second is told and offered other starts", async ({
  browser,
  isMobile,
}) => {
  test.skip(isMobile, "one run is enough: both people book the same slot");
  const tag = tagIn(45);
  const a = await neueSeite(browser);
  const b = await neueSeite(browser);
  await bisZumPruefen(a.page, tag, "16:00", "e2e-abnahme-a@example.com");
  // The form refuses what is sent within 15 s of opening; the second page opened last.
  const startB = Date.now();
  await bisZumPruefen(b.page, tag, "16:00", "e2e-abnahme-b@example.com");
  await b.page.waitForTimeout(Math.max(0, 16_000 - (Date.now() - startB)));

  await weiter(a.page).click();
  await expect(a.page).toHaveURL(/\/testzahlung/);
  await weiter(b.page).click();
  // (Next's route announcer is an alert too; the form's own is the one with the text.)
  const meldung = b.page
    .getByRole("alert")
    .filter({ hasText: "Dieser Termin wurde gerade vergeben." });
  await expect(meldung).toBeVisible();
  await expect(meldung.getByRole("button").first()).toBeVisible();
  await a.context.close();
  await b.context.close();
});

test("a phone order entered in the admin closes the slot on the website at once", async ({
  page,
  browser,
  isMobile,
}) => {
  test.skip(isMobile, "the admin is checked on the desktop");
  const tag = tagIn(50);
  const kunde = await neueSeite(browser);
  await (await zumTag(kunde.page, tag)).click();
  await expect(kunde.page.getByRole("radio", { name: "15:00 Uhr" })).toHaveCount(1);

  await signIn(page);
  await page.goto("/admin/buchung/buchungen/neu");
  await hideDevOverlays(page);
  // By keyboard, as a person would: open, type the beginning, Enter.
  for (const [feld, wahl] of [
    ["Figur", "Eisprinzessin"],
    ["Paket", "Mini"],
    ["Ort", "Aschaffenburg"],
  ] as const) {
    const auswahl = page.getByRole("combobox", { name: feld, exact: true });
    await auswahl.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.type(wahl);
    await page.keyboard.press("Enter");
    await expect(auswahl).toContainText(wahl);
  }
  await page.getByLabel("Tag", { exact: true }).fill(tag.iso);
  await page.getByLabel("Beginn der Feier").fill("15:00");
  await page.getByLabel("Name", { exact: true }).fill("E2E Telefon");
  await page.getByLabel("E-Mail").fill("e2e-telefon@example.com");
  await page.getByRole("button", { name: "Buchen" }).click();
  await expect(page).toHaveURL(/\/admin\/buchung\/buchungen\/\d+$/);

  // The same customer reloads: 15:00 and the starts whose Fenster would overlap are gone.
  await (await zumTag(kunde.page, tag)).click();
  await expect(kunde.page.getByRole("radio", { name: "15:00 Uhr" })).toHaveCount(0);
  await expect(kunde.page.getByRole("radio", { name: "14:30 Uhr" })).toHaveCount(0);
  await kunde.context.close();
});

test("an Extra that cannot be made in time is left out, and offered for a later date", async ({
  page,
}) => {
  await ohneOverlays(page);
  // The first free day lies just past the 48 hours: candles (7 days) and flowers (5) are out.
  await page.goto("/buchen?figur=eisprinzessin&ort=aschaffenburg&paket=mini");
  await weiter(page).click();
  await expect(page.getByRole("group", { name: "Tag der Feier" })).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page
    .getByRole("group", { name: "Tag der Feier" })
    .locator("button:not([disabled])")
    .first()
    .click();
  await page.locator('input[name="uhrzeit"]').first().check({ force: true });
  await weiter(page).click();
  await expect(page.getByText("Kinderschminken")).toBeVisible();
  await expect(page.getByText("Kerzenarrangement")).toHaveCount(0);
  await expect(page.getByText("Blumenarrangement")).toHaveCount(0);

  // Five weeks on, everything is offered.
  await page.getByRole("button", { name: "Zurück" }).click();
  const spaeter = tagIn(35);
  const knopf = page.getByRole("button", { name: new RegExp(`^${spaeter.text}, `) });
  for (let i = 0; i < 3 && !(await knopf.isVisible()); i++)
    await page.getByRole("button", { name: "Später" }).click();
  await knopf.click();
  await page.locator('input[name="uhrzeit"]').first().check({ force: true });
  await weiter(page).click();
  await expect(page.getByText("Kerzenarrangement")).toBeVisible();
});

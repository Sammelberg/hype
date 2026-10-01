import { expect, test } from "@playwright/test";

import { hideDevOverlays, signIn } from "./_admin";

// The office end to end through the admin: a customer, an order led through its stages, a
// contract with its notice date, and an invoice draft made from the order — its live document
// and what is still missing before it may be issued. Issuing is not done here: an issued invoice
// cannot be deleted (GoBD), so it is covered by src/buero/daten/rechnungen.db.test.ts (inside a
// rolled-back transaction) and the KoSIT conformance test. Everything starts with „E2E“ and is
// removed at the end (scripts/clean-e2e.ts sweeps what an aborted run leaves).
test.describe.configure({ mode: "serial" });

const STAMP = Date.now().toString(36);
const KUNDE = `E2E Kunde ${STAMP}`;
const AUFTRAG = `E2E Auftrag ${STAMP}`;

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
  await signIn(page);
});

const tb = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("textbox", { name, exact: true });

test("a customer, an order, a contract and an invoice draft hang together", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/admin/kunden/neu");
  await tb(page, "Firmenname").fill(KUNDE);
  await tb(page, "E-Mail").fill("buchhaltung@example.com");
  await tb(page, "Straße und Hausnummer").fill("Talstraße 4");
  await tb(page, "PLZ").fill("79100");
  await tb(page, "Ort").fill("Freiburg");
  await page.getByRole("button", { name: "Kunde anlegen" }).click();
  await expect(page).toHaveURL(/\/admin\/kunden\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(KUNDE);

  // The order, started from the customer card, led from offer to work.
  await page.getByRole("link", { name: "Auftrag", exact: true }).click();
  await tb(page, "Titel").fill(AUFTRAG);
  await page.getByRole("spinbutton", { name: "Betrag netto", exact: true }).fill("12500");
  await page.getByLabel("Leistung ab").fill("2026-09-01");
  await page.getByLabel("Leistung bis").fill("2026-09-30");
  await page.getByRole("button", { name: "Auftrag anlegen" }).click();
  await expect(page).toHaveURL(/\/admin\/auftraege\/\d+$/);
  await page.getByRole("button", { name: "Auftrag erhalten" }).click();
  await page.getByRole("button", { name: "Arbeit beginnen" }).click();
  await expect(page.getByRole("button", { name: "Abnahme erfassen" })).toBeVisible();

  // The contract from the order states when it can be ended.
  await page.getByRole("link", { name: "Vertrag", exact: true }).click();
  // A contract starting on the first of next month runs its twelve months to the day before:
  // the same sentence whatever today's date (one fixed in 2026 broke when the deadline passed).
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const de = (d: Date) => iso(d).split("-").reverse().join(".");
  await page.getByLabel("Beginn").fill(iso(start));
  await expect(page.getByText(`Nächstes Ende ${de(end)}`, { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Vertrag anlegen" }).click();
  await expect(page).toHaveURL(/\/admin\/vertraege\/\d+$/);
  const vertrag = page.url();

  // The invoice draft from the order: its price as a position, the document beside it.
  await page
    .getByRole("link", { name: /Wartung und Betrieb/ })
    .first()
    .isVisible();
  await page.goto("/admin/auftraege");
  await page.getByRole("link", { name: AUFTRAG }).click();
  await page.getByRole("link", { name: "Rechnung", exact: true }).click();
  await page.getByRole("button", { name: "Entwurf anlegen" }).click();
  await expect(page).toHaveURL(/\/admin\/rechnungen\/\d+$/);
  const vorschau = page.getByRole("region", { name: "Vorschau der Rechnung" });
  await expect(vorschau.getByText("14.875,00 €")).toBeVisible();
  await expect(vorschau.getByText(KUNDE)).toBeVisible();

  // Cleanup through the admin: draft, contract, order (cancelled first), customer.
  page.on("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Entwurf löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Entwurf löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/rechnungen$/);
  await page.goto(vertrag);
  await page.getByRole("button", { name: "Vertrag löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Vertrag löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/vertraege$/);
  await page.goto("/admin/auftraege");
  await page.getByRole("link", { name: AUFTRAG }).click();
  await page.getByRole("button", { name: "Stornieren" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Stornieren" }).click();
  await expect(page.getByText("Storniert.", { exact: true }).first()).toBeVisible();
  // The toast comes before the refreshed page; a dialog opened in between is torn down by it.
  await expect(page.getByRole("button", { name: "Stornieren" })).toHaveCount(0);
  await page.getByRole("button", { name: "Auftrag löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Auftrag löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/auftraege$/);
  await page.goto("/admin/kunden");
  await page.getByRole("link", { name: KUNDE }).click();
  await page.getByRole("button", { name: "Kunde löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Kunde löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/kunden$/);
  await expect(page.getByRole("link", { name: KUNDE })).toHaveCount(0);
});

test("a customer is created inside an order, and the invoice follows the order", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const kunde = `E2E Schnell ${STAMP}`;
  const titel = `E2E Lager ${STAMP}`;
  await page.goto("/admin/auftraege/neu");
  await page.getByRole("combobox", { name: "Kunde" }).click();
  await page.getByPlaceholder("Name, Kundennummer oder Ort").fill(kunde);
  await page.getByRole("option", { name: /als neuen Kunden anlegen/ }).click();
  const dialog = page.getByRole("dialog", { name: "Neuer Kunde" });
  await expect(dialog.getByRole("textbox", { name: "Firmenname" })).toHaveValue(kunde);
  await dialog.getByRole("textbox", { name: "E-Mail", exact: true }).fill("lager@example.com");
  await dialog.getByRole("textbox", { name: "Straße und Hausnummer" }).fill("Gewerbestraße 9");
  await dialog.getByRole("textbox", { name: "PLZ" }).fill("79110");
  await dialog.getByRole("textbox", { name: "Ort" }).fill("Freiburg");
  await dialog.getByRole("button", { name: "Kunde anlegen" }).click();
  // The customer is chosen, and the order form was not sent along.
  await expect(page.getByRole("combobox", { name: "Kunde" })).toContainText(kunde);
  await expect(page).toHaveURL(/\/admin\/auftraege\/neu$/);
  await tb(page, "Titel").fill(titel);
  await page.getByRole("spinbutton", { name: "Betrag netto", exact: true }).fill("8000");
  await page.getByLabel("Leistung ab").fill("2026-10-01");
  await page.getByRole("button", { name: "Auftrag anlegen" }).click();
  await expect(page).toHaveURL(/\/admin\/auftraege\/\d+$/);
  const auftrag = page.url();

  // A new invoice: choosing the order chooses its customer; its price becomes the position.
  await page.goto("/admin/rechnungen/neu");
  await page.getByRole("combobox", { name: "Zum Auftrag" }).click();
  await page.getByRole("option", { name: new RegExp(titel) }).click();
  await expect(page.getByRole("combobox", { name: "Kunde" })).toContainText(kunde);
  await page.getByRole("button", { name: "Aus Auftrag übernehmen" }).click();
  await expect(page.getByLabel("Leistung vom")).toHaveValue("2026-10-01");
  await expect(
    page.getByRole("region", { name: "Vorschau der Rechnung" }).getByText("9.520,00\u00a0€"),
  ).toBeVisible();

  // Nothing was saved from the invoice; the order and the customer go again.
  await page.goto(auftrag);
  await page.getByRole("button", { name: "Auftrag löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Auftrag löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/auftraege$/);
  await page.goto("/admin/kunden");
  await page.getByRole("link", { name: kunde }).click();
  await page.getByRole("button", { name: "Kunde löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Kunde löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/kunden$/);
});

test("the customer card keeps the history, a Wiedervorlage and an offer", async ({ page }) => {
  test.setTimeout(90_000);
  const kunde = `E2E Verlauf ${STAMP}`;
  await page.goto("/admin/kunden/neu");
  await tb(page, "Firmenname").fill(kunde);
  await page.getByRole("button", { name: "Kunde anlegen" }).click();
  await expect(page).toHaveURL(/\/admin\/kunden\/\d+$/);
  const karte = page.url();

  // A call, written into the history.
  await page.getByRole("button", { name: "Eintrag", exact: true }).click();
  const eintrag = page.getByRole("dialog", { name: "In den Verlauf" });
  await eintrag.getByRole("radio", { name: "Anruf" }).click();
  await eintrag.getByRole("textbox", { name: "Text" }).fill("E2E Rückruf vereinbart");
  await eintrag.getByRole("button", { name: "Festhalten" }).click();
  await expect(page.getByText("E2E Rückruf vereinbart")).toBeVisible();

  // A Wiedervorlage for tomorrow, then done.
  await page.getByRole("button", { name: "Vormerken" }).click();
  const wv = page.getByRole("dialog", { name: "Wiedervorlage" });
  await wv.getByRole("textbox", { name: "Worum es geht" }).fill("E2E Nachfassen");
  await wv.getByRole("button", { name: "Morgen" }).click();
  await wv.getByRole("button", { name: "Vormerken" }).click();
  const erledigt = page.getByRole("button", { name: "„E2E Nachfassen“ erledigt" });
  await expect(erledigt).toBeVisible();
  await erledigt.click();
  await expect(erledigt).toHaveCount(0);

  // An offer started from the card: its total in the live document, then the draft goes.
  await page.getByRole("link", { name: "Angebot", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/angebote\/neu\?kunde=\d+$/);
  await expect(page.getByRole("combobox", { name: "Kunde" })).toContainText(kunde);
  await tb(page, "Titel").fill("E2E Kundenportal");
  await tb(page, "Leistung").fill("Kundenportal, Umsetzung");
  await page.getByRole("spinbutton", { name: "Einzelpreis netto" }).fill("5000");
  await page.getByRole("button", { name: "Entwurf anlegen" }).click();
  await expect(page).toHaveURL(/\/admin\/angebote\/\d+$/);
  await expect(
    page.getByRole("region", { name: "Vorschau des Angebots" }).getByText("5.950,00\u00a0€"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Entwurf löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Entwurf löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/angebote$/);

  await page.goto(karte);
  await page.getByRole("button", { name: "Kunde löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Kunde löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/kunden$/);
});

test("an invoice is not issued while §14 details of the issuer are missing", async ({ page }) => {
  await page.goto("/admin/firma");
  const bereit = page.getByText("Bereit für Rechnungen?");
  await expect(bereit).toBeVisible();
  // The check reads the form live: emptying the tax numbers names §14 Abs. 4 Nr. 2.
  await tb(page, "Steuernummer").fill("");
  await tb(page, "USt-IdNr").fill("");
  await expect(
    page.getByRole("listitem").filter({ hasText: "Steuernummer oder USt-IdNr des Unternehmens" }),
  ).toBeVisible();
});

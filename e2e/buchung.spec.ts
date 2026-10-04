import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The booking form end to end: five steps, the pretend checkout (ZAHLUNG_TEST=1), the booking's
// page behind its link, cancelling it; and an Anfrage for a town on request. Bookings use
// e2e-…@example.com and are removed by scripts/clean-e2e.ts after the run.

test.describe.configure({ timeout: 90_000 });

// The mails land in Mailpit (the seed points the site's mailbox there); only mails since `seit`.
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";
type Nachricht = { Text: string; Attachments: { FileName: string; ContentType: string }[] };

async function mailAn(adresse: string, betreff: RegExp, seit: Date): Promise<Nachricht> {
  let id: string | undefined;
  await expect
    .poll(
      async () => {
        const liste = (await (await fetch(`${MAILPIT}/api/v1/messages?limit=50`)).json()) as {
          messages: { ID: string; Subject: string; Created: string; To: { Address: string }[] }[];
        };
        id = liste.messages.find(
          (m) =>
            m.To.some((to) => to.Address === adresse) &&
            betreff.test(m.Subject) &&
            new Date(m.Created) >= seit,
        )?.ID;
        return Boolean(id);
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  return (await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()) as Nachricht;
}

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

// The one primary button of the step: in the phone's bar or under the step on a wide screen.
const weiter = (page: Page) =>
  page
    .getByRole("button", { name: /^(Weiter|Zahlungspflichtig buchen|Anfrage senden)$/ })
    .locator("visible=true");

async function ohneVerstoesse(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude('[class*="reticle-"]')
    .analyze();
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
  ).toEqual([]);
}

async function angaben(page: Page, email: string) {
  await page.getByLabel("Ihr Name").fill("E2E Mutter");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Telefon").fill("06021 123456");
  await page.getByLabel("Straße und Hausnummer").fill("Teststraße 1");
  await page.getByLabel("PLZ").fill("63739");
  await page.getByLabel("Ort", { exact: true }).fill("Aschaffenburg");
}

test("a party is booked, paid, shown behind its link and cancelled", async ({ page, isMobile }) => {
  const start = Date.now();
  const seit = new Date(start - 2_000);
  const email = `e2e-buchung-${isMobile ? "m" : "d"}@example.com`;
  await page.goto("/buchen?figur=eisprinzessin&ort=aschaffenburg&paket=mini");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Feier buchen");

  // Step 1 comes chosen from the link.
  await expect(page.getByRole("radio", { name: /Eisprinzessin/ })).toBeChecked();
  await weiter(page).click();

  // Step 2: weeks later (so the customer may cancel alone), one project a day apart from the
  // other, so parallel runs never want the same slot.
  await expect(page.getByRole("heading", { name: "Wo und wann?" })).toBeFocused();
  await page.getByRole("button", { name: "Später" }).click();
  const tage = page.getByRole("group", { name: "Tag der Feier" }).locator("button:not([disabled])");
  await tage.nth(isMobile ? 9 : 10).click();
  await page
    .locator('input[name="uhrzeit"]')
    .nth(isMobile ? 2 : 4)
    .check({ force: true });
  await weiter(page).click();

  // Step 3: an Extra raises the price at once.
  await page.getByText("Kinderschminken").click();
  await weiter(page).click();

  // Step 4: a missing field is named, then filled.
  await weiter(page).click();
  await expect(page.getByText("Bitte geben Sie Ihren Namen an.")).toBeVisible();
  await angaben(page, email);
  await weiter(page).click();

  // Step 5: the price line by line, the terms, the button that says it costs money.
  await expect(page.getByRole("heading", { name: "Prüfen und buchen" })).toBeVisible();
  await page.getByLabel(/Bedingungen für Absagen gelesen/).check();
  await ohneVerstoesse(page);
  // The server refuses forms sent faster than a person can fill them (15 s).
  await page.waitForTimeout(Math.max(0, 16_000 - (Date.now() - start)));
  await weiter(page).click();

  await expect(page).toHaveURL(/\/buchung\/[\w-]+\/testzahlung/);
  await page.getByRole("button", { name: "Bezahlen" }).click();
  await expect(page).toHaveURL(/bezahlt=1/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Gebucht/);
  await expect(page.getByText("Kinderschminken")).toBeVisible();

  // The confirmation: the link back to this page and the party for the calendar.
  const bestaetigung = await mailAn(email, /^Gebucht: Eisprinzessin am /, seit);
  expect(bestaetigung.Text).toContain(new URL(page.url()).pathname);
  expect(bestaetigung.Attachments.map((a) => a.FileName)).toEqual([
    expect.stringMatching(/^BU-\d{4}-\d{4}\.ics$/),
  ]);

  await page.getByRole("button", { name: "Buchung stornieren" }).click();
  await page.getByRole("button", { name: "Ja, stornieren" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Die Buchung ist storniert");
  // More than two weeks ahead: the Anzahlung goes back (the test adapter's refund).
  const storno = await mailAn(email, /^Storniert: Buchung /, seit);
  expect(storno.Text).toMatch(/Sie bekommen .* zurück/);
});

test("a town on request sends an Anfrage instead of a booking", async ({ page, isMobile }) => {
  const start = Date.now();
  const email = `e2e-anfrage-${isMobile ? "m" : "d"}@example.com`;
  await page.goto("/buchen?figur=pirat&ort=nuernberg&paket=klassik");
  await weiter(page).click();
  await expect(page.getByText(/So weit fahren wir auf Anfrage/)).toBeVisible();
  await page.getByLabel("Wunschtag").fill("2027-03-13");
  await page.getByLabel("Wunschbeginn").selectOption("14:00");
  await weiter(page).click();
  await weiter(page).click();
  await angaben(page, email);
  await weiter(page).click();
  await page.getByLabel(/Bedingungen für Absagen gelesen/).check();
  await page.waitForTimeout(Math.max(0, 16_000 - (Date.now() - start)));
  await page.getByRole("button", { name: "Anfrage senden" }).locator("visible=true").click();

  await expect(page).toHaveURL(/\/buchung\/[\w-]+\?neu=anfrage/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ihre Anfrage ist bei uns");
  const mail = await mailAn(email, /^Ihre Anfrage: Piratin/, new Date(start - 2_000));
  expect(mail.Text).toContain("Wunschtermin: Samstag, 13. März");
});

import { expect, type Page, test } from "@playwright/test";

import { E2E_EMAIL, E2E_VERGESSEN, SEED_MAILBOX, seedSettings } from "../scripts/seed-data";
import { hideDevOverlays, signIn } from "./_admin";

// E-mail through the test mailbox the seed sets up (Mailpit: docker-compose.yml locally, a service
// in CI): SMTP on localhost:1025, its API on MAILPIT_URL. Mails of earlier runs stay there, so
// each check looks only at mails that arrived after it began.
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

type Summary = { ID: string; Subject: string; Created: string; To: { Address: string }[] };
type Message = { Text: string; ReplyTo: { Address: string }[]; From: { Address: string } };

async function mailTo(address: string, subject: RegExp, since: Date): Promise<Message> {
  let found: Summary | undefined;
  await expect
    .poll(
      async () => {
        const list = (await (await fetch(`${MAILPIT}/api/v1/messages?limit=50`)).json()) as {
          messages: Summary[];
        };
        found = list.messages.find(
          (m) =>
            m.To.some((to) => to.Address === address) &&
            subject.test(m.Subject) &&
            new Date(m.Created) >= since,
        );
        return Boolean(found);
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  return (await (await fetch(`${MAILPIT}/api/v1/message/${found!.ID}`)).json()) as Message;
}

// Mailpit's clock and ours may differ by a moment.
const now = () => new Date(Date.now() - 2_000);

test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "the admin is checked on the desktop");
test.beforeEach(async ({ page }) => hideDevOverlays(page));

test("the test mail goes out through the mailbox and is logged", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/email-versand");
  const status = page.getByRole("region", { name: "Eingerichtet" });
  await expect(status).toContainText(SEED_MAILBOX.settings.fromAddress);
  const since = now();
  await status
    .getByRole("button", { name: `Test-E-Mail an ${SEED_MAILBOX.settings.fromAddress} senden` })
    .click();
  await expect(page.getByText(/Test-E-Mail an .* gesendet/)).toBeVisible();
  const mail = await mailTo(SEED_MAILBOX.settings.fromAddress, /^Test: E-Mail-Versand/, since);
  expect(mail.From.Address).toBe(SEED_MAILBOX.settings.fromAddress);
  await expect(page.getByRole("region", { name: "Zuletzt gesendet" })).toContainText(
    "Test-E-Mail an",
  );
  // The password never comes back to the browser.
  expect(await page.content()).not.toContain(SEED_MAILBOX.password);
});

test("„Passwort vergessen“ sends a one-time link that sets a new password", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("link", { name: "Passwort vergessen?" }).click();
  const since = now();
  await page.getByLabel("E-Mail-Adresse").fill(E2E_VERGESSEN.email.toUpperCase());
  await page.getByRole("button", { name: "Link senden" }).click();
  await expect(
    page.getByRole("heading", { name: "Bitte sehen Sie in Ihr Postfach" }),
  ).toBeVisible();

  const mail = await mailTo(E2E_VERGESSEN.email, /^Passwort zurücksetzen/, since);
  const link = mail.Text.match(/https?:\/\/\S+\/admin\/passwort-vergessen\/\S+/)?.[0];
  expect(link).toBeTruthy();
  await page.goto(new URL(link!).pathname);
  await page.getByLabel("Neues Passwort", { exact: true }).fill("e2e-neues-passwort-lang");
  await page.getByLabel("Neues Passwort wiederholen").fill("e2e-neues-passwort-lang");
  await page.getByRole("button", { name: "Passwort speichern" }).click();
  await expect(page).toHaveURL(/\/admin(\?.*)?$/, { timeout: 15_000 });

  // The link is spent.
  await page.goto(new URL(link!).pathname);
  await expect(page.getByRole("heading", { name: "Dieser Link gilt nicht mehr" })).toBeVisible();
});

test("an unknown address gets the same answer and no mail", async ({ page }) => {
  await page.goto("/admin/passwort-vergessen");
  await page.getByLabel("E-Mail-Adresse").fill("niemand-e2e@example.com");
  await page.getByRole("button", { name: "Link senden" }).click();
  await expect(
    page.getByRole("heading", { name: "Bitte sehen Sie in Ihr Postfach" }),
  ).toBeVisible();
});

async function sendContact(page: Page) {
  await page.goto("/kontakt");
  await page.getByLabel("Name").fill("Erika Test");
  await page.getByLabel("E-Mail").fill(E2E_EMAIL);
  await page.getByLabel("Nachricht").fill("Automatischer Test aus e2e/mail.spec.ts.");
  // Above the minimum fill time of the spam filter (kontakt/_lib/validation.ts).
  await page.waitForTimeout(3100);
  await page.getByRole("button", { name: "Nachricht senden" }).click();
  await expect(page.getByRole("status")).toContainText("Vielen Dank für Ihre Nachricht");
}

test("a new contact message is announced, answers going to the sender", async ({ page }) => {
  const since = now();
  await sendContact(page);
  const mail = await mailTo(
    SEED_MAILBOX.settings.notifyAddress,
    new RegExp(`^Neue Nachricht über „Kontakt“ – ${seedSettings.siteName}$`),
    since,
  );
  expect(mail.Text).toContain("Automatischer Test aus e2e/mail.spec.ts.");
  expect(mail.Text).toMatch(/\/admin\/anfragen\/\d+/);
  expect(mail.ReplyTo.map((r) => r.Address)).toEqual([E2E_EMAIL]);
});

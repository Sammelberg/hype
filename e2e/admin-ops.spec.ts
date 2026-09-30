import { expect, test } from "@playwright/test";

import { E2E_EMAIL } from "../scripts/seed-data";
import { hideDevOverlays, signIn } from "./_admin";

// Redirects, the contact form's fields, the inbox and the accounts — each change checked on the
// public site or in the admin right after. Everything created here is removed again.
test.describe.configure({ mode: "serial" });

const STAMP = Date.now().toString(36);

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
  await signIn(page);
});

test("a redirect made in the admin leads visitors to its target", async ({ page, request }) => {
  await page.goto("/admin/weiterleitungen");
  await page.getByRole("button", { name: "Neue Weiterleitung" }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Alter Pfad").fill(`/E2E-Alt-${STAMP}/`);
  await sheet.getByRole("button", { name: "Anlegen" }).click();
  await expect(page.getByText("Weiterleitung angelegt.")).toBeVisible();
  await expect(page.getByText(`/e2e-alt-${STAMP}`, { exact: true })).toBeVisible();

  const response = await request.get(`/e2e-alt-${STAMP}`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers()["location"]).toMatch(/^\/[a-z0-9-]*$|localhost:\d+\/[a-z0-9-]*$/);

  await page.getByRole("button", { name: `/e2e-alt-${STAMP} löschen` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Löschen" }).click();
  await expect(page.getByText("Weiterleitung gelöscht.")).toBeVisible();
  expect((await request.get(`/e2e-alt-${STAMP}`, { maxRedirects: 0 })).status()).toBe(404);
});

test("a field added to the contact form appears on /kontakt and can be removed again", async ({
  page,
  request,
}) => {
  await page.goto("/admin/formular");
  await page.getByRole("button", { name: "Feld hinzufügen" }).click();
  // Existing fields come folded; the new one opens with its fields.
  const fields = page.getByRole("region", { name: "Felder" });
  await fields.getByLabel("Beschriftung").last().fill(`Probefeld ${STAMP}`);
  await fields.getByLabel("Feldname").last().fill(`probe-${STAMP}`);
  await page.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByText("Gespeichert. /kontakt zeigt das Formular so.")).toBeVisible();
  expect(await (await request.get("/kontakt")).text()).toContain(`Probefeld ${STAMP}`);
  // Saving reloads the editor from the server, which folds every field again: wait for that.
  await expect(
    fields.getByRole("button", { name: new RegExp(`Probefeld ${STAMP}`), expanded: false }),
  ).toBeVisible();

  await page.getByRole("button", { name: `Probefeld ${STAMP} entfernen` }).click();
  await page.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByRole("button", { name: `Probefeld ${STAMP} entfernen` })).toHaveCount(0);
  // Saving and rebuilding /kontakt takes a moment while dev compiles for every worker.
  await expect
    .poll(async () => (await request.get("/kontakt")).text(), { timeout: 20_000 })
    .not.toContain(`Probefeld ${STAMP}`);
});

test("a message sent through the site lands in the inbox, is read on opening and can be deleted", async ({
  browser,
  page,
}) => {
  // The visitor: a fresh context without the admin's cookies.
  const visitor = await browser.newContext();
  const site = await visitor.newPage();
  await site.goto("/kontakt");
  await site.getByLabel("Name").fill(`E2E Besucher ${STAMP}`);
  await site.getByLabel("E-Mail").fill(E2E_EMAIL);
  await site.getByLabel("Nachricht").fill(`Eine Probe-Nachricht ${STAMP}.`);
  await site.waitForTimeout(3200);
  await site.getByRole("button", { name: /senden/i }).click();
  await expect(site.getByText(/Vielen Dank/)).toBeVisible();
  await visitor.close();

  await page.goto("/admin/anfragen");
  const row = page.getByRole("link", { name: new RegExp(`E2E Besucher ${STAMP}`) });
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`E2E Besucher ${STAMP}`);
  await expect(page.getByText(`Eine Probe-Nachricht ${STAMP}.`)).toBeVisible();
  await expect(page.getByRole("link", { name: "Antworten per E-Mail" })).toHaveAttribute(
    "href",
    `mailto:${E2E_EMAIL}`,
  );

  await page.getByRole("button", { name: "Löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/anfragen$/);
  await expect(page.getByRole("link", { name: new RegExp(`E2E Besucher ${STAMP}`) })).toHaveCount(
    0,
  );
});

test("a new account gets a temporary password, shown once, and can be removed", async ({
  page,
  browser,
}) => {
  await page.goto("/admin/benutzer");
  await page.getByRole("button", { name: "Zugang anlegen" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(`E2E Kollege ${STAMP}`);
  await dialog.getByLabel("E-Mail-Adresse").fill(`e2e-kollege-${STAMP}@example.com`);
  await dialog.getByRole("button", { name: "Anlegen" }).click();
  const shown = page.getByRole("dialog", { name: "Vorläufiges Passwort" });
  await expect(shown).toBeVisible();
  const code = shown.locator("code");
  await expect(code).toHaveText(/^[a-z2-9]{4}(-[a-z2-9]{4}){4}$/);
  const temporary = (await code.textContent())!;
  await shown.getByRole("button", { name: "Verstanden" }).click();
  const card = page.getByRole("listitem").filter({ hasText: `E2E Kollege ${STAMP}` });
  await expect(card).toBeVisible();
  await expect(card.getByText("wartet auf eigenes Passwort")).toBeVisible();

  // New accounts start as editors; an admin can raise them.
  const role = card.getByRole("combobox", { name: "Rolle" });
  await expect(role).toHaveText("Redaktion");
  await role.click();
  await page.getByRole("option", { name: "Admin" }).click();
  await expect(page.getByText(`E2E Kollege ${STAMP}: Admin.`)).toBeVisible();
  await expect(role).toHaveText("Admin");

  // With the temporary password, every screen leads to the password page, and no action runs.
  const colleague = await browser.newContext();
  const other = await colleague.newPage();
  await other.goto("/admin/login");
  await other.getByLabel("E-Mail-Adresse").fill(`e2e-kollege-${STAMP}@example.com`);
  await other.getByLabel("Passwort").fill(temporary);
  await other.getByRole("button", { name: "Anmelden" }).click();
  await expect(other).toHaveURL(/\/admin\/passwort$/, { timeout: 15_000 });
  for (const path of ["/admin", "/admin/seiten", "/admin/benutzer", "/admin/rechnungen"]) {
    await other.goto(path);
    await expect(other).toHaveURL(/\/admin\/passwort$/);
  }
  await colleague.close();

  await page.getByRole("button", { name: `Zugang von E2E Kollege ${STAMP} löschen` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Löschen" }).click();
  await expect(page.getByText("Zugang gelöscht.")).toBeVisible();
  await expect(page.getByText(`E2E Kollege ${STAMP}`)).toHaveCount(0);
});

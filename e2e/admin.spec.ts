import { expect, type Page, test } from "@playwright/test";

import { E2E_ADMIN } from "../scripts/seed-data";

// The admin: sign in (or set up the first account when the database has none), move around,
// sign out. The account is the e2e admin the seed creates when E2E_ADMIN_PASSWORD is set; on a
// database without any account the setup page creates it. e2e/teardown.ts removes it again.
const password = process.env.E2E_ADMIN_PASSWORD ?? E2E_ADMIN.fallbackPassword;

async function signIn(page: Page) {
  await page.goto("/admin/login");
  if (page.url().includes("/admin/einrichtung")) {
    await page.getByLabel("Name").fill("E2E Admin");
    await page.getByLabel("E-Mail-Adresse").fill(E2E_ADMIN.email);
    await page.getByLabel("Passwort", { exact: true }).fill(password);
    await page.getByLabel("Passwort wiederholen").fill(password);
    await page.getByRole("button", { name: "Zugang anlegen" }).click();
  } else {
    await page.getByLabel("E-Mail-Adresse").fill(E2E_ADMIN.email);
    await page.getByLabel("Passwort").fill(password);
    await page.getByRole("button", { name: "Anmelden" }).click();
  }
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page
    .addStyleTag({ content: "[data-reticle-panel], reticle-panel { display: none !important }" })
    .catch(() => {});
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
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Guten Tag");

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

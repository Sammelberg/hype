import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { hideDevOverlays, signIn } from "./_admin";

// The editors end to end: a page is written, published and appears on the site; the settings
// change the home page; a project gets its own address; an image is uploaded and described.
// Everything created here starts with „E2E“ and is removed at the end of the run.
test.describe.configure({ mode: "serial" });

const STAMP = Date.now().toString(36);
const PAGE_TITLE = `E2E Seite ${STAMP}`;
const PAGE_SLUG = `e2e-seite-${STAMP}`;
const PROJECT_TITLE = `E2E Projekt ${STAMP}`;

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
  await signIn(page);
});

test("a new page is written, previewed as a draft and published to the site", async ({
  page,
  request,
}) => {
  await page.goto("/admin/seiten/neu");
  await page.getByLabel("Titel").fill(PAGE_TITLE);
  await page.getByRole("tab", { name: "Adresse und Ordnung" }).click();
  await expect(page.getByRole("textbox", { name: "Adresse" })).toHaveValue(PAGE_SLUG);
  await page.getByRole("tab", { name: "Inhalt" }).click();
  await page
    .getByLabel("Text der Seite")
    .fill("Ein Absatz, den nur diese Probe kennt: Zwetschgenkuchen.");
  await page.getByRole("button", { name: "Seite anlegen" }).click();
  await expect(page).toHaveURL(/\/admin\/seiten\/\d+$/);
  await expect(page.getByText("Entwurf", { exact: true })).toBeVisible();

  // Not public yet, but visible in the preview.
  const publicBefore = await request.get(`/${PAGE_SLUG}`);
  expect(publicBefore.status()).toBe(404);
  const preview = page.frameLocator('iframe[title^="Vorschau"]');
  await expect(preview.getByRole("heading", { level: 1 })).toHaveText(PAGE_TITLE);

  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht", { exact: true }).first()).toBeVisible();
  const publicAfter = await request.get(`/${PAGE_SLUG}`);
  expect(publicAfter.status()).toBe(200);
  expect(await publicAfter.text()).toContain("Zwetschgenkuchen");

  // A published top-level page is a section of the site's navigation.
  await page.goto("/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: PAGE_TITLE })).toBeVisible();
});

test("an edit is saved as a draft on its own and goes live only when published", async ({
  page,
  request,
}) => {
  await page.goto("/admin/seiten");
  await page.getByRole("link", { name: PAGE_TITLE }).click();
  await page.getByLabel("Einleitung").fill("Eine Einleitung aus der Probe.");
  await expect(page.getByText("Entwurf gespeichert")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Änderungen", { exact: true })).toBeVisible();
  expect(await (await request.get(`/${PAGE_SLUG}`)).text()).not.toContain(
    "Eine Einleitung aus der Probe.",
  );

  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht. Die Seite ist jetzt online.")).toBeVisible();
  expect(await (await request.get(`/${PAGE_SLUG}`)).text()).toContain(
    "Eine Einleitung aus der Probe.",
  );

  await page.getByRole("button", { name: "Versionen" }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Wiederherstellen" }),
  ).toHaveCount(2);
});

test("the settings change the home page after publishing", async ({ page, request }) => {
  await page.goto("/admin/einstellungen");
  await page.getByRole("tab", { name: "Startseite" }).click();
  const lead = page.getByLabel("Zeile darunter");
  const original = await lead.inputValue();
  await lead.fill(`Individuelle Software aus dem Schwarzwald. (${STAMP})`);
  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht. Die Website zeigt die neuen Texte.")).toBeVisible();
  expect(await (await request.get("/")).text()).toContain(`(${STAMP})`);

  await page.goto("/admin/einstellungen");
  await page.getByRole("tab", { name: "Startseite" }).click();
  await page.getByLabel("Zeile darunter").fill(original);
  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht. Die Website zeigt die neuen Texte.")).toBeVisible();
});

test("a project gets its own address under /projekte", async ({ page, request }) => {
  await page.goto("/admin/projekte/neu");
  await page.getByLabel("Titel").fill(PROJECT_TITLE);
  await page.getByLabel("Kunde").fill("Probekunde");
  await page.getByLabel("Kurzbeschreibung").fill("Zwei Sätze für die Übersicht.");
  await page.getByLabel("Text des Projekts").fill("Der Text des Projekts.");
  await page.getByRole("button", { name: "Projekt anlegen" }).click();
  await expect(page).toHaveURL(/\/admin\/projekte\/\d+$/);
  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht. Das Projekt ist jetzt online.")).toBeVisible();
  const response = await request.get(`/projekte/e2e-projekt-${STAMP}`);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("Probekunde");
});

test("an image is uploaded, described and offered as share image", async ({ page }) => {
  await page.goto("/admin/medien");
  const png = await sharp({
    create: { width: 640, height: 480, channels: 3, background: { r: 30, g: 90, b: 60 } },
  })
    .png()
    .toBuffer();
  await page
    .locator("#media-files")
    .setInputFiles({ name: `e2e-bild-${STAMP}.png`, mimeType: "image/png", buffer: png });
  await expect(page.getByText("Bild hochgeladen. Bitte beschreiben Sie es.")).toBeVisible();
  await page.getByRole("button", { name: new RegExp(`e2e-bild-${STAMP}`) }).click();
  await page.getByLabel("Beschreibung").fill(`Grünes Probebild ${STAMP}`);
  await page.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByText("Gespeichert.")).toBeVisible();

  await page.goto("/admin/seiten");
  await page.getByRole("link", { name: PAGE_TITLE }).click();
  await page.getByRole("tab", { name: "Suchmaschinen" }).click();
  await page.getByRole("button", { name: "Bild wählen" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: `Grünes Probebild ${STAMP}` })
    .click();
  await expect(page.getByRole("tabpanel").getByText(`Grünes Probebild ${STAMP}`)).toBeVisible();
});

test("cleanup: the probe's page, project and image are deleted", async ({ page, request }) => {
  await page.goto("/admin/seiten");
  await page.getByRole("link", { name: PAGE_TITLE }).click();
  await page.getByRole("button", { name: "Seite löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Seite löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/seiten$/);
  expect((await request.get(`/${PAGE_SLUG}`)).status()).toBe(404);

  await page.goto("/admin/projekte");
  await page.getByRole("link", { name: PROJECT_TITLE }).click();
  await page.getByRole("button", { name: "Projekt löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Projekt löschen" }).click();
  await expect(page).toHaveURL(/\/admin\/projekte$/);

  await page.goto("/admin/medien");
  await page.getByRole("button", { name: `Grünes Probebild ${STAMP} bearbeiten` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Löschen" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Löschen" }).click();
  await expect(page.getByText("Bild gelöscht.")).toBeVisible();
});

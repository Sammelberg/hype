import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { hideDevOverlays, signIn } from "./_admin";

// The editors end to end: a page is written, published and appears on the site; the home page's
// sections change the home page and the preview shows which part is edited; the shared texts
// (Website) change every page; a project gets its own address; an image is uploaded and described.
// Everything created here starts with „E2E“ and is removed at the end of the run.
test.describe.configure({ mode: "serial" });

// A text as it was before a test run appended its stamp ` (xxxxxxxx)` to it.
const unstamped = (text: string) => text.replace(/ \([0-9a-z]{8}\)$/, "");

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
  await page.getByLabel("Titel", { exact: true }).fill(PAGE_TITLE);
  await expect(page.getByRole("textbox", { name: "Adresse", exact: true })).toHaveValue(PAGE_SLUG);
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

  // Both publications are recorded: read the list from a fresh load of the editor (the refresh
  // after publishing would otherwise close a sheet opened too early).
  await page.reload();
  await page.getByRole("button", { name: "Versionen" }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Wiederherstellen" }),
  ).toHaveCount(2);
});

test("the home page is edited section by section, with the part shown in the preview", async ({
  page,
  request,
}) => {
  await page.goto("/admin/seiten");
  await page.getByRole("link", { name: "Startseite", exact: true }).click();
  const hero = page.getByRole("region", { name: "Kopfbereich" });
  const lead = hero.getByLabel("Zeile darunter");
  // Without the stamp an aborted earlier run may have left behind, or it would stay for good.
  const original = unstamped(await lead.inputValue());
  await lead.fill(`Eine Zeile für den Test. (${STAMP})`);
  // The preview outlines the part being edited, named like its card.
  const preview = page.frameLocator('iframe[title^="Vorschau"]');
  // The preview compiles the home page on first use in dev: give it time once.
  await expect(preview.getByText("Kopfbereich", { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("region", { name: "Vorgehen" }).getByLabel("Überschrift").focus();
  await expect(preview.getByText("Vorgehen", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht. Die Seite ist jetzt online.")).toBeVisible();
  expect(await (await request.get("/")).text()).toContain(`(${STAMP})`);
  // Publishing rebuilds the editor from the server; edit again on a fresh load.
  await page.reload();

  await page
    .getByRole("region", { name: "Kopfbereich" })
    .getByLabel("Zeile darunter")
    .fill(original);
  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht. Die Seite ist jetzt online.")).toBeVisible();
});

test("the shared texts under Website change every page after publishing", async ({
  page,
  request,
}) => {
  await page.goto("/admin/einstellungen");
  const closing = page.getByRole("region", { name: "Abschluss „Anfrage“" });
  const title = closing.getByLabel("Überschrift");
  const original = unstamped(await title.inputValue());
  await title.fill(`Erzählen Sie uns von Ihrem Vorhaben. (${STAMP})`);
  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht. Die Website zeigt die neuen Texte.")).toBeVisible();
  expect(await (await request.get("/ueber-uns")).text()).toContain(`(${STAMP})`);
  await page.reload();

  await page
    .getByRole("region", { name: "Abschluss „Anfrage“" })
    .getByLabel("Überschrift")
    .fill(original);
  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await expect(page.getByText("Veröffentlicht. Die Website zeigt die neuen Texte.")).toBeVisible();
});

test("a project gets its own address under /projekte", async ({ page, request }) => {
  await page.goto("/admin/projekte/neu");
  await page.getByLabel("Titel", { exact: true }).fill(PROJECT_TITLE);
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
  const seo = page.getByRole("region", { name: "Suchmaschinen und Teilen" });
  await seo.getByRole("button", { name: "Bild wählen" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: `Grünes Probebild ${STAMP}` })
    .click();
  await expect(seo.getByText(`Grünes Probebild ${STAMP}`)).toBeVisible();
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

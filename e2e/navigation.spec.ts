import { expect, test } from "@playwright/test";

import { SEED_PATHS } from "../scripts/seed-data";

// Header, phone menu and footer: every section of the site can be reached from any page.

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

test("the header lists every section and opens a section's pages", async ({ page, isMobile }) => {
  test.skip(isMobile, "phones get the menu button instead");
  await page.goto("/leistungen/web-anwendungen");
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
  for (const name of ["Leistungen", "Branchen", "Projekte", "Über uns"]) {
    await expect(nav.getByRole("button", { name })).toBeVisible();
  }
  // Kontakt is the one filled button at the end; the logo leads home.
  await expect(nav.getByRole("link", { name: "Projekt anfragen" })).toHaveAttribute(
    "href",
    "/kontakt",
  );
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Schwarzwald Systems" }),
  ).toHaveAttribute("href", "/");
  await expect(nav.getByRole("link", { name: "Suche" })).toBeVisible();

  // By keyboard: Enter opens the section's menu, Escape closes it again.
  await nav.getByRole("button", { name: "Leistungen" }).focus();
  await page.keyboard.press("Enter");
  await expect(nav.getByRole("link", { name: "Übersicht Leistungen" })).toHaveAttribute(
    "href",
    "/leistungen",
  );
  await expect(nav.getByRole("link", { name: "Web-Anwendungen" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.keyboard.press("Escape");
  await expect(nav.getByRole("link", { name: "Web-Anwendungen" })).toBeHidden();

  await nav.getByRole("button", { name: "Über uns" }).click();
  await nav.getByRole("link", { name: "Unsere Arbeitsweise" }).click();
  await expect(page).toHaveURL(/\/ueber-uns\/arbeitsweise$/);
});

test("the phone menu opens, traps focus, closes on Escape and leads to a page", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "the menu button only exists on phones");
  await page.goto("/kontakt");
  const button = page.getByRole("button", { name: "Menü" });
  await expect(button).toHaveAttribute("aria-expanded", "false");

  await button.click();
  const menu = page.getByRole("dialog", { name: "Menü" });
  await expect(menu).toBeVisible();
  // While it is open the page behind is hidden from assistive technology, so the button is found
  // by its slot, not its role; focus sits inside the menu and Lenis holds the page still.
  const trigger = page.locator('[data-slot="sheet-trigger"]');
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(await menu.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await expect(page.locator("html")).toHaveClass(/lenis-stopped/);

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();
  await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);

  await button.click();
  await expect(menu.getByRole("link", { name: "Handwerk" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Projekt anfragen" })).toHaveAttribute(
    "href",
    "/kontakt",
  );
  await menu.getByRole("link", { name: "Projekte", exact: true }).click();
  await expect(page).toHaveURL(/\/projekte$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projekte");
  await expect(menu).toBeHidden();
});

test("the footer links every page of the site", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const path of SEED_PATHS) {
    await expect(footer.locator(`a[href="${path}"]`).first()).toBeVisible();
  }
});

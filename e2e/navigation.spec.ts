import { expect, test } from "@playwright/test";

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

test("the header marks the section that is open", async ({ page, isMobile }) => {
  test.skip(isMobile, "the header shows only the contact link on phones");
  await page.goto("/leistungen/web-anwendungen");
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
  await expect(nav.getByRole("link", { name: "Leistungen" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "Projekte" })).not.toHaveAttribute(
    "aria-current",
    /.*/,
  );
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
  await menu.getByRole("link", { name: "Projekte" }).click();
  await expect(page).toHaveURL(/\/projekte$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projekte");
  await expect(menu).toBeHidden();
});

test("the footer leads to every section", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const name of [
    "Leistungen",
    "Branchen",
    "Projekte",
    "Über uns",
    "Arbeitsweise",
    "Kontakt",
    "Impressum",
    "Datenschutz",
    "Suche",
  ]) {
    await expect(footer.getByRole("link", { name, exact: true })).toBeVisible();
  }
});

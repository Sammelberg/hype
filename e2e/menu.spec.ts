import { expect, test } from "@playwright/test";

import { SEED_REDIRECT } from "../scripts/seed-data";

// Site menu (sheet) regressions. Real scrollbars: the scroll lock hides them, and a missing
// width compensation must show up as a layout shift here. launchOptions is file-level only.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

// Reticle overlays (dev tooling) can swallow clicks; see features.spec.ts.
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

// The homepage runs Lenis; a project page does not. Both once jumped to the top on close.
for (const path of ["/", `/projekte/${SEED_REDIRECT.toProject}`]) {
  test(`${path}: opening and closing keeps scroll position and layout`, async ({ page }) => {
    test.slow(); // the dev server compiles the page on first visit
    await page.goto(path);
    await page.evaluate(() =>
      window.scrollTo(0, Math.min(1500, document.documentElement.scrollHeight - innerHeight - 10)),
    );
    const trigger = page.locator("[data-slot=sheet-trigger]");
    const measure = () =>
      page.evaluate(() => ({
        scrollY: Math.round(scrollY),
        triggerRight: Math.round(
          document.querySelector("[data-slot=sheet-trigger]")!.getBoundingClientRect().right,
        ),
      }));
    await page.waitForTimeout(800);
    const before = await measure();

    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Menü" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(600);
    expect(await measure()).toEqual(before);

    // The page behind the open menu does not scroll.
    await page.mouse.move(100, 450);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(600);
    expect((await measure()).scrollY).toBe(before.scrollY);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.waitForTimeout(600);
    expect(await measure()).toEqual(before);
  });
}

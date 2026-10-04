import { expect, test, type Page } from "@playwright/test";

// The motion parts on their demo page (/next/bewegung, docs/motion-architecture.md): scenes play
// on the browser's scroll timeline, a stage holds the screen in CSS and tells its step, a reveal
// arrives once and stands without scripts, a loop rests off screen, reduced motion stands still.
const PFAD = "/next/bewegung";

const scrollTo = (page: Page, selector: string, fraction = 0) =>
  page.evaluate(
    ([sel, f]) => {
      const el = document.querySelector(sel as string)!;
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + (el as HTMLElement).offsetHeight * (f as number));
    },
    [selector, fraction] as const,
  );

const translateX = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    const t = getComputedStyle(el).translate;
    return t === "none" ? 0 : parseFloat(t.split(" ")[0] ?? "0");
  });

test.describe("motion parts", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "scroll timelines: Chromium");

  test("a scene runs on the scroll timeline and the stage tells its step", async ({ page }) => {
    await page.goto(PFAD);
    await expect(page.locator("[data-reihe]")).toBeAttached();
    await page.waitForFunction(() =>
      document.getAnimations().some((a) => a.timeline instanceof ScrollTimeline),
    );
    await scrollTo(page, "[data-sticky-stage]", 0.05);
    await expect.poll(() => translateX(page, "[data-reihe]")).toBeGreaterThan(-50);
    const anfang = await translateX(page, "[data-reihe]");
    await scrollTo(page, "[data-sticky-stage]", 0.6);
    await expect.poll(() => translateX(page, "[data-reihe]")).toBeLessThan(anfang - 200);
    await expect(page.locator("[data-reihe]")).not.toHaveAttribute("data-schritt", "0");
    // The stage stands on screen while the row travels.
    const top = await page
      .locator("[data-sticky-stage] > div")
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThan(2);
  });

  test("a reveal arrives once it comes into view", async ({ page }) => {
    await page.goto(PFAD);
    const auftritt = page.locator("[data-auftritt]");
    await expect(auftritt).not.toHaveAttribute("data-revealed");
    await auftritt.scrollIntoViewIfNeeded();
    await expect(auftritt).toHaveAttribute("data-revealed", "");
    await expect.poll(() => auftritt.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    await expect(
      page.getByRole("heading", { name: "Einmal auftreten, wenn es sichtbar wird" }),
    ).toBeVisible();
  });

  test("a loop rests off screen and runs on it", async ({ page }) => {
    await page.goto(PFAD);
    const schleife = page.locator("[data-schleife]");
    await expect(schleife).toHaveAttribute("data-pausiert", "");
    await schleife.scrollIntoViewIfNeeded();
    await expect(schleife).not.toHaveAttribute("data-pausiert");
  });

  test("with reduced motion nothing moves and everything stands", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(PFAD);
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(
        () => document.getAnimations().filter((a) => a.timeline instanceof ScrollTimeline).length,
      ),
    ).toBe(0);
    await expect
      .poll(() => page.locator("[data-auftritt]").evaluate((el) => getComputedStyle(el).opacity))
      .toBe("1");
    await context.close();
  });
});

test("without scripts the page stands complete", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(PFAD);
  for (const selector of ["h1", "[data-auftritt]", "[data-karte='0']"]) {
    expect(await page.locator(selector).evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  }
  await context.close();
});

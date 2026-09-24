import { expect, type Page, test } from "@playwright/test";

// Home hero (src/app/(frontend)/_components/mountain-scene.tsx): the ridge outline draws once when
// the scene comes into view and ends complete; the firs pause off-screen.

// Reticle overlays (dev tooling) can catch input; see features.spec.ts.
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

// The finished outline: fully opaque, no dash gap left, its 2.5px screen width.
const outline = (page: Page) =>
  page.locator("[data-line]").evaluate((el) => {
    const style = getComputedStyle(el);
    const length = (el as SVGPathElement).getTotalLength();
    const dashes = style.strokeDasharray === "none" ? [] : style.strokeDasharray.split(/[ ,]+/);
    const gap = dashes.length > 1 ? parseFloat(dashes[1]!) : 0;
    const visible = dashes.length > 0 ? parseFloat(dashes[0]!) : length;
    return {
      opacity: Number(style.strokeOpacity),
      complete: gap < 1 || visible >= length - 1,
      width: style.strokeWidth,
      vectorEffect: style.getPropertyValue("vector-effect"),
    };
  });

test("the ridge outline draws once and ends complete", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator("[data-scene]");
  // Mid-draw (the timeline runs 2.4s after a 0.2s delay) the outline is still partial.
  await page.waitForTimeout(900);
  const partial = await page
    .locator("[data-line]")
    .evaluate((el) => getComputedStyle(el).strokeDasharray);
  expect(partial).not.toBe("none");

  await expect(scene).toHaveAttribute("data-drawn", "", { timeout: 10_000 });
  expect(await outline(page)).toEqual({
    opacity: 1,
    complete: true,
    width: "2.5px",
    vectorEffect: "non-scaling-stroke",
  });
});

test("a page loaded below the hero starts with the firs paused", async ({ page }) => {
  await page.goto("/#vorgehen");
  await expect(page.locator("[data-scene]")).toHaveAttribute("data-paused", "", {
    timeout: 10_000,
  });
});

test("the firs pause once the hero is off-screen and resume on return", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator("[data-scene]");
  await expect(scene).toHaveAttribute("data-drawn", "", { timeout: 10_000 });
  await expect(scene).not.toHaveAttribute("data-paused", "");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(scene).toHaveAttribute("data-paused", "");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(scene).not.toHaveAttribute("data-paused", "");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows the finished scene at once", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-scene]")).toHaveAttribute("data-drawn", "");
    const { opacity, complete } = await outline(page);
    expect({ opacity, complete }).toEqual({ opacity: 1, complete: true });
  });
});

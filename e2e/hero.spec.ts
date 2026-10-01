import { expect, type Page, test } from "@playwright/test";

// Home hero (src/app/(frontend)/_components/mountain-scene.tsx): the ridge outline draws once when
// the scene comes into view and ends complete; the firs pause off-screen.

// The whole sequence (ridge, triangle, settle) takes about 6s with a GPU. Headless Chromium draws
// WebGL in software; with the suite running in parallel, frames pass 500ms, and GSAP's lag smoothing
// counts each as 33ms, so the draw can stretch to 20–30s. Wait for it rather than time it.
const DRAWN = { timeout: 45_000 };
test.describe.configure({ timeout: 60_000 });

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

// The finished outline: settled to its quiet resting brightness, no dash gap left, 2.5px wide.
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

  await expect(scene).toHaveAttribute("data-drawn", "", DRAWN);
  expect(await outline(page)).toEqual({
    opacity: 0.72,
    complete: true,
    width: "2.5px",
    vectorEffect: "non-scaling-stroke",
  });
});

// Triangle motif: every stroke fully shown, every vertex dot lit.
const triangles = (page: Page) =>
  page.evaluate(() => ({
    strokes: [...document.querySelectorAll("[data-tri-centre], [data-tri-side]")].map((el) =>
      Number(getComputedStyle(el).strokeOpacity),
    ),
    dots: [...document.querySelectorAll("[data-tri-dot]")].map((el) =>
      Number(getComputedStyle(el).opacity),
    ),
  }));

test("the triangle motif draws after the ridge and ends complete", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-scene]")).toHaveAttribute("data-drawn", "", DRAWN);
  expect(await triangles(page)).toEqual({ strokes: [1, 1, 1, 1, 1], dots: [1, 1, 1] });
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
  await expect(scene).toHaveAttribute("data-drawn", "", DRAWN);
  await expect(scene).not.toHaveAttribute("data-paused", "");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(scene).toHaveAttribute("data-paused", "");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(scene).not.toHaveAttribute("data-paused", "");
});

// Lit pixels of the star canvas, summed alpha — a twinkling sky changes it between frames.
const starlight = (page: Page) =>
  page.locator("[data-stars]").evaluate((canvas: HTMLCanvasElement) => {
    const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) sum += data[i]!;
    return sum;
  });

// Summed alpha of the rising lights — they move, so it changes between frames.
const lightGlow = (page: Page) =>
  page.locator("[data-lights]").evaluate((canvas: HTMLCanvasElement) => {
    const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) sum += data[i]!;
    return sum;
  });

test("the night sky shows the moon, and lights rise from the forest", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-scene]")).toHaveAttribute("data-drawn", "", DRAWN);
  // WebGL sky in place (the CSS fallback moon stays hidden) and faded in.
  await expect(page.locator("[data-moon-fallback]")).toBeHidden();
  await expect(page.locator("[data-sky]")).toHaveCSS("opacity", "1");
  const first = await lightGlow(page);
  expect(first).toBeGreaterThan(0);
  await page.waitForTimeout(400);
  expect(await lightGlow(page)).not.toBe(first);
});

test("the sky fills with stars that twinkle", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-scene]")).toHaveAttribute("data-drawn", "", DRAWN);
  const first = await starlight(page);
  expect(first).toBeGreaterThan(0);
  await page.waitForTimeout(400);
  expect(await starlight(page)).not.toBe(first);
});

// The call to action's pole star (polar-star.ts) follows one spring, mirrored into --p on the link.
const starSpring = (page: Page) =>
  page
    .locator("[data-hero-cta]")
    .evaluate((el) => Number(getComputedStyle(el).getPropertyValue("--p") || 0));

test("the call to action raises its pole star on hover and lets it go", async ({
  page,
  hasTouch,
}) => {
  test.skip(hasTouch, "the star answers a mouse hover; a tap follows the link");
  await page.goto("/");
  // A hover before hydration meets no listener.
  await expect(page.locator("[data-hero-cta]")).toHaveAttribute("data-ready", "");
  expect(await starSpring(page)).toBe(0);
  await page.locator("[data-hero-cta]").hover();
  // The spring steps per frame, so under a loaded headless run it needs longer than on a real screen.
  await expect.poll(() => starSpring(page), { timeout: 5_000 }).toBeGreaterThan(0.9);
  await page.mouse.move(0, 0);
  await expect.poll(() => starSpring(page)).toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows the finished scene at once", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-scene]")).toHaveAttribute("data-drawn", "");
    const { opacity, complete } = await outline(page);
    expect({ opacity, complete }).toEqual({ opacity: 0.72, complete: true });
    expect(await triangles(page)).toEqual({ strokes: [1, 1, 1, 1, 1], dots: [1, 1, 1] });
    // Still lights, drawn once.
    const glow = await lightGlow(page);
    expect(glow).toBeGreaterThan(0);
    await page.waitForTimeout(400);
    expect(await lightGlow(page)).toBe(glow);
    // A still sky: stars are drawn and stay as they are.
    const first = await starlight(page);
    expect(first).toBeGreaterThan(0);
    await page.waitForTimeout(400);
    expect(await starlight(page)).toBe(first);
  });

  test("shows the pole star at once, without motion", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "the star answers a mouse hover");
    await page.goto("/");
    // A hover before hydration meets no listener.
    await expect(page.locator("[data-hero-cta]")).toHaveAttribute("data-ready", "");
    await page.locator("[data-hero-cta]").hover();
    // At once means no spring, not the same tick: the hover still takes a frame to land.
    await expect.poll(() => starSpring(page), { intervals: [50] }).toBe(1);
  });
});

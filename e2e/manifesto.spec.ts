import { expect, test, type Page } from "@playwright/test";

// The homepage manifesto flips one phrase per wheel gesture (Lenis + fine pointer, so desktop
// only). 53px is one wheel notch in Chrome on Linux, the smallest common step; it once needed
// two notches per phrase and an extra notch after the section pulled itself in.
test.skip(({ isMobile }) => isMobile, "wheel stepping runs with a fine pointer only");

test.beforeEach(async ({ page }) => {
  // Reticle overlays (dev tooling) can catch the wheel; see features.spec.ts.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent =
        "[data-reticle-tour], [data-reticle-overlay] { display: none !important; }";
      document.head.append(style);
    });
  });
});

const NOTCH = 53;
const section = (page: Page) => page.locator('section[aria-labelledby="manifest-titel"]');

async function readSection(page: Page) {
  return section(page).evaluate((el) => ({
    active: Number(el.getAttribute("data-active")),
    top: Math.round(el.getBoundingClientRect().top),
    count: el.querySelectorAll("p").length,
  }));
}

// One notch, then wait until the page has settled (glides take up to 0.9s).
async function notch(page: Page, direction: 1 | -1) {
  await page.mouse.wheel(0, direction * NOTCH);
  let last = Number.NaN;
  await expect
    .poll(
      async () => {
        const { top } = await readSection(page);
        const settled = top === last;
        last = top;
        return settled;
      },
      { intervals: [250] },
    )
    .toBe(true);
  return readSection(page);
}

test("one notch pulls the section in, each further notch flips one phrase", async ({ page }) => {
  test.slow(); // dev compiles the homepage on first visit
  await page.goto("/");
  // Lenis marks <html> once it runs; wheel input before that is native scrolling.
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  await page.mouse.move(700, 400);

  // Park the section's top at 85% of the screen: it shows, but is not in place yet.
  const start = await section(page).evaluate((el) => scrollY + el.getBoundingClientRect().top);
  const height = page.viewportSize()!.height;
  await page.evaluate((y) => window.scrollTo(0, y), start - Math.round(height * 0.85));
  await page.waitForTimeout(500);

  // The first notch pulls the section in; a second one while it still glides must already flip
  // (it once went to waste on a second pull-in).
  await page.mouse.wheel(0, NOTCH);
  await page.waitForTimeout(250);
  let state = await notch(page, 1);
  expect(state.active, "the notch during the pull-in shows phrase 1").toBe(1);
  expect(state.top).toBeLessThan(0);

  for (let phrase = 2; phrase < state.count; phrase++) {
    state = await notch(page, 1);
    expect(state.active, `notch ${phrase} shows phrase ${phrase}`).toBe(phrase);
  }

  // Past the last phrase the page scrolls on.
  const pinnedTop = state.top;
  state = await notch(page, 1);
  expect(state.active).toBe(state.count - 1);
  expect(state.top).toBeLessThan(pinnedTop);

  // Further on, then back up: the same pull-in and quick notch, mirrored.
  for (let i = 0; i < 6; i++) state = await notch(page, 1);
  await page.mouse.wheel(0, -NOTCH);
  await page.waitForTimeout(250);
  state = await notch(page, -1);
  expect(state.active, "the notch during the pull-in steps back").toBe(state.count - 2);
  expect(state.top).toBeGreaterThan(pinnedTop);
  for (let phrase = state.count - 3; phrase >= 0; phrase--) {
    state = await notch(page, -1);
    expect(state.active, `back to phrase ${phrase}`).toBe(phrase);
  }
});

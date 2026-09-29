import { expect, type Page, test } from "@playwright/test";

// Services on the home page (src/app/(frontend)/_components/services-strata.tsx): from lg up with
// motion allowed the stage holds under the header while five cards ride sideways; a rail names
// them, steps either way and jumps. Below lg and with reduced motion the cards form a native
// sideways track, the rail's arrows step through it.

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

const NOTCH = 53; // one wheel notch in Chrome on Linux

const section = (page: Page) => page.locator("#leistungen");
const rail = (page: Page) => page.getByRole("navigation", { name: "Leistungen" });
const card = (page: Page, index: number) => section(page).locator("[data-card]").nth(index);

// How far the ride has moved the track (px, negative to the left).
const trackX = (page: Page) =>
  section(page)
    .locator("[data-track]")
    .evaluate((el) => Math.round(new DOMMatrix(getComputedStyle(el).transform).m41));

// Poll until a reading stops changing (the ride scrubs with a 1s lag).
async function settle(read: () => Promise<number>) {
  let last = Number.NaN;
  await expect
    .poll(
      async () => {
        const now = await read();
        const settled = now === last;
        last = now;
        return settled;
      },
      { intervals: [300], timeout: 10_000 },
    )
    .toBe(true);
  return last;
}

const inView = (page: Page, index: number) =>
  card(page, index).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth + 1;
  });

test("the rail rides to a service and steps back", async ({ page, isMobile }) => {
  test.skip(isMobile, "the ride is lg and up");
  await page.goto("/");
  await expect(section(page)).toHaveAttribute("data-ride", "");
  await expect(rail(page).getByRole("button")).toHaveCount(7);
  await expect(rail(page).getByRole("button", { name: "Vorherige Leistung" })).toBeDisabled();

  const target = rail(page).getByRole("button", { name: "Modernisierung" });
  await target.click();
  await expect(target).toHaveAttribute("aria-current", "true");
  await settle(() => trackX(page));
  expect(await inView(page, 3)).toBe(true);

  await rail(page).getByRole("button", { name: "Vorherige Leistung" }).click();
  await expect(rail(page).getByRole("button", { name: "Schnittstellen" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("the wheel moves the ride and nothing hijacks the scroll", async ({ page, isMobile }) => {
  test.skip(isMobile, "wheel input needs a fine pointer");
  await page.goto("/");
  await expect(section(page)).toHaveAttribute("data-ride", "");
  // Where the stage docks under the header: the ride begins here.
  const header = await page.locator("header").evaluate((el: HTMLElement) => el.offsetHeight);
  const start = await section(page)
    .locator("[data-stage]")
    .evaluate((el, h) => Math.round(el.getBoundingClientRect().top + scrollY - h), header);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start);
  await page.mouse.move(640, 360);
  let last = await settle(() => trackX(page));

  // Notch by notch the page moves exactly that far and the track slides further left each time,
  // while the stage stays docked under the header.
  let notches = 0;
  for (let round = 0; round < 4; round++) {
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, NOTCH);
      notches++;
    }
    const now = await settle(() => trackX(page));
    expect(now).toBeLessThan(last);
    last = now;
    expect(await page.evaluate(() => Math.round(scrollY))).toBe(start + notches * NOTCH);
    expect(
      await section(page)
        .locator("[data-stage]")
        .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    ).toBe(header);
  }

  // A trackpad flick back up brings the track back: the ride follows the scroll both ways.
  for (let k = 0; k < 40; k++) {
    await page.mouse.wheel(0, -60 * Math.exp(-k / 15));
    await page.waitForTimeout(16);
  }
  expect(await settle(() => trackX(page))).toBeGreaterThan(last);
});

test("tabbing into a card brings it into view", async ({ page, isMobile }) => {
  test.skip(isMobile, "the ride is lg and up");
  await page.goto("/");
  await expect(section(page)).toHaveAttribute("data-ride", "");
  await page.getByRole("link", { name: "Mehr erfahren über Modernisierung" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Mehr erfahren über Betrieb und Weiterentwicklung" }),
  ).toBeFocused();
  await settle(() => trackX(page));
  expect(await inView(page, 4)).toBe(true);
});

test("below lg the cards swipe sideways and the arrows step through", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "phones and tablets");
  await page.goto("/");
  await expect(section(page)).not.toHaveAttribute("data-ride");
  await expect(section(page).getByRole("heading", { level: 3 })).toHaveCount(5);

  // On phones the rail shows only its arrows; the current card is on the section.
  await expect(section(page)).toHaveAttribute("data-current", "0");
  await rail(page).getByRole("button", { name: "Nächste Leistung" }).click();
  await expect(section(page)).toHaveAttribute("data-current", "1");
  const track = section(page).locator("[data-track]");
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

test("every card leads to its service's own page", async ({ page }) => {
  await page.goto("/");
  const links = section(page).getByRole("link", { name: /^Mehr erfahren über / });
  await expect(links).toHaveCount(5);
  for (const slug of [
    "web-anwendungen",
    "mobile-apps",
    "schnittstellen",
    "modernisierung",
    "betrieb",
  ]) {
    await expect(section(page).locator(`a[href="/leistungen/${slug}"]`)).toHaveCount(1);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows every valley complete, without a ride", async ({ page }) => {
    await page.goto("/");
    await expect(section(page)).not.toHaveAttribute("data-ride");
    await expect(section(page).getByText("Apps für iOS und Android")).toBeAttached();
    // The ice lines stand drawn: nothing ever dashed them.
    const dashes = await section(page)
      .locator("[data-ridge]")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).strokeDasharray));
    expect(dashes).toEqual(Array(5).fill("none"));
  });
});

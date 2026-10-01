import { expect, type Page, test } from "@playwright/test";

// Services on the home page (src/app/(frontend)/_components/services-strata.tsx): from lg up with
// motion allowed the page glides onto the stage as it comes near and holds there; each gesture (a
// wheel turn, a trackpad swipe, a key) moves exactly one card into the middle, one more after the
// last glides the page on, and from below the stage takes the page back at the last card. A rail
// names the cards, steps either way and jumps. Below lg and with reduced motion the cards form a
// native sideways track, centred card by card, the rail's arrows step through it.

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

const NOTCH = 53; // one wheel notch in Chrome on Linux, the smallest common step

const section = (page: Page) => page.locator("#leistungen");
const rail = (page: Page) => page.getByRole("navigation", { name: "Leistungen" });
const card = (page: Page, index: number) => section(page).locator("[data-card]").nth(index);
const current = (page: Page) => section(page).getAttribute("data-current");
const rideState = (page: Page) => section(page).getAttribute("data-ride-state");

// How far the ride has moved the track (px, negative to the left).
const trackX = (page: Page) =>
  section(page)
    .locator("[data-track]")
    .evaluate((el) => Math.round(new DOMMatrix(getComputedStyle(el).transform).m41));

// Poll until a reading stops changing (a slide or a glide takes about a second).
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

// How far a card's centre is from the middle of the screen (px).
const offCentre = (page: Page, index: number) =>
  card(page, index).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return Math.round(r.left + r.width / 2 - innerWidth / 2);
  });

const header = (page: Page) =>
  page.locator("header").evaluate((el: HTMLElement) => el.offsetHeight);
const stageTop = (page: Page) =>
  section(page)
    .locator("[data-stage]")
    .evaluate((el) => Math.round(el.getBoundingClientRect().top));

// Turns the wheel down notch by notch until the page has glided onto the stage and holds.
async function rideIn(page: Page) {
  await page.goto("/");
  await expect(section(page)).toHaveAttribute("data-ride", "");
  await expect(page.locator("html")).toHaveClass(/\blenis\b/);
  await page.mouse.move(700, 450);
  // Until the stage catches the page; then the glide finishes on its own.
  for (let i = 0; i < 40 && (await rideState(page)) === "free"; i++) {
    await page.mouse.wheel(0, NOTCH);
    await page.waitForTimeout(250);
  }
  await expect(section(page)).toHaveAttribute("data-held", "");
  expect(await stageTop(page)).toBe(await header(page));
  // Holding changes nothing on <html>: Lenis' stopped state clips its overflow, the scrollbar
  // would vanish and the page shift sideways by its width.
  await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
  // The turn that brought the page here must not count for the first card.
  await page.waitForTimeout(400);
}

test("the page glides onto the stage, and each wheel turn brings exactly one card", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "wheel input needs a fine pointer");
  await rideIn(page);
  expect(await current(page)).toBe("0");
  const y = await page.evaluate(() => Math.round(scrollY));
  for (const expected of ["1", "2", "3", "4"]) {
    await page.mouse.wheel(0, NOTCH);
    await expect.poll(() => current(page)).toBe(expected);
    await settle(() => trackX(page));
    expect(Math.abs(await offCentre(page, Number(expected)))).toBeLessThanOrEqual(2);
    // The page stands still while the cards ride.
    expect(await page.evaluate(() => Math.round(scrollY))).toBe(y);
    await page.waitForTimeout(300);
  }
});

test("no turn of the wheel is lost while the page glides onto the stage", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "wheel input needs a fine pointer");
  await page.goto("/");
  await expect(section(page)).toHaveAttribute("data-ride", "");
  await expect(page.locator("html")).toHaveClass(/\blenis\b/);
  await page.mouse.move(700, 450);
  // Steady turns, as a hand scrolls down to the section and on: the first turn after the stage
  // has caught the page moves the first card on (not a turn later), and only one card moves
  // while the page still glides in.
  let caught = -1;
  let moved = -1;
  for (let i = 0; i < 40 && moved < 0; i++) {
    await page.mouse.wheel(0, NOTCH);
    await page.waitForTimeout(450);
    if (caught < 0 && (await rideState(page)) !== "free") caught = i;
    if ((await current(page)) !== "0") moved = i;
  }
  expect(caught).toBeGreaterThanOrEqual(0);
  expect(moved).toBe(caught + 1);
  await expect(section(page)).toHaveAttribute("data-held", "");
  expect(await current(page)).toBe("1");
});

test("one turn of the wheel, several notches at once, moves one card", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "wheel input needs a fine pointer");
  await rideIn(page);
  // A hand spinning the wheel: five notches in quick succession are one scroll.
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, NOTCH);
    await page.waitForTimeout(60);
  }
  await settle(() => trackX(page));
  expect(await current(page)).toBe("1");
  // After a pause the next turn moves the next card.
  await page.waitForTimeout(500);
  await page.mouse.wheel(0, NOTCH);
  await expect.poll(() => current(page)).toBe("2");
});

test("a trackpad swipe, gliding on for a second, moves one card, not several", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "wheel input needs a fine pointer");
  await rideIn(page);
  for (let k = 0; k < 60; k++) {
    await page.mouse.wheel(0, 80 * Math.exp(-k / 18) + 1);
    await page.waitForTimeout(16);
  }
  await settle(() => trackX(page));
  expect(await current(page)).toBe("1");
});

test("a second swipe while the first still glides on moves one more card", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "wheel input needs a fine pointer");
  await rideIn(page);
  // A swipe gliding out, then a new push in the middle of the glide.
  for (const start of [80, 80]) {
    for (let k = 0; k < 25; k++) {
      await page.mouse.wheel(0, start * Math.exp(-k / 8) + 1);
      await page.waitForTimeout(16);
    }
  }
  await settle(() => trackX(page));
  expect(await current(page)).toBe("2");
});

test("after the last card the page moves on, and from below the stage takes it back", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "wheel input needs a fine pointer");
  await rideIn(page);
  // Four turns, each after a pause: four cards.
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, NOTCH);
    await page.waitForTimeout(500);
  }
  await expect.poll(() => current(page)).toBe("4");
  await page.waitForTimeout(600);

  // One more turn: the stage lets go and the page glides on by itself.
  const docked = await header(page);
  await page.mouse.wheel(0, NOTCH);
  await expect(section(page)).not.toHaveAttribute("data-held");
  expect(await settle(() => stageTop(page))).toBeLessThan(docked - 200);
  expect(await current(page)).toBe("4");

  // Back up: the stage takes the page again, at the last card, and the next turn up goes back.
  for (let i = 0; i < 20 && (await rideState(page)) === "free"; i++) {
    await page.mouse.wheel(0, -NOTCH);
    await page.waitForTimeout(250);
  }
  await expect(section(page)).toHaveAttribute("data-held", "");
  expect(await stageTop(page)).toBe(docked);
  expect(await current(page)).toBe("4");
  await page.waitForTimeout(400);
  await page.mouse.wheel(0, -NOTCH);
  await expect.poll(() => current(page)).toBe("3");
});

test("back up from the first card: the first turn leaves, and turning on is never lost", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "wheel input needs a fine pointer");
  await rideIn(page);
  const docked = await header(page);
  const y = () => page.evaluate(() => Math.round(scrollY));
  const before = await y();
  // One turn up: the stage lets go and the page glides back up at once.
  await page.mouse.wheel(0, -NOTCH);
  await expect(section(page)).not.toHaveAttribute("data-held");
  await expect.poll(y).toBeLessThan(before - 100);
  // Turning on while it still glides carries the page on further up: no turn is swallowed.
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, -NOTCH);
    await page.waitForTimeout(120);
  }
  const after = await settle(y);
  expect(after).toBeLessThan(before - (await page.evaluate(() => innerHeight)) * 0.55 - 100);
  expect(await stageTop(page)).toBeGreaterThan(docked);
});

test("a turn back up while the page still glides in turns it round at once", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "wheel input needs a fine pointer");
  await page.goto("/");
  await expect(section(page)).toHaveAttribute("data-ride", "");
  await expect(page.locator("html")).toHaveClass(/\blenis\b/);
  await page.mouse.move(700, 450);
  for (let i = 0; i < 40 && (await rideState(page)) === "free"; i++) {
    await page.mouse.wheel(0, NOTCH);
    await page.waitForTimeout(250);
  }
  expect(await rideState(page)).toBe("docking");
  await page.waitForTimeout(320);
  await page.mouse.wheel(0, -NOTCH);
  // Not caught: the page goes back up instead of holding on the first card.
  await expect.poll(() => rideState(page)).not.toBe("docking");
  await page.waitForTimeout(1200);
  expect(await section(page).getAttribute("data-held")).toBeNull();
  expect(await stageTop(page)).toBeGreaterThan(await header(page));
});

test("the arrow keys ride too, and Home lets the page go", async ({ page, isMobile }) => {
  test.skip(isMobile, "keys need a keyboard");
  await rideIn(page);
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => current(page)).toBe("1");
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => current(page)).toBe("0");
  await page.keyboard.press("Home");
  await expect(section(page)).not.toHaveAttribute("data-held");
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(0);
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
  await expect(section(page)).toHaveAttribute("data-held", "");
  await settle(() => trackX(page));
  expect(Math.abs(await offCentre(page, 3))).toBeLessThanOrEqual(2);

  await rail(page).getByRole("button", { name: "Vorherige Leistung" }).click();
  await expect(rail(page).getByRole("button", { name: "Schnittstellen" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("tabbing into a card brings it to the middle", async ({ page, isMobile }) => {
  test.skip(isMobile, "the ride is lg and up");
  await page.goto("/");
  await expect(section(page)).toHaveAttribute("data-ride", "");
  await page.getByRole("link", { name: "Mehr erfahren über Modernisierung" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Mehr erfahren über Betrieb und Weiterentwicklung" }),
  ).toBeFocused();
  await settle(() => trackX(page));
  expect(Math.abs(await offCentre(page, 4))).toBeLessThanOrEqual(2);
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

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { SEED_PATHS } from "../scripts/seed-data";

// Seeded routes need `pnpm seed` first (CI runs it after migrations).
for (const path of ["/", ...SEED_PATHS]) {
  test(`${path} renders without console errors or a11y violations`, async ({ page, baseURL }) => {
    const errors: string[] = [];
    const appPort = new URL(baseURL!).port;
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      // Local dev tools inject into the page from ports of their own (the Reticle bridge, the
      // variate sidecar); their requests are not the site's. The site's own errors stay.
      const local = /https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/.exec(msg.text());
      if (/localhost:\d+\/reticle/.test(msg.text()) || (local && local[1] !== appPort)) return;
      errors.push(msg.text());
    });

    const response = await page.goto(path);
    expect(response?.ok(), `${path} fehlt — wurde "pnpm seed" ausgeführt?`).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // A <Reveal> still fading in reads as low contrast: wait for the time-based animations to end
    // (not loops, not scroll scenes, which never end on their own).
    await page.evaluate(async () => {
      // Two frames, so the reveals on screen have been told to start.
      for (let i = 0; i < 2; i++) await new Promise(requestAnimationFrame);
      await Promise.all(
        document
          .getAnimations()
          .filter(
            (a) =>
              a.timeline === document.timeline &&
              Number.isFinite(a.effect?.getComputedTiming().endTime),
          )
          .map((a) => a.finished.catch(() => undefined)),
      );
    });

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      // Reticle's dev-only overlay is not part of the site (absent in production builds).
      .exclude('[class*="reticle-"]')
      .analyze();
    expect(
      violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => `${n.target.join(" ")} ${n.html}`).join(" | ")}`,
      ),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("admin is reachable", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.ok()).toBe(true);
});

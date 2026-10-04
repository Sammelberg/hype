import { expect, test, type Page } from "@playwright/test";

import { SEED_PATHS } from "../scripts/seed-data";

// The scroll budget (docs/motion-architecture.md): while the wheel scrolls a page on a slowed
// CPU, no task blocks the main thread long enough to drop frames, and no running animation
// changes a property that is laid out or painted on every frame. A project's scroll scenes are
// held to it on every seeded route.
const SLOWDOWN = 4;
const LONGEST_TASK_MS = 100;
const BLOCKING_MS = 300;
const COMPOSITED = new Set(["transform", "translate", "rotate", "scale", "opacity", "offset"]);

async function paintedAnimations(page: Page) {
  return page.evaluate(
    (allowed) =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === "running")
        .flatMap((animation) => {
          const effect = animation.effect as KeyframeEffect | null;
          const props = new Set(
            (effect?.getKeyframes() ?? []).flatMap((frame) =>
              Object.keys(frame).filter(
                (key) => !["offset", "easing", "composite", "computedOffset"].includes(key),
              ),
            ),
          );
          const target = effect?.target as Element | null;
          return [...props]
            .filter((prop) => !allowed.includes(prop))
            .map((prop) => `${target?.tagName.toLowerCase() ?? "?"}: ${prop}`);
        }),
    [...COMPOSITED],
  );
}

test.describe("scroll budget", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
    "CDP throttling",
  );

  for (const path of ["/", ...SEED_PATHS]) {
    test(`${path} scrolls within the budget`, async ({ page }) => {
      await page.addInitScript(() => {
        const w = window as unknown as { __longTasks: number[] };
        w.__longTasks = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) w.__longTasks.push(entry.duration);
        }).observe({ type: "longtask" });
      });
      await page.goto(path);
      await page.waitForLoadState("load");
      // Entrances and the first measure settle before the budget starts.
      await page.waitForTimeout(1000);
      await page.evaluate(() => {
        (window as unknown as { __longTasks: number[] }).__longTasks = [];
      });

      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: SLOWDOWN });
      await page.mouse.move(400, 400);
      const height = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      );
      const painted = new Set<string>();
      for (let y = 0; y < height + 400; y += 100) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(40);
        if (y % 800 === 0) for (const item of await paintedAnimations(page)) painted.add(item);
      }
      await page.waitForTimeout(300);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });

      const tasks = await page.evaluate(
        () => (window as unknown as { __longTasks: number[] }).__longTasks,
      );
      const longest = Math.max(0, ...tasks);
      const blocking = tasks.reduce((sum, ms) => sum + Math.max(0, ms - 50), 0);
      expect([...painted], "animations that repaint while scrolling").toEqual([]);
      expect(longest, `longest task while scrolling (${tasks.length} long tasks)`).toBeLessThan(
        LONGEST_TASK_MS,
      );
      expect(blocking, "blocking time while scrolling").toBeLessThan(BLOCKING_MS);
    });
  }
});

import { expect, test, type Page } from "@playwright/test";

import { SEED_PATHS } from "../scripts/seed-data";

// The scroll budget (docs/motion-architecture.md): at rest a page leaves the main thread alone;
// while the wheel scrolls it on a slowed CPU, no task blocks the main thread long enough to drop
// frames, no running animation changes a property that is laid out or painted on every frame,
// and no link loads another page. A project's motion is held to it on every seeded route and on
// the motion demo.
const SLOWDOWN = 4;
const LONGEST_TASK_MS = 100;
const BLOCKING_MS = 300;
// Script time in the 3 s after load without scrolling, on the slowed CPU: nothing turns idly.
const REST_SCRIPT_MS = 150;
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

  for (const path of ["/", ...SEED_PATHS, "/next/bewegung"]) {
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
      await cdp.send("Performance.enable");
      const scriptSeconds = async () => {
        const { metrics } = await cdp.send("Performance.getMetrics");
        return metrics.find((m) => m.name === "ScriptDuration")?.value ?? 0;
      };
      const restStart = await scriptSeconds();
      await page.waitForTimeout(3000);
      const rest = ((await scriptSeconds()) - restStart) * 1000;

      const prefetches: string[] = [];
      page.on("request", (request) => {
        const headers = request.headers();
        if (headers["next-router-prefetch"] || /[?&]_rsc=/.test(request.url()))
          prefetches.push(request.url());
      });
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
      expect(rest, "script time at rest (3 s)").toBeLessThan(REST_SCRIPT_MS);
      expect(prefetches, "pages loaded by links scrolling into view").toEqual([]);
    });
  }
});

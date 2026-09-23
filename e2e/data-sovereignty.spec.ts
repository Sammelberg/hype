import { expect, test, type Page } from "@playwright/test";

import { SEED_PATHS } from "../scripts/seed-data";

// Data sovereignty: pages must not contact any origin other than our own.
// A new third-party request (analytics, fonts, CDN, avatars, telemetry) fails this test.
function collectExternalRequests(page: Page, baseURL: string) {
  // Hostname, not host: dev-only local tooling (e.g. the Reticle bridge) runs on other localhost ports.
  const own = new URL(baseURL).hostname;
  const external: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol === "data:" || url.protocol === "blob:") return;
    if (url.hostname !== own) external.push(request.url());
  });
  return external;
}

// Seeded routes cover project pages, legal pages and nested pages (`pnpm seed`).
for (const path of ["/", "/admin", "/seite-die-es-nicht-gibt", ...SEED_PATHS]) {
  test(`${path} makes no third-party requests`, async ({ page, baseURL }) => {
    const external = collectExternalRequests(page, baseURL!);
    await page.goto(path, { waitUntil: "networkidle" });
    expect(external).toEqual([]);
  });
}

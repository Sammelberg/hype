import { defineConfig, devices } from "@playwright/test";

// Default app port of this project (package.json dev/start; set by `pnpm init:project`).
const PORT = Number(process.env.PORT ?? 3002);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
// The app counts sign-ins and messages per address (src/cms/security/client-ip.ts: the last
// X-Forwarded-For entry). Without a proxy in front, the tests set it: one address per run
// (TEST-NET-2), so the limits of the last run do not carry over into this one.
const RUN_ADDRESS = `198.51.100.${1 + Math.floor(Math.random() * 254)}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/setup.ts",
  globalTeardown: "./e2e/teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    extraHTTPHeaders: { "x-forwarded-for": RUN_ADDRESS },
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // The admin is checked on the desktop; the site on both.
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /admin.*\.spec\.ts/ },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "pnpm start" : "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});

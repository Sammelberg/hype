import { defineConfig, devices } from "@playwright/test";

// Default app port of this project (package.json dev/start; set by `pnpm init:project`).
const PORT = Number(process.env.PORT ?? 3002);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

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
        // CI runs the standalone server the Dockerfile ships. Not through pnpm: Playwright could
        // not stop a server started by `pnpm start`, and the run hung after the last test.
        // HOSTNAME is the runner's own name on GitHub; server.js would listen on it alone.
        command: process.env.CI
          ? "cp -r .next/static .next/standalone/.next/ && HOSTNAME=0.0.0.0 node .next/standalone/server.js"
          : "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});

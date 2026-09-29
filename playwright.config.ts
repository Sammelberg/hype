import { defineConfig, devices } from "@playwright/test";

// Default app port of this project (package.json dev/start; set by `pnpm init:project`).
const PORT = Number(process.env.PORT ?? 3002);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
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
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "pnpm start" : "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});

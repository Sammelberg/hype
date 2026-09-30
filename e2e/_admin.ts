import { expect, type Page } from "@playwright/test";

import { E2E_ADMIN } from "../scripts/seed-data";

export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? E2E_ADMIN.fallbackPassword;

// Signs in as the e2e admin; on a database without any account the setup page creates it.
export async function signIn(page: Page) {
  await page.goto("/admin/login");
  if (page.url().includes("/admin/einrichtung")) {
    await page.getByLabel("Name").fill("E2E Admin");
    await page.getByLabel("E-Mail-Adresse").fill(E2E_ADMIN.email);
    await page.getByLabel("Passwort", { exact: true }).fill(ADMIN_PASSWORD);
    await page.getByLabel("Passwort wiederholen").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Zugang anlegen" }).click();
    // Another spec may have created the account a moment earlier: then sign in normally.
    await Promise.race([
      page.waitForURL(/\/admin$/),
      page.getByText("schon vergeben").waitFor(),
      page.waitForURL(/\/admin\/login/),
    ]);
    if (!/\/admin$/.test(page.url())) {
      await page.goto("/admin/login");
      await page.getByLabel("E-Mail-Adresse").fill(E2E_ADMIN.email);
      await page.getByLabel("Passwort").fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Anmelden" }).click();
    }
  } else {
    await page.getByLabel("E-Mail-Adresse").fill(E2E_ADMIN.email);
    await page.getByLabel("Passwort").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Anmelden" }).click();
  }
  // argon2id is slow on purpose; with every worker signing in at once it takes a moment.
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
}

// Reticle's dev overlays can swallow clicks; hide them as e2e/features.spec.ts does.
export async function hideDevOverlays(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent =
        "[data-reticle-tour], [data-reticle-overlay] { display: none !important; }";
      document.head.append(style);
    });
  });
}

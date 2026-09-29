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
  } else {
    await page.getByLabel("E-Mail-Adresse").fill(E2E_ADMIN.email);
    await page.getByLabel("Passwort").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Anmelden" }).click();
  }
  await expect(page).toHaveURL(/\/admin$/);
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

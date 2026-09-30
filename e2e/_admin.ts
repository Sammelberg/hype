import { expect, type Page } from "@playwright/test";

import { E2E_ADMIN } from "../scripts/seed-data";

export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? E2E_ADMIN.fallbackPassword;

// Signs in as the e2e admin (created before the run by scripts/prepare-e2e.ts).
export async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("E-Mail-Adresse").fill(E2E_ADMIN.email);
  await page.getByLabel("Passwort").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
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

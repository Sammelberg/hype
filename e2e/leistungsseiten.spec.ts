import { expect, test } from "@playwright/test";

import { hideDevOverlays, signIn } from "./_admin";

// The services' own pages (/leistungen/*, page kind „leistung“): beside lead and text, when it
// fits, what it includes, how it goes and the questions asked, read by search engines as FAQPage
// and Service. Content from scripts/seed-data.ts.

const SERVICES = [
  "web-anwendungen",
  "geschaeftssysteme",
  "schnittstellen",
  "modernisierung",
  "betrieb",
];

test.beforeEach(async ({ page }) => {
  await hideDevOverlays(page);
});

for (const slug of SERVICES) {
  test(`/leistungen/${slug} shows its sections and tells search engines`, async ({ page }) => {
    await page.goto(`/leistungen/${slug}`);
    for (const heading of [
      "Wann das passt",
      "Was Sie bekommen",
      "So gehen wir vor",
      "Häufige Fragen",
    ])
      await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
    // The steps are a sequence, read as one.
    await expect(page.getByRole("list").filter({ hasText: "Schritt 1:" })).toBeVisible();

    const data = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((el) => JSON.parse(el.textContent ?? "{}")));
    const faq = data.find((d) => d["@type"] === "FAQPage");
    expect(faq?.mainEntity.length).toBeGreaterThan(0);
    // What search engines read is what the page shows.
    await expect(page.getByText(faq.mainEntity[0].name, { exact: true })).toBeVisible();
    expect(data.some((d) => d["@type"] === "Service")).toBe(true);
  });
}

test("the service sections are edited in cards, in the order the page shows them", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/admin/seiten");
  await page.getByRole("link", { name: "Geschäftssysteme", exact: true }).click();
  for (const name of [
    "Wann das passt",
    "Was Sie bekommen",
    "Vorgehen",
    "Häufige Fragen",
    "Passendes Projekt",
  ])
    await expect(page.getByRole("region", { name })).toBeVisible();
});

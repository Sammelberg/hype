// The site settings: one document in one row. `data` is live, `draft` the working copy.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { siteSettings } from "../db/schema";
import { type SiteSettings, SiteSettingsSchema } from "./types";
import { addVersion } from "./versions";

const ID = 1;

export async function getSiteSettings(draft = false): Promise<SiteSettings | null> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, ID)).limit(1);
  if (!row) return null;
  const doc = draft && row.draft ? row.draft : row.data;
  const parsed = SiteSettingsSchema.safeParse(doc);
  if (parsed.success) return parsed.data;
  const live = SiteSettingsSchema.safeParse(row.data);
  return live.success ? live.data : (row.data as SiteSettings);
}

export async function getSiteSettingsForEditing(): Promise<{
  editing: SiteSettings;
  hasDraft: boolean;
  updatedAt: Date;
} | null> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, ID)).limit(1);
  if (!row) return null;
  return {
    editing: SiteSettingsSchema.parse(row.draft ?? row.data),
    hasDraft: row.draft !== null,
    updatedAt: row.updatedAt,
  };
}

export async function saveSiteSettingsDraft(raw: SiteSettings) {
  const data = SiteSettingsSchema.parse(raw);
  await db
    .update(siteSettings)
    .set({ draft: data, updatedAt: new Date() })
    .where(eq(siteSettings.id, ID));
}

export async function publishSiteSettings(userId: number | null) {
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(siteSettings).where(eq(siteSettings.id, ID)).limit(1);
    if (!row) throw new Error("Die Website-Einstellungen fehlen.");
    const data = SiteSettingsSchema.parse(row.draft ?? row.data);
    await tx
      .update(siteSettings)
      .set({ data, draft: null, updatedAt: new Date() })
      .where(eq(siteSettings.id, ID));
    await addVersion(tx, {
      collection: "site_settings",
      docId: ID,
      snapshot: data,
      kind: "published",
      userId,
    });
  });
}

export async function discardSiteSettingsDraft() {
  await db
    .update(siteSettings)
    .set({ draft: null, updatedAt: new Date() })
    .where(eq(siteSettings.id, ID));
}

export async function restoreSiteSettingsVersion(snapshot: unknown, userId: number | null) {
  const data = SiteSettingsSchema.parse(snapshot);
  await db.transaction(async (tx) => {
    await tx
      .update(siteSettings)
      .set({ draft: data, updatedAt: new Date() })
      .where(eq(siteSettings.id, ID));
    await addVersion(tx, {
      collection: "site_settings",
      docId: ID,
      snapshot: data,
      kind: "restored",
      userId,
    });
  });
}

// Seed and import: the live document, no draft.
export async function upsertSiteSettings(raw: SiteSettings) {
  const data = SiteSettingsSchema.parse(raw);
  await db
    .insert(siteSettings)
    .values({ id: ID, data })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { data, draft: null, updatedAt: new Date() },
    });
}

// The texts a fresh site starts with (the seed fills the rest); also what the site shows
// while the settings row does not exist yet.
export const SITE_TEXT_DEFAULTS = {
  cta: {
    title: "Erzählen Sie uns von Ihrem Vorhaben.",
    text: "Wir melden uns mit einer ersten Einschätzung und einem Vorschlag für das weitere Vorgehen.",
    label: "Projekt anfragen",
  },
  hero: {
    headline: "Wir entwickeln",
    headlineEnd: "für den Mittelstand.",
    lead: "Individuelle Software aus dem Schwarzwald.",
  },
  servicesTitle: "Was wir entwickeln",
  servicesIntro:
    "Von der einzelnen Schnittstelle bis zur kompletten Plattform – geplant für Ihre Abläufe, nicht für einen Standardfall.",
  stepsTitle: "So arbeiten wir",
  principlesTitle: "Unsere Grundsätze",
  projekteLead: "Ausgewählte Projekte, die wir für unsere Kundinnen und Kunden gebaut haben.",
  projekteEmpty: "Hier stellen wir bald unsere ersten Projekte vor.",
  kontaktLead:
    "Erzählen Sie uns von Ihrem Vorhaben. Wir melden uns mit einer ersten Einschätzung und einem Vorschlag für das weitere Vorgehen.",
  kontaktNextTitle: "Was danach passiert",
} as const;

export function emptySiteSettings(siteName = "Website"): SiteSettings {
  const d = SITE_TEXT_DEFAULTS;
  return {
    siteName,
    ownerName: siteName,
    tagline: null,
    description: null,
    contactEmail: null,
    socialLinks: [],
    cta: { ...d.cta },
    hero: { ...d.hero, words: [] },
    servicesTitle: d.servicesTitle,
    servicesIntro: d.servicesIntro,
    services: [],
    stepsTitle: d.stepsTitle,
    steps: [],
    principlesTitle: d.principlesTitle,
    principles: [],
    faq: [],
    projekteLead: d.projekteLead,
    projekteEmpty: d.projekteEmpty,
    kontaktLead: d.kontaktLead,
    kontaktNext: { title: d.kontaktNextTitle, text: null },
  };
}

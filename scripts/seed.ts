// `pnpm seed` — fills a development database with the site's content (scripts/seed-data.ts).
// Idempotent: re-running overwrites pages, the form, the redirect and the settings by their slug
// or title, so on a database with real content update single pages in /admin instead.
// Refuses to run against a non-local database unless CI=true or --force is given.
// Creates no users: the first admin signs up at /admin/einrichtung.
import { randomBytes } from "node:crypto";

import { upsertForm } from "../src/cms/content/forms";
import { listPublishedPages, upsertPublishedPage } from "../src/cms/content/pages";
import { upsertPublishedProjekt } from "../src/cms/content/projekte";
import { upsertRedirect } from "../src/cms/content/redirects";
import { SITE_TEXT_DEFAULTS, upsertSiteSettings } from "../src/cms/content/site-settings";
import type { SiteSettings } from "../src/cms/content/types";
import {
  lexical,
  SEED_REDIRECT,
  seedContactForm,
  seedPages,
  seedProjects,
  seedSettings,
} from "./seed-data";

function assertSafeTarget() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (local || process.env.CI === "true" || process.argv.includes("--force")) return;
  throw new Error(
    `Seed abgebrochen: ${url.hostname} ist keine lokale Datenbank. Mit --force erzwingen.`,
  );
}

const id = () => randomBytes(8).toString("hex");
const withIds = <T extends object>(items: readonly T[]) =>
  items.map((item) => ({ id: id(), ...item }));

function settings(): SiteSettings {
  const d = SITE_TEXT_DEFAULTS;
  return {
    siteName: seedSettings.siteName,
    ownerName: seedSettings.ownerName,
    tagline: seedSettings.tagline,
    description: seedSettings.description,
    contactEmail: seedSettings.contactEmail,
    socialLinks: withIds(seedSettings.socialLinks),
    cta: { ...d.cta },
    hero: { ...d.hero, words: withIds(seedSettings.hero.words) },
    servicesTitle: d.servicesTitle,
    servicesIntro: d.servicesIntro,
    services: seedSettings.services.map((s) => ({ id: id(), ...s, examples: withIds(s.examples) })),
    stepsTitle: d.stepsTitle,
    steps: withIds(seedSettings.steps),
    principlesTitle: d.principlesTitle,
    principles: withIds(seedSettings.principles),
    faq: withIds(seedSettings.faq),
    projekteLead: d.projekteLead,
    projekteEmpty: d.projekteEmpty,
    kontaktLead: d.kontaktLead,
    kontaktNext: { title: d.kontaktNextTitle, text: seedSettings.kontaktNext.text },
  };
}

async function main() {
  assertSafeTarget();

  await upsertSiteSettings(settings());

  // Parents first, so children can point at them.
  const ids = new Map<string, number>();
  for (const page of [...seedPages].sort((a, b) => Number(!!a.parent) - Number(!!b.parent))) {
    const parentId = page.parent ? (ids.get(page.parent) ?? null) : null;
    const pageId = await upsertPublishedPage({
      title: page.title,
      slug: page.slug,
      parentId,
      lead: null,
      content: lexical(page.content),
      meta: {},
    });
    ids.set(page.slug, pageId);
  }

  for (const project of seedProjects) {
    await upsertPublishedProjekt({
      title: project.title,
      slug: project.slug,
      kunde: project.kunde,
      summary: project.summary,
      content: lexical(project.content),
      meta: {},
    });
  }

  const { confirmation, ...form } = seedContactForm;
  await upsertForm({
    title: form.title,
    submitButtonLabel: form.submitButtonLabel,
    fields: withIds(form.fields),
    confirmationMessage: lexical(confirmation),
  });

  const target = ids.get(SEED_REDIRECT.toPage);
  if (target) {
    await upsertRedirect({
      from: SEED_REDIRECT.from,
      type: 301,
      toPageId: target,
      toProjektId: null,
      toUrl: null,
    });
  }

  const published = await listPublishedPages();
  console.log(
    `Seed fertig: ${seedPages.length} Seiten (${published.length} veröffentlicht), ${seedProjects.length} Projekt(e), Kontaktformular, Weiterleitung, Website-Einstellungen.`,
  );
}

await main();
process.exit(0);

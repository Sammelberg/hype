// `pnpm seed` — fills a development database with the site's content (scripts/seed-data.ts).
// Idempotent: re-running overwrites pages, the form, the redirect and the settings by their slug
// or title, so on a database with real content update single pages in /admin instead.
// Refuses to run against a non-local database unless CI=true or --force is given.
// Creates no users (except the e2e account in CI): the first admin comes from
// `pnpm cms:passwort <e-mail> --anlegen`.
import { randomBytes } from "node:crypto";

import { createUser, findUserByEmail } from "../src/cms/auth/users";
import { upsertForm } from "../src/cms/content/forms";
import {
  defaultSections,
  HOME_DEFAULTS,
  LEISTUNG_DEFAULTS,
  ROUTED_LEADS,
} from "../src/cms/content/page-sections";
import { kindOf } from "../src/cms/content/page-tree";
import {
  getPage,
  listPages,
  listPublishedPages,
  ordnePages,
  publishPage,
  saveDraft,
  upsertPublishedPage,
} from "../src/cms/content/pages";
import { getProjektBySlug, upsertPublishedProjekt } from "../src/cms/content/projekte";
import { upsertRedirect } from "../src/cms/content/redirects";
import { SITE_TEXT_DEFAULTS, upsertSiteSettings } from "../src/cms/content/site-settings";
import type { PageSections, SiteSettings } from "../src/cms/content/types";
import {
  lexical,
  SEED_NAV_ORDER,
  SEED_REDIRECT,
  SEED_RENAMED,
  seedContactForm,
  seedPages,
  seedProjects,
  seedSections,
  seedSettings,
  type SeedPage,
  E2E_ADMIN,
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
  return {
    siteName: seedSettings.siteName,
    ownerName: seedSettings.ownerName,
    tagline: seedSettings.tagline,
    description: seedSettings.description,
    contactEmail: seedSettings.contactEmail,
    socialLinks: withIds(seedSettings.socialLinks),
    cta: { ...SITE_TEXT_DEFAULTS.cta },
  };
}

// The sections and the lead of the pages with a route of their own; content pages have neither.
// A page's lead and sections: a routed page's from the seed's sections, a service's page from its
// `leistung` block (its project linked by slug when it exists, published), any other page none.
async function fieldsOf(
  page: SeedPage,
): Promise<{ lead: string | null; sections: PageSections | null }> {
  if (!page.leistung) {
    const own = routed(page.slug);
    return { lead: own.lead ?? page.lead ?? null, sections: own.sections };
  }
  const l = page.leistung;
  const projekt = l.projekt ? await getProjektBySlug(l.projekt) : null;
  return {
    lead: page.lead ?? null,
    sections: {
      ...LEISTUNG_DEFAULTS,
      fit: withIds(l.fit),
      scope: withIds(l.scope.map((text) => ({ text }))),
      steps: withIds(l.steps),
      faq: withIds(l.faq),
      projektId: projekt?.id ?? null,
    },
  };
}

function routed(slug: string): { lead: string | null; sections: PageSections | null } {
  const kind = kindOf(slug);
  const s = seedSections;
  if (kind === "home")
    return {
      lead: null,
      sections: {
        ...HOME_DEFAULTS,
        hero: { ...HOME_DEFAULTS.hero, words: withIds(s.hero.words) },
        eRechnungTitle: s.eRechnung.title,
        eRechnungLead: s.eRechnung.lead,
        milestones: withIds(s.eRechnung.milestones),
        steps: withIds(s.steps),
        principles: withIds(s.principles),
      },
    };
  if (kind === "leistungen")
    return {
      lead: ROUTED_LEADS.leistungen,
      sections: {
        kind,
        services: s.services.map((x) => ({ id: id(), ...x, examples: withIds(x.examples) })),
        faq: withIds(s.faq),
      },
    };
  if (kind === "projekte") return { lead: ROUTED_LEADS.projekte, sections: defaultSections(kind) };
  if (kind === "kontakt")
    return {
      lead: ROUTED_LEADS.kontakt,
      sections: { ...defaultSections(kind), nextText: s.kontaktNext.text },
    };
  return { lead: null, sections: null };
}

// A page whose slug the seed changed is moved, not doubled: saved under its new slug and published
// as an edit in /admin would be, so its old address redirects to it (redirectMoves).
async function moveRenamedPages() {
  for (const { from, to } of SEED_RENAMED) {
    const all = await listPages();
    const old = all.find((p) => p.slug === from);
    if (!old || all.some((p) => p.slug === to)) continue;
    const found = await getPage(old.id);
    if (!found) continue;
    await saveDraft(old.id, { ...found.editing, slug: to });
    await publishPage(old.id, null);
    console.log(`Seite „${from}“ nach „${to}“ verschoben; die alte Adresse leitet weiter.`);
  }
}

// `pnpm seed --nur <slug>`: that one page from the seed, nothing else — for a database with real
// content, where a full seed would overwrite what was edited in /admin (the Datenschutzerklärung
// after a change to what the site does, for instance). Its parent must exist already.
async function onlyPage(slug: string) {
  const page = seedPages.find((p) => p.slug === slug);
  if (!page) throw new Error(`Keine Seite „${slug}“ im Seed.`);
  await moveRenamedPages();
  const existing = await listPages();
  const parentId = page.parent ? (existing.find((p) => p.slug === page.parent)?.id ?? null) : null;
  if (page.parent && parentId === null) throw new Error(`Die Elternseite „${page.parent}“ fehlt.`);
  await upsertPublishedPage({
    title: page.title,
    slug: page.slug,
    parentId,
    content: page.content.length > 0 ? lexical(page.content) : null,
    meta: {},
    ...(await fieldsOf(page)),
  });
  console.log(`Seite „${slug}“ aus dem Seed übernommen und veröffentlicht.`);
}

async function main() {
  assertSafeTarget();

  // `pnpm seed --reihenfolge`: only the navigation's order from SEED_NAV_ORDER — for a database
  // with real content, after new top-level pages came in with `--nur`.
  if (process.argv.includes("--reihenfolge")) {
    const top = (await listPages()).filter((p) => p.parent === null);
    const first = SEED_NAV_ORDER.flatMap((slug) => top.filter((p) => p.slug === slug));
    const rest = top.filter((p) => !first.includes(p)).sort((a, b) => a.sortOrder - b.sortOrder);
    await ordnePages(
      null,
      [...first, ...rest].map((p) => p.id),
    );
    console.log(`Reihenfolge übernommen: ${first.map((p) => p.slug).join(", ")}.`);
    return;
  }

  const only = process.argv[process.argv.indexOf("--nur") + 1];
  if (process.argv.includes("--nur")) {
    if (!only) throw new Error("Aufruf: pnpm seed --nur <slug>");
    return onlyPage(only);
  }

  await upsertSiteSettings(settings());
  await moveRenamedPages();

  // Parents first, so children can point at them.
  const ids = new Map<string, number>();
  for (const page of [...seedPages].sort((a, b) => Number(!!a.parent) - Number(!!b.parent))) {
    const parentId = page.parent ? (ids.get(page.parent) ?? null) : null;
    const pageId = await upsertPublishedPage({
      title: page.title,
      slug: page.slug,
      parentId,
      content: page.content.length > 0 ? lexical(page.content) : null,
      meta: {},
      ...(await fieldsOf(page)),
    });
    ids.set(page.slug, pageId);
  }
  // The navigation's order of the sections; every other top-level page after them.
  await ordnePages(
    null,
    SEED_NAV_ORDER.map((slug) => ids.get(slug)).filter((id): id is number => id !== undefined),
  );

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
      type: 308,
      toPageId: target,
      toProjektId: null,
      toUrl: null,
    });
  }

  // Test account for the e2e run, never without the variable, never twice.
  if (process.env.E2E_ADMIN_PASSWORD && !(await findUserByEmail(E2E_ADMIN.email))) {
    await createUser({
      email: E2E_ADMIN.email,
      name: "E2E Admin",
      password: process.env.E2E_ADMIN_PASSWORD,
      role: "admin",
    });
  }

  const published = await listPublishedPages();
  console.log(
    `Seed fertig: ${seedPages.length} Seiten (${published.length} veröffentlicht), ${seedProjects.length} Projekt(e), Kontaktformular, Weiterleitung, Website-Einstellungen.`,
  );
}

await main();
process.exit(0);

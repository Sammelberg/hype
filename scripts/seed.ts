// `pnpm seed` — fills a development database with fictional content (scripts/seed-data.ts).
// Idempotent: re-running updates documents by slug and reuses the generated image.
// Refuses to run against a non-local database unless CI=true or --force is given.
// Creates no users: the first admin signs up at /admin.
import { getPayload, type Payload } from "payload";

import config from "../src/payload.config";
import {
  lexical,
  SEED_REDIRECT,
  seedContactForm,
  seedPages,
  seedProjects,
  seedSettings,
} from "./seed-data";

const context = { disableRevalidate: true };

function assertSafeTarget() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (local || process.env.CI === "true" || process.argv.includes("--force")) return;
  throw new Error(
    `Seed abgebrochen: ${url.hostname} ist keine lokale Datenbank. Mit --force erzwingen.`,
  );
}

async function upsertBySlug<C extends "pages" | "projekte">(
  payload: Payload,
  collection: C,
  slug: string,
  data: Record<string, unknown>,
) {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    draft: true,
  });
  const doc = existing.docs[0];
  const body = { ...data, slug, _status: "published" } as never;
  return doc
    ? payload.update({ collection, id: doc.id, data: body, context })
    : payload.create({ collection, data: body, context });
}

async function main() {
  assertSafeTarget();
  const payload = await getPayload({ config });

  await payload.updateGlobal({ slug: "site-settings", data: seedSettings, context });

  // Parents first, so children can reference them (nested-docs builds the breadcrumbs).
  const ids = new Map<string, number | string>();
  for (const page of [...seedPages].sort((a, b) => Number(!!a.parent) - Number(!!b.parent))) {
    const parent = page.parent ? ids.get(page.parent) : undefined;
    const doc = await upsertBySlug(payload, "pages", page.slug, {
      title: page.title,
      content: lexical(page.content),
      ...(parent ? { parent } : {}),
    });
    ids.set(page.slug, doc.id);
  }

  for (const project of seedProjects) {
    await upsertBySlug(payload, "projekte", project.slug, {
      title: project.title,
      kunde: project.kunde,
      summary: project.summary,
      content: lexical(project.content),
    });
  }

  const form = await payload.find({
    collection: "forms",
    where: { title: { equals: seedContactForm.title } },
    limit: 1,
  });
  const { confirmation, ...formData } = seedContactForm;
  const formBody = { ...formData, confirmationMessage: lexical(confirmation) } as never;
  if (form.docs[0]) {
    await payload.update({ collection: "forms", id: form.docs[0].id, data: formBody, context });
  } else {
    await payload.create({ collection: "forms", data: formBody, context });
  }

  const target = ids.get(SEED_REDIRECT.toPage);
  const redirect = await payload.find({
    collection: "redirects",
    where: { from: { equals: SEED_REDIRECT.from } },
    limit: 1,
  });
  if (target && !redirect.docs[0]) {
    await payload.create({
      collection: "redirects",
      data: {
        from: SEED_REDIRECT.from,
        type: "301",
        to: { type: "reference", reference: { relationTo: "pages", value: target as number } },
      },
      context,
    });
  }

  payload.logger.info(
    `Seed fertig: ${seedPages.length} Seiten, ${seedProjects.length} Projekt(e), Kontaktformular, Weiterleitung, Website-Einstellungen.`,
  );
}

await main();
process.exit(0);

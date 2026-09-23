// `pnpm seed` — fills a development database with fictional content (scripts/seed-data.ts).
// Idempotent: re-running updates documents by slug and reuses generated images.
// Refuses to run against a non-local database unless CI=true or --force is given.
// Creates no users: the first admin signs up at /admin.
import { getPayload, type Payload } from "payload";
import sharp from "sharp";

import config from "../payload.config";
import { lexical, seedPages, seedProjects, seedSettings, type SeedProject } from "./seed-data";

const context = { disableRevalidate: true };

function assertSafeTarget() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (local || process.env.CI === "true" || process.argv.includes("--force")) return;
  throw new Error(
    `Seed abgebrochen: ${url.hostname} ist keine lokale Datenbank. Mit --force erzwingen.`,
  );
}

// Abstract golden-rectangle artwork, generated locally (no stock-photo service).
async function artwork([a, b]: [string, string], variant: number) {
  const w = 1920;
  const h = 1187;
  const fib = [89, 144, 233, 377, 610];
  const circles = fib
    .map((r, i) => {
      const cx = ((i * 0.618 + variant * 0.382) % 1) * w;
      const cy = ((i * 0.382 + variant * 0.618) % 1) * h;
      return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r}" fill="${b}" fill-opacity="${0.08 + i * 0.04}"/>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}" stop-opacity="0.55"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="${a}"/><rect width="100%" height="100%" fill="url(#g)"/>${circles}
  </svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
}

async function upsertMedia(
  payload: Payload,
  filename: string,
  alt: string,
  data: () => Promise<Buffer>,
) {
  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
  });
  if (existing.docs[0]) return existing.docs[0].id;
  const buffer = await data();
  const doc = await payload.create({
    collection: "media",
    data: { alt },
    file: { data: buffer, mimetype: "image/webp", name: filename, size: buffer.length },
    context,
  });
  return doc.id;
}

async function upsertBySlug<C extends "projects" | "pages">(
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

async function seedProject(payload: Payload, p: SeedProject) {
  const cover = await upsertMedia(
    payload,
    `seed-${p.slug}.webp`,
    `Abstrakte Grafik zum Projekt ${p.title}`,
    () => artwork(p.palette, 0),
  );
  const gallery = [];
  for (let i = 1; i <= p.galleryCount; i++) {
    gallery.push(
      await upsertMedia(payload, `seed-${p.slug}-${i}.webp`, `${p.title}, Abbildung ${i}`, () =>
        artwork(p.palette, i),
      ),
    );
  }
  await upsertBySlug(payload, "projects", p.slug, {
    title: p.title,
    summary: p.summary,
    year: p.year,
    role: p.role,
    client: p.client,
    tags: p.tags,
    featured: p.featured,
    cover,
    gallery,
    content: lexical(p.content),
  });
}

async function main() {
  assertSafeTarget();
  const payload = await getPayload({ config });

  await payload.updateGlobal({ slug: "site-settings", data: seedSettings, context });

  for (const project of seedProjects) await seedProject(payload, project);

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

  payload.logger.info(
    `Seed fertig: ${seedProjects.length} Projekte, ${seedPages.length} Seiten, Website-Einstellungen.`,
  );
}

await main();
process.exit(0);

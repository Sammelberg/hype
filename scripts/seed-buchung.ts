// `pnpm seed` runs this after kern's seed: the booking engine's development data
// (scripts/seed-buchung-data.ts). Idempotent: upserts by slug or code, links the placeholder
// performers to their characters. Skipped with `--nur <slug>` (that flag is for one CMS page).
// Refuses a non-local database unless CI=true or --force, like kern's seed.
import { eq } from "drizzle-orm";

import { db } from "../src/cms/db/client";
import {
  darsteller,
  darstellerFiguren,
  extras,
  figuren,
  pakete,
  staedte,
  zonen,
} from "../src/buchung/db/schema";
import {
  seedDarsteller,
  seedExtras,
  seedFiguren,
  seedPakete,
  seedStaedte,
  seedZonen,
} from "./seed-buchung-data";

const url = new URL(process.env.DATABASE_URL ?? "");
const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
if (!local && process.env.CI !== "true" && !process.argv.includes("--force")) {
  throw new Error(
    `Seed abgebrochen: ${url.hostname} ist keine lokale Datenbank. Mit --force erzwingen.`,
  );
}
if (process.argv.includes("--nur")) process.exit(0);

await db.transaction(async (tx) => {
  for (const z of seedZonen) {
    await tx.insert(zonen).values(z).onConflictDoUpdate({ target: zonen.code, set: z });
  }
  for (const [i, s] of seedStaedte.entries()) {
    const werte = {
      name: s.name,
      slug: s.slug,
      zoneCode: s.zoneCode,
      seite: Boolean(s.seite),
      intro: s.seite?.intro ?? null,
      bezirke: s.seite?.bezirke ?? null,
      orte: s.seite?.orte ?? null,
      bedingungen: s.seite?.bedingungen ?? null,
      sort: i,
      updatedAt: new Date(),
    };
    await tx.insert(staedte).values(werte).onConflictDoUpdate({ target: staedte.slug, set: werte });
  }
  for (const p of seedPakete) {
    const werte = { ...p, aktiv: true, updatedAt: new Date() };
    await tx.insert(pakete).values(werte).onConflictDoUpdate({ target: pakete.slug, set: werte });
  }
  for (const x of seedExtras) {
    const werte = { beschreibung: null, ...x, aktiv: true, updatedAt: new Date() };
    await tx.insert(extras).values(werte).onConflictDoUpdate({ target: extras.slug, set: werte });
  }
  for (const f of seedFiguren) {
    const werte = { ...f, aktiv: true, updatedAt: new Date() };
    await tx.insert(figuren).values(werte).onConflictDoUpdate({ target: figuren.slug, set: werte });
  }

  const figurIds = new Map(
    (await tx.select({ id: figuren.id, slug: figuren.slug }).from(figuren)).map((f) => [
      f.slug,
      f.id,
    ]),
  );
  for (const d of seedDarsteller) {
    const [vorhanden] = await tx.select().from(darsteller).where(eq(darsteller.name, d.name));
    const person =
      vorhanden ??
      (
        await tx.insert(darsteller).values({ name: d.name, prioritaet: d.prioritaet }).returning()
      )[0]!;
    await tx.delete(darstellerFiguren).where(eq(darstellerFiguren.darstellerId, person.id));
    const ids = d.figuren.map((slug) => figurIds.get(slug)).filter((x): x is number => Boolean(x));
    if (ids.length > 0) {
      await tx
        .insert(darstellerFiguren)
        .values(ids.map((figurId) => ({ darstellerId: person.id, figurId })));
    }
  }
});

console.log(
  `Buchung: ${seedZonen.length} Zonen, ${seedStaedte.length} Orte, ${seedPakete.length} Pakete, ` +
    `${seedExtras.length} Extras, ${seedFiguren.length} Figuren, ${seedDarsteller.length} Darsteller.`,
);
process.exit(0);

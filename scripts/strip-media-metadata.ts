// `pnpm cms:metadaten-entfernen [--schreiben] [--force]` — removes EXIF, GPS, XMP and IPTC from
// originals uploaded before the store dropped them (src/cms/media/store.ts). Without --schreiben
// it only lists what it would change. Idempotent: a clean file is left as it is. The variants
// were always written without metadata. Local databases only, unless --force.
import { readFile, writeFile } from "node:fs/promises";

import { eq } from "drizzle-orm";
import sharp from "sharp";

import { db } from "../src/cms/db/client";
import { media } from "../src/cms/db/schema";
import { mediaFilePath } from "../src/cms/media/paths";
import { withoutMetadata } from "../src/cms/media/store";

const write = process.argv.includes("--schreiben");
const url = new URL(process.env.DATABASE_URL ?? "");
if (
  !["localhost", "127.0.0.1", "::1"].includes(url.hostname) &&
  !process.argv.includes("--force")
) {
  throw new Error(
    `Abgebrochen: ${url.hostname} ist keine lokale Datenbank. Mit --force erzwingen.`,
  );
}

let found = 0;
for (const row of await db.select().from(media)) {
  let bytes: Buffer;
  try {
    bytes = await readFile(mediaFilePath(row.filename));
  } catch {
    console.warn(`fehlt auf der Platte: ${row.filename}`);
    continue;
  }
  const meta = await sharp(bytes).metadata();
  const carries = [meta.exif && "EXIF", meta.xmp && "XMP", meta.iptc && "IPTC"].filter(Boolean);
  if (carries.length === 0) continue;
  found++;
  console.log(`${row.filename}: ${carries.join(", ")}${write ? " → entfernt" : ""}`);
  if (!write) continue;
  const clean = await withoutMetadata(bytes, row.mimeType);
  await writeFile(mediaFilePath(row.filename), clean);
  await db
    .update(media)
    .set({ filesize: clean.length, updatedAt: new Date() })
    .where(eq(media.id, row.id));
}
console.log(
  found === 0
    ? "Keine Datei mit Metadaten."
    : write
      ? `${found} Datei(en) bereinigt.`
      : `${found} Datei(en) mit Metadaten. Mit --schreiben bereinigen.`,
);
process.exit(0);

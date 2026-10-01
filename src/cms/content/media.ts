import { desc, eq, inArray, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { media, pages, projekte } from "../db/schema";
import { toMediaDoc } from "./media-doc";
import type { MediaDoc, MediaSizes, MediaVerwendung } from "./types";

export type MediaRecord = {
  filename: string;
  mimeType: string;
  filesize: number;
  width: number | null;
  height: number | null;
  alt: string;
  focalX?: number;
  focalY?: number;
  ordner?: string | null;
  sizes: MediaSizes;
};

export async function listMedia(): Promise<MediaDoc[]> {
  const rows = await db.select().from(media).orderBy(desc(media.createdAt));
  return rows.map(toMediaDoc);
}

// id → doc for the images a set of documents references (one query for a whole list).
export async function mediaByIds(ids: (number | null)[], client: Db | Tx = db) {
  const wanted = [...new Set(ids.filter((id): id is number => id !== null))];
  if (wanted.length === 0) return new Map<number, MediaDoc>();
  const rows = await client.select().from(media).where(inArray(media.id, wanted));
  return new Map(rows.map((row) => [row.id, toMediaDoc(row)]));
}

export async function createMedia(record: MediaRecord, client: Db | Tx = db): Promise<MediaDoc> {
  const [row] = await client.insert(media).values(record).returning();
  return toMediaDoc(row!);
}

export async function updateMedia(
  id: number,
  patch: Partial<Pick<MediaRecord, "alt" | "focalX" | "focalY" | "ordner">>,
): Promise<MediaDoc | null> {
  const [row] = await db
    .update(media)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(media.id, id))
    .returning();
  return row ? toMediaDoc(row) : null;
}

// Removes the row; the caller deletes the files (media/store.ts) once this succeeded.
export async function deleteMedia(id: number, client: Db | Tx = db): Promise<MediaDoc | null> {
  const [row] = await client.delete(media).where(eq(media.id, id)).returning();
  return row ? toMediaDoc(row) : null;
}

/**
 * Where each image is used: as the share image of a page or a project, live or in a draft.
 * One query per collection for the whole library.
 */
export async function mediaVerwendung(): Promise<Map<number, MediaVerwendung[]>> {
  const bild = (t: typeof pages | typeof projekte) =>
    sql<number | null>`nullif(${t.draft} -> 'meta' ->> 'imageId', '')::int`;
  const [p, q] = await Promise.all([
    db
      .select({ id: pages.id, titel: pages.title, live: pages.metaImageId, entwurf: bild(pages) })
      .from(pages)
      .where(
        sql`${pages.metaImageId} is not null or ${pages.draft} -> 'meta' ->> 'imageId' is not null`,
      ),
    db
      .select({
        id: projekte.id,
        titel: projekte.title,
        live: projekte.metaImageId,
        entwurf: bild(projekte),
      })
      .from(projekte)
      .where(
        sql`${projekte.metaImageId} is not null or ${projekte.draft} -> 'meta' ->> 'imageId' is not null`,
      ),
  ]);
  const map = new Map<number, MediaVerwendung[]>();
  const add = (mediaId: number | null, v: MediaVerwendung) => {
    if (!mediaId) return;
    const liste = map.get(mediaId) ?? [];
    if (!liste.some((x) => x.art === v.art && x.id === v.id)) liste.push(v);
    map.set(mediaId, liste);
  };
  for (const [art, rows] of [
    ["seite", p],
    ["projekt", q],
  ] as const) {
    for (const r of rows) {
      add(r.live, { art, id: r.id, titel: r.titel, entwurf: false });
      if (r.entwurf !== r.live) add(r.entwurf, { art, id: r.id, titel: r.titel, entwurf: true });
    }
  }
  return map;
}

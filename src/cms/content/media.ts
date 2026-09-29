import { desc, eq, inArray } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { media } from "../db/schema";
import { toMediaDoc } from "./media-doc";
import type { MediaDoc, MediaSizes } from "./types";

export type MediaRecord = {
  filename: string;
  mimeType: string;
  filesize: number;
  width: number | null;
  height: number | null;
  alt: string;
  focalX?: number;
  focalY?: number;
  sizes: MediaSizes;
};

export async function listMedia(): Promise<MediaDoc[]> {
  const rows = await db.select().from(media).orderBy(desc(media.createdAt));
  return rows.map(toMediaDoc);
}

export async function getMedia(id: number): Promise<MediaDoc | null> {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row ? toMediaDoc(row) : null;
}

// id → doc for the images a set of documents references (one query for a whole list).
export async function mediaByIds(ids: (number | null)[], client: Db | Tx = db) {
  const wanted = [...new Set(ids.filter((id): id is number => id !== null))];
  if (wanted.length === 0) return new Map<number, MediaDoc>();
  const rows = await client.select().from(media).where(inArray(media.id, wanted));
  return new Map(rows.map((row) => [row.id, toMediaDoc(row)]));
}

export async function createMedia(record: MediaRecord): Promise<MediaDoc> {
  const [row] = await db.insert(media).values(record).returning();
  return toMediaDoc(row!);
}

export async function updateMedia(
  id: number,
  patch: Partial<Pick<MediaRecord, "alt" | "focalX" | "focalY">>,
): Promise<MediaDoc | null> {
  const [row] = await db
    .update(media)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(media.id, id))
    .returning();
  return row ? toMediaDoc(row) : null;
}

// Removes the row; the caller deletes the files (media/store.ts) once this succeeded.
export async function deleteMedia(id: number): Promise<MediaDoc | null> {
  const [row] = await db.delete(media).where(eq(media.id, id)).returning();
  return row ? toMediaDoc(row) : null;
}

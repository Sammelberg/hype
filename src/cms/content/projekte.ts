// Projekte: a flat collection at /projekte/<slug>, drafts and versions like pages.
import { and, desc, eq, ne, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { projektPathOf as projektPath } from "../paths";
import { projekte, versions } from "../db/schema";
import { plainText } from "../rich-text/text";
import { mediaByIds } from "./media";
import type { MediaDoc, Projekt, ProjektInput } from "./types";
import { ProjektInputSchema } from "./types";
import { addVersion } from "./versions";
import { CmsError } from "../errors";
import { redirectMoves, redirectsOnto } from "./redirects";

type Row = typeof projekte.$inferSelect;

export class ProjektError extends CmsError {
  constructor(message: string, field?: keyof ProjektInput) {
    super(message, field);
  }
}

const inputOf = (row: Row): ProjektInput => ({
  title: row.title,
  slug: row.slug,
  kunde: row.kunde,
  summary: row.summary,
  content: row.content,
  meta: { title: row.metaTitle, description: row.metaDescription, imageId: row.metaImageId },
});

const draftOf = (row: Row): ProjektInput | null => {
  if (!row.draft) return null;
  const parsed = ProjektInputSchema.safeParse(row.draft);
  return parsed.success ? parsed.data : null;
};

const effective = (row: Row, draft: boolean): ProjektInput =>
  draft ? (draftOf(row) ?? inputOf(row)) : inputOf(row);

function toProjekt(row: Row, images: Map<number, MediaDoc>, draft: boolean): Projekt {
  const doc = effective(row, draft);
  return {
    id: row.id,
    title: doc.title,
    slug: doc.slug,
    path: projektPath(doc.slug),
    kunde: doc.kunde,
    summary: doc.summary,
    content: doc.content,
    meta: {
      title: doc.meta.title ?? null,
      description: doc.meta.description ?? null,
      image: doc.meta.imageId ? (images.get(doc.meta.imageId) ?? null) : null,
    },
    status: row.status,
    hasDraft: row.draft !== null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function build(rows: Row[], draft: boolean, client: Db | Tx = db) {
  const images = await mediaByIds(
    rows.map((row) => effective(row, draft).meta.imageId ?? null),
    client,
  );
  return rows.map((row) => toProjekt(row, images, draft));
}

// Published projects, newest first.
export { projektPath };

export async function listPublishedProjekte(): Promise<Projekt[]> {
  const rows = await db
    .select()
    .from(projekte)
    .where(eq(projekte.status, "published"))
    .orderBy(desc(projekte.updatedAt));
  return build(rows, false);
}

export async function getProjektBySlug(slug: string, draft = false): Promise<Projekt | null> {
  if (!draft) {
    const [row] = await db
      .select()
      .from(projekte)
      .where(and(eq(projekte.slug, slug), eq(projekte.status, "published")))
      .limit(1);
    return row ? ((await build([row], false))[0] ?? null) : null;
  }
  const rows = await db.select().from(projekte);
  const row = rows.find((r) => effective(r, true).slug === slug);
  return row ? ((await build([row], true))[0] ?? null) : null;
}

export async function listProjekte(): Promise<Projekt[]> {
  const rows = await db.select().from(projekte).orderBy(desc(projekte.updatedAt));
  return build(rows, true);
}

export async function getProjekt(
  id: number,
): Promise<{ projekt: Projekt; live: Projekt; editing: ProjektInput } | null> {
  const [row] = await db.select().from(projekte).where(eq(projekte.id, id)).limit(1);
  if (!row) return null;
  const [projekt] = await build([row], true);
  const [live] = await build([row], false);
  return projekt && live ? { projekt, live, editing: effective(row, true) } : null;
}

async function assertSlugFree(client: Db | Tx, slug: string, exceptId: number | null) {
  const taken = await client
    .select({ id: projekte.id })
    .from(projekte)
    .where(
      and(
        exceptId === null ? undefined : ne(projekte.id, exceptId),
        sql`(${projekte.slug} = ${slug} or ${projekte.draft}->>'slug' = ${slug})`,
      ),
    )
    .limit(1);
  if (taken.length)
    throw new ProjektError("Dieser Pfad wird schon von einem anderen Projekt verwendet.", "slug");
}

const columnsOf = (input: ProjektInput) => ({
  title: input.title,
  slug: input.slug,
  kunde: input.kunde,
  summary: input.summary,
  content: input.content,
  contentText: input.content ? plainText(input.content) : null,
  metaTitle: input.meta.title ?? null,
  metaDescription: input.meta.description ?? null,
  metaImageId: input.meta.imageId ?? null,
  updatedAt: new Date(),
});

export async function createProjekt(
  raw: ProjektInput,
  options: { publish?: boolean; userId?: number | null } = {},
) {
  const input = ProjektInputSchema.parse(raw);
  return db.transaction(async (tx) => {
    await assertSlugFree(tx, input.slug, null);
    const [inserted] = await tx
      .insert(projekte)
      .values({
        ...columnsOf(input),
        status: options.publish ? "published" : "draft",
        publishedAt: options.publish ? new Date() : null,
      })
      .returning({ id: projekte.id });
    if (options.publish) {
      await addVersion(tx, {
        collection: "projekte",
        docId: inserted!.id,
        snapshot: input,
        kind: "published",
        userId: options.userId ?? null,
      });
    }
    return inserted!.id;
  });
}

export async function saveProjektDraft(id: number, raw: ProjektInput) {
  const input = ProjektInputSchema.parse(raw);
  await db.transaction(async (tx) => {
    await assertSlugFree(tx, input.slug, id);
    const [row] = await tx
      .update(projekte)
      .set({ draft: input, updatedAt: new Date() })
      .where(eq(projekte.id, id))
      .returning({ id: projekte.id });
    if (!row) throw new ProjektError("Das Projekt gibt es nicht mehr.");
  });
}

export type ProjektPublishResult = { pathsBefore: string[]; pathsAfter: string[] };

export async function publishProjekt(
  id: number,
  userId: number | null,
  client: Db | Tx = db,
): Promise<ProjektPublishResult> {
  return client.transaction(async (tx) => {
    const [row] = await tx.select().from(projekte).where(eq(projekte.id, id)).limit(1);
    if (!row) throw new ProjektError("Das Projekt gibt es nicht mehr.");
    const input = effective(row, true);
    ProjektInputSchema.parse(input);
    await assertSlugFree(tx, input.slug, id);
    await tx
      .update(projekte)
      .set({ ...columnsOf(input), draft: null, status: "published", publishedAt: new Date() })
      .where(eq(projekte.id, id));
    await addVersion(tx, {
      collection: "projekte",
      docId: id,
      snapshot: input,
      kind: "published",
      userId,
    });
    // A published project under a new slug: its old address leads to the new one.
    const moved = row.status === "published" && row.slug !== input.slug;
    await redirectMoves(tx, moved ? [{ from: projektPath(row.slug), to: { projektId: id } }] : [], [
      projektPath(input.slug),
    ]);
    return { pathsBefore: [projektPath(row.slug)], pathsAfter: [projektPath(input.slug)] };
  });
}

export async function unpublishProjekt(
  id: number,
  client: Db | Tx = db,
): Promise<ProjektPublishResult> {
  const [row] = await client
    .update(projekte)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(projekte.id, id))
    .returning({ slug: projekte.slug });
  if (!row) throw new ProjektError("Das Projekt gibt es nicht mehr.");
  return { pathsBefore: [projektPath(row.slug)], pathsAfter: [projektPath(row.slug)] };
}

export async function discardProjektDraft(id: number) {
  await db.update(projekte).set({ draft: null, updatedAt: new Date() }).where(eq(projekte.id, id));
}

export async function deleteProjekt(id: number, client: Db | Tx = db): Promise<string[]> {
  return client.transaction(async (tx) => {
    const onto = await redirectsOnto(tx, { projektId: id });
    if (onto.length)
      throw new ProjektError(
        `Auf dieses Projekt leiten noch Weiterleitungen: ${onto.join(", ")}. Ändern oder löschen Sie sie zuerst unter Weiterleitungen.`,
      );
    const [row] = await tx
      .delete(projekte)
      .where(eq(projekte.id, id))
      .returning({ slug: projekte.slug });
    if (!row) throw new ProjektError("Das Projekt gibt es nicht mehr.");
    // A deleted project cannot be restored from its versions; they go with it.
    await tx
      .delete(versions)
      .where(and(eq(versions.collection, "projekte"), eq(versions.docId, id)));
    return [projektPath(row.slug)];
  });
}

export async function restoreProjektVersion(id: number, snapshot: unknown, userId: number | null) {
  const input = ProjektInputSchema.parse(snapshot);
  await db.transaction(async (tx) => {
    await tx
      .update(projekte)
      .set({ draft: input, updatedAt: new Date() })
      .where(eq(projekte.id, id));
    await addVersion(tx, {
      collection: "projekte",
      docId: id,
      snapshot: input,
      kind: "restored",
      userId,
    });
  });
}

export async function upsertPublishedProjekt(
  raw: ProjektInput & { id?: number },
  userId: number | null = null,
) {
  const input = ProjektInputSchema.parse(raw);
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(projekte)
      .where(eq(projekte.slug, input.slug))
      .limit(1);
    if (existing) {
      await tx
        .update(projekte)
        .set({
          ...columnsOf(input),
          draft: null,
          status: "published",
          publishedAt: existing.publishedAt ?? new Date(),
        })
        .where(eq(projekte.id, existing.id));
      return existing.id;
    }
    const [inserted] = await tx
      .insert(projekte)
      .values({
        ...(raw.id ? { id: raw.id } : {}),
        ...columnsOf(input),
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: projekte.id });
    await addVersion(tx, {
      collection: "projekte",
      docId: inserted!.id,
      snapshot: input,
      kind: "published",
      userId,
    });
    return inserted!.id;
  });
}

// Pages: the tree the site is made of. Live columns are what the site shows; `draft` holds the
// working copy until „Veröffentlichen“ moves it into the live columns and records a version.
import { and, asc, eq, ne, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { pages, versions } from "../db/schema";
import { plainText } from "../rich-text/text";
import { mediaByIds } from "./media";
import {
  breadcrumbsOf,
  canMove,
  descendantsOf,
  HOME_SLUG,
  kindOf,
  pathOf,
  pathsOf,
  PROTECTED_SLUGS,
  sectionsProblem,
  type TreeNode,
} from "./page-tree";
import type { MediaDoc, Page, PageInput } from "./types";
import { PageInputSchema } from "./types";
import { addVersion } from "./versions";

type Row = typeof pages.$inferSelect;

export class PageError extends Error {
  constructor(
    message: string,
    public readonly field?: keyof PageInput,
  ) {
    super(message);
  }
}

const inputOf = (row: Row): PageInput => ({
  title: row.title,
  slug: row.slug,
  parentId: row.parentId,
  lead: row.lead,
  content: row.content,
  meta: { title: row.metaTitle, description: row.metaDescription, imageId: row.metaImageId },
  sections: row.sections,
});

const draftOf = (row: Row): PageInput | null => {
  if (!row.draft) return null;
  const parsed = PageInputSchema.safeParse(row.draft);
  return parsed.success ? parsed.data : null;
};

// The document as the editor (draft mode) or the site (published) sees it. A draft without
// sections (written before pages had them, or a restored old version) keeps the live ones.
const effective = (row: Row, draft: boolean): PageInput => {
  const working = draft ? draftOf(row) : null;
  if (!working) return inputOf(row);
  return working.sections === undefined ? { ...working, sections: row.sections } : working;
};

function treeOf(rows: Row[], draft: boolean): TreeNode[] {
  return rows.map((row) => {
    const doc = effective(row, draft);
    return { id: row.id, slug: doc.slug, title: doc.title, parentId: doc.parentId };
  });
}

function toPage(row: Row, tree: TreeNode[], images: Map<number, MediaDoc>, draft: boolean): Page {
  const doc = effective(row, draft);
  const paths = pathsOf(tree);
  return {
    id: row.id,
    title: doc.title,
    slug: doc.slug,
    path: paths.get(row.id) ?? pathOf(doc.slug, null),
    parent: doc.parentId,
    lead: doc.lead,
    content: doc.content,
    meta: {
      title: doc.meta.title ?? null,
      description: doc.meta.description ?? null,
      image: doc.meta.imageId ? (images.get(doc.meta.imageId) ?? null) : null,
    },
    kind: kindOf(doc.slug),
    sections: doc.sections ?? null,
    breadcrumbs: breadcrumbsOf(row.id, tree),
    status: row.status,
    hasDraft: row.draft !== null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function allRows(client: Db | Tx = db) {
  return client.select().from(pages).orderBy(asc(pages.createdAt), asc(pages.id));
}

async function build(
  rows: Row[],
  pick: Row[],
  draft: boolean,
  client: Db | Tx = db,
): Promise<Page[]> {
  const tree = treeOf(rows, draft);
  const images = await mediaByIds(
    pick.map((row) => effective(row, draft).meta.imageId ?? null),
    client,
  );
  return pick.map((row) => toPage(row, tree, images, draft));
}

// ---------------------------------------------------------------------------------------------
// Reads for the site

// Published pages, oldest first (the order the navigation and child lists use).
export async function listPublishedPages(): Promise<Page[]> {
  const rows = await allRows();
  const published = rows.filter((row) => row.status === "published");
  return build(published, published, false);
}

export async function listPublishedPaths(): Promise<string[]> {
  const rows = await db
    .select({ path: pages.path })
    .from(pages)
    .where(eq(pages.status, "published"));
  return rows.map((row) => row.path);
}

// The page at a public path. In draft mode unpublished pages and unpublished changes count,
// including a changed slug — the preview shows what publishing would produce.
export async function getPageByPath(path: string, draft = false): Promise<Page | null> {
  if (!draft) {
    const [row] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.path, path), eq(pages.status, "published")))
      .limit(1);
    if (!row) return null;
    const rows = await allRows();
    return (await build(rows, [row], false))[0] ?? null;
  }
  const rows = await allRows();
  const paths = pathsOf(treeOf(rows, true));
  const row = rows.find((r) => paths.get(r.id) === path);
  return row ? ((await build(rows, [row], true))[0] ?? null) : null;
}

export async function getHomePage(draft = false) {
  return getPageByPath("/", draft);
}

// Published pages directly below a page, in the order they were created.
export async function getChildPages(parentId: number): Promise<Page[]> {
  const rows = await allRows();
  const children = rows.filter((row) => row.parentId === parentId && row.status === "published");
  return build(rows, children, false);
}

// ---------------------------------------------------------------------------------------------
// Reads for the admin

export async function listPages(): Promise<Page[]> {
  const rows = await allRows();
  return build(rows, rows, true);
}

export async function getPage(
  id: number,
): Promise<{ page: Page; live: Page; editing: PageInput } | null> {
  const rows = await allRows();
  const row = rows.find((r) => r.id === id);
  if (!row) return null;
  const [page] = await build(rows, [row], true);
  const [live] = await build(rows, [row], false);
  return page && live ? { page, live, editing: effective(row, true) } : null;
}

// ---------------------------------------------------------------------------------------------
// Writes

async function assertSlugFree(client: Db | Tx, slug: string, exceptId: number | null) {
  const taken = await client
    .select({ id: pages.id })
    .from(pages)
    .where(
      and(
        exceptId === null ? undefined : ne(pages.id, exceptId),
        sql`(${pages.slug} = ${slug} or ${pages.draft}->>'slug' = ${slug})`,
      ),
    )
    .limit(1);
  if (taken.length)
    throw new PageError("Dieser Pfad wird schon von einer anderen Seite verwendet.", "slug");
}

// Sections must fit the page's kind; a fixed page keeps its slug and its place.
function assertShape(input: PageInput, row: Row | null) {
  const problem = sectionsProblem(input.slug, input.sections);
  if (problem) throw new PageError(problem, "sections");
  if (row && PROTECTED_SLUGS.has(row.slug)) {
    if (input.slug !== row.slug) throw new PageError("Die Adresse dieser Seite ist fest.", "slug");
    if (input.parentId !== row.parentId)
      throw new PageError("Diese Seite bleibt, wo sie ist.", "parentId");
  }
}

function assertTreeMove(id: number | null, parentId: number | null, tree: TreeNode[]) {
  if (parentId !== null && !tree.some((n) => n.id === parentId)) {
    throw new PageError("Die übergeordnete Seite gibt es nicht.", "parentId");
  }
  if (id !== null && !canMove(id, parentId, tree)) {
    throw new PageError("Eine Seite kann nicht unter sich selbst liegen.", "parentId");
  }
}

// Rewrites the stored path of a page and everything below it from the live tree.
async function rewritePaths(tx: Tx, rootId: number) {
  const rows = await allRows(tx);
  const tree = treeOf(rows, false);
  const paths = pathsOf(tree);
  const affected = [rootId, ...descendantsOf(rootId, tree).map((n) => n.id)];
  // Two updates: unique(path) would otherwise collide while a subtree moves.
  for (const id of affected) {
    await tx
      .update(pages)
      .set({ path: `\u0001pending-${id}` })
      .where(eq(pages.id, id));
  }
  for (const id of affected) {
    await tx
      .update(pages)
      .set({ path: paths.get(id)! })
      .where(eq(pages.id, id));
  }
}

// A new page starts as a draft with its fields in the live columns (nothing is public until
// it is published), so lists and the tree already show it.
export async function createPage(
  raw: PageInput,
  options: { publish?: boolean; userId?: number | null } = {},
) {
  const input = PageInputSchema.parse(raw);
  assertShape(input, null);
  return db.transaction(async (tx) => {
    await assertSlugFree(tx, input.slug, null);
    const rows = await allRows(tx);
    assertTreeMove(null, input.parentId, treeOf(rows, false));
    const [inserted] = await tx
      .insert(pages)
      .values({
        ...columnsOf(input),
        path: "\u0001pending-new",
        status: options.publish ? "published" : "draft",
        publishedAt: options.publish ? new Date() : null,
      })
      .returning({ id: pages.id });
    await rewritePaths(tx, inserted!.id);
    if (options.publish) {
      await addVersion(tx, {
        collection: "pages",
        docId: inserted!.id,
        snapshot: input,
        kind: "published",
        userId: options.userId ?? null,
      });
    }
    return inserted!.id;
  });
}

const columnsOf = (input: PageInput) => ({
  title: input.title,
  slug: input.slug,
  parentId: input.parentId,
  lead: input.lead,
  content: input.content,
  contentText: input.content ? plainText(input.content) : null,
  metaTitle: input.meta.title ?? null,
  metaDescription: input.meta.description ?? null,
  metaImageId: input.meta.imageId ?? null,
  sections: input.sections ?? null,
  updatedAt: new Date(),
});

// Autosave and „Entwurf speichern“: the working copy only.
export async function saveDraft(id: number, raw: PageInput) {
  const input = PageInputSchema.parse(raw);
  return db.transaction(async (tx) => {
    await assertSlugFree(tx, input.slug, id);
    const rows = await allRows(tx);
    const current = rows.find((r) => r.id === id);
    if (!current) throw new PageError("Die Seite gibt es nicht mehr.");
    assertShape(input, current);
    assertTreeMove(id, input.parentId, treeOf(rows, false));
    const [row] = await tx
      .update(pages)
      .set({ draft: input, updatedAt: new Date() })
      .where(eq(pages.id, id))
      .returning({ id: pages.id });
    if (!row) throw new PageError("Die Seite gibt es nicht mehr.");
  });
}

export type PublishResult = { pathsBefore: string[]; pathsAfter: string[] };

// Moves the draft (or, without one, the live fields) into the live columns and publishes.
export async function publishPage(id: number, userId: number | null): Promise<PublishResult> {
  return db.transaction(async (tx) => {
    const rows = await allRows(tx);
    const row = rows.find((r) => r.id === id);
    if (!row) throw new PageError("Die Seite gibt es nicht mehr.");
    const input = effective(row, true);
    PageInputSchema.parse(input);
    assertShape(input, row);
    await assertSlugFree(tx, input.slug, id);
    assertTreeMove(id, input.parentId, treeOf(rows, false));
    const before = subtreePaths(rows, id);
    await tx
      .update(pages)
      .set({ ...columnsOf(input), draft: null, status: "published", publishedAt: new Date() })
      .where(eq(pages.id, id));
    await rewritePaths(tx, id);
    await addVersion(tx, {
      collection: "pages",
      docId: id,
      snapshot: input,
      kind: "published",
      userId,
    });
    const after = subtreePaths(await allRows(tx), id);
    return { pathsBefore: before, pathsAfter: after };
  });
}

const subtreePaths = (rows: Row[], id: number) => {
  const tree = treeOf(rows, false);
  const paths = pathsOf(tree);
  return [id, ...descendantsOf(id, tree).map((n) => n.id)]
    .map((i) => paths.get(i)!)
    .filter(Boolean);
};

export async function unpublishPage(id: number): Promise<PublishResult> {
  return db.transaction(async (tx) => {
    const rows = await allRows(tx);
    const row = rows.find((r) => r.id === id);
    if (!row) throw new PageError("Die Seite gibt es nicht mehr.");
    if (PROTECTED_SLUGS.has(row.slug))
      throw new PageError("Diese Seite muss veröffentlicht bleiben.");
    await tx.update(pages).set({ status: "draft", updatedAt: new Date() }).where(eq(pages.id, id));
    const paths = subtreePaths(rows, id);
    return { pathsBefore: paths, pathsAfter: paths };
  });
}

export async function discardDraft(id: number) {
  await db.update(pages).set({ draft: null, updatedAt: new Date() }).where(eq(pages.id, id));
}

export async function deletePage(id: number): Promise<string[]> {
  return db.transaction(async (tx) => {
    const rows = await allRows(tx);
    const row = rows.find((r) => r.id === id);
    if (!row) throw new PageError("Die Seite gibt es nicht mehr.");
    if (PROTECTED_SLUGS.has(row.slug))
      throw new PageError("Diese Seite kann nicht gelöscht werden.");
    if (rows.some((r) => r.parentId === id)) {
      throw new PageError("Bitte verschieben oder löschen Sie zuerst die Seiten darunter.");
    }
    await tx.delete(pages).where(eq(pages.id, id));
    // A deleted page cannot be restored from its versions; they go with it.
    await tx.delete(versions).where(and(eq(versions.collection, "pages"), eq(versions.docId, id)));
    return [row.path];
  });
}

// Copies a version's snapshot into the draft; publishing it makes it live again.
export async function restorePageVersion(id: number, snapshot: unknown, userId: number | null) {
  const input = PageInputSchema.parse(snapshot);
  await db.transaction(async (tx) => {
    await tx.update(pages).set({ draft: input, updatedAt: new Date() }).where(eq(pages.id, id));
    await addVersion(tx, {
      collection: "pages",
      docId: id,
      snapshot: input,
      kind: "restored",
      userId,
    });
  });
}

// Seed and import: create or overwrite a published page by slug, parents first.
export async function upsertPublishedPage(
  raw: PageInput & { id?: number },
  userId: number | null = null,
) {
  const input = PageInputSchema.parse(raw);
  assertShape(input, null);
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(pages).where(eq(pages.slug, input.slug)).limit(1);
    if (existing) {
      await tx
        .update(pages)
        .set({
          ...columnsOf(input),
          draft: null,
          status: "published",
          publishedAt: existing.publishedAt ?? new Date(),
        })
        .where(eq(pages.id, existing.id));
      await rewritePaths(tx, existing.id);
      return existing.id;
    }
    const [inserted] = await tx
      .insert(pages)
      .values({
        ...(raw.id ? { id: raw.id } : {}),
        ...columnsOf(input),
        path: `\u0001pending-${input.slug}`,
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: pages.id });
    await rewritePaths(tx, inserted!.id);
    await addVersion(tx, {
      collection: "pages",
      docId: inserted!.id,
      snapshot: input,
      kind: "published",
      userId,
    });
    return inserted!.id;
  });
}

export { HOME_SLUG };

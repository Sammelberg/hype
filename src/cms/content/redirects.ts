// Redirects from an old path to a page, a project or any URL.
import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { normalizePath } from "../../lib/redirects";
import { db, type Db, type Tx } from "../db/client";
import { pages, projekte, redirects } from "../db/schema";
import { projektPathOf as projektPath } from "../paths";
import { type Redirect, type RedirectInput, RedirectInputSchema } from "./types";
import { CmsError } from "../errors";

export class RedirectError extends CmsError {
  constructor(message: string, field?: keyof RedirectInput) {
    super(message, field);
  }
}

const select = {
  id: redirects.id,
  from: redirects.from,
  type: redirects.type,
  toPageId: redirects.toPageId,
  toProjektId: redirects.toProjektId,
  toUrl: redirects.toUrl,
  createdAt: redirects.createdAt,
  updatedAt: redirects.updatedAt,
  pagePath: pages.path,
  pageTitle: pages.title,
  projektSlug: projekte.slug,
  projektTitle: projekte.title,
};

type Joined = {
  [K in keyof typeof select]: (typeof select)[K]["_"]["data"] | null;
} & { id: number; from: string; type: number; createdAt: Date; updatedAt: Date };

function toRedirect(row: Joined): Redirect {
  const destination =
    row.pagePath ?? (row.projektSlug ? projektPath(row.projektSlug) : null) ?? row.toUrl ?? null;
  return {
    id: row.id,
    from: row.from,
    type: row.type === 307 ? 307 : 308,
    toPageId: row.toPageId,
    toProjektId: row.toProjektId,
    toUrl: row.toUrl,
    destination,
    targetLabel: row.pageTitle ?? row.projektTitle ?? row.toUrl ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const joined = () =>
  db
    .select(select)
    .from(redirects)
    .leftJoin(pages, eq(pages.id, redirects.toPageId))
    .leftJoin(projekte, eq(projekte.id, redirects.toProjektId));

// The redirect for a request path, or null. Checked before a 404 is rendered.
export async function findRedirect(
  path: string,
): Promise<{ destination: string; permanent: boolean } | null> {
  const [row] = await joined()
    .where(eq(redirects.from, normalizePath(path)))
    .limit(1);
  if (!row) return null;
  const redirect = toRedirect(row as Joined);
  return redirect.destination
    ? { destination: redirect.destination, permanent: redirect.type === 308 }
    : null;
}

export async function listRedirects(): Promise<Redirect[]> {
  const rows = await joined().orderBy(desc(redirects.updatedAt));
  return rows.map((row) => toRedirect(row as Joined));
}

export async function getRedirect(id: number): Promise<Redirect | null> {
  const [row] = await joined().where(eq(redirects.id, id)).limit(1);
  return row ? toRedirect(row as Joined) : null;
}

const columnsOf = (input: RedirectInput) => ({
  from: normalizePath(input.from),
  type: input.type,
  toPageId: input.toPageId,
  toProjektId: input.toProjektId,
  toUrl: input.toUrl,
  updatedAt: new Date(),
});

// Where a redirect leads on this site, as a path; null for an address elsewhere.
async function targetPath(client: Db | Tx, input: RedirectInput): Promise<string | null> {
  if (input.toPageId) {
    const [page] = await client
      .select({ path: pages.path })
      .from(pages)
      .where(eq(pages.id, input.toPageId));
    return page?.path ?? null;
  }
  if (input.toProjektId) {
    const [projekt] = await client
      .select({ slug: projekte.slug })
      .from(projekte)
      .where(eq(projekte.id, input.toProjektId));
    return projekt ? projektPath(projekt.slug) : null;
  }
  return input.toUrl?.startsWith("/") ? normalizePath(input.toUrl) : null;
}

// No redirect onto its own path, and none that closes a circle: from its target on, the chain of
// redirects (followed wherever no published page answers) must not come back to it.
async function assertNoLoop(client: Db | Tx, input: RedirectInput, ownId: number | null) {
  const from = normalizePath(input.from);
  let path = await targetPath(client, input);
  if (path === from)
    throw new RedirectError("Eine Weiterleitung auf sich selbst führt nirgendwohin.", "toUrl");
  const seen = [from];
  for (let hop = 0; path && hop < 20; hop++) {
    const [page] = await client
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.path, path), eq(pages.status, "published")));
    if (page) return;
    const [next] = await client
      .select({
        id: redirects.id,
        from: redirects.from,
        type: redirects.type,
        toPageId: redirects.toPageId,
        toProjektId: redirects.toProjektId,
        toUrl: redirects.toUrl,
      })
      .from(redirects)
      .where(
        ownId ? and(eq(redirects.from, path), ne(redirects.id, ownId)) : eq(redirects.from, path),
      );
    if (!next) return;
    seen.push(path);
    path = await targetPath(client, next as RedirectInput);
    if (path && seen.includes(path))
      throw new RedirectError(
        `Das ergäbe einen Kreis: ${[...seen, path].join(" → ")}. Bitte ein anderes Ziel wählen.`,
        "toUrl",
      );
  }
}

export async function createRedirect(raw: RedirectInput, client: Db | Tx = db) {
  const input = RedirectInputSchema.parse(raw);
  await assertNoLoop(client, input, null);
  const [existing] = await client
    .select({ id: redirects.id })
    .from(redirects)
    .where(eq(redirects.from, normalizePath(input.from)))
    .limit(1);
  if (existing)
    throw new RedirectError("Für diesen Pfad gibt es schon eine Weiterleitung.", "from");
  const [row] = await client
    .insert(redirects)
    .values(columnsOf(input))
    .returning({ id: redirects.id });
  return row!.id;
}

export async function updateRedirect(id: number, raw: RedirectInput, client: Db | Tx = db) {
  const input = RedirectInputSchema.parse(raw);
  await assertNoLoop(client, input, id);
  const [row] = await client
    .update(redirects)
    .set(columnsOf(input))
    .where(eq(redirects.id, id))
    .returning({ from: redirects.from });
  if (!row) throw new RedirectError("Die Weiterleitung gibt es nicht mehr.");
}

export async function deleteRedirect(id: number, client: Db | Tx = db) {
  const [row] = await client
    .delete(redirects)
    .where(eq(redirects.id, id))
    .returning({ from: redirects.from });
  return row?.from ?? null;
}

// Seed: create or overwrite by `from`.
export async function upsertRedirect(raw: RedirectInput) {
  const input = RedirectInputSchema.parse(raw);
  await db
    .insert(redirects)
    .values(columnsOf(input))
    .onConflictDoUpdate({ target: redirects.from, set: columnsOf(input) });
}

// A published page or project moved: its old addresses lead to it (308), inside the transaction
// of the move. Redirects from the addresses it has now go, since the page answers there itself.
export async function redirectMoves(
  tx: Tx,
  moves: { from: string; to: { pageId: number } | { projektId: number } }[],
  nowAt: string[],
) {
  if (nowAt.length)
    await tx.delete(redirects).where(inArray(redirects.from, nowAt.map(normalizePath)));
  for (const move of moves) {
    const values = {
      from: normalizePath(move.from),
      type: 308,
      toPageId: "pageId" in move.to ? move.to.pageId : null,
      toProjektId: "projektId" in move.to ? move.to.projektId : null,
      toUrl: null,
      updatedAt: new Date(),
    };
    await tx
      .insert(redirects)
      .values(values)
      .onConflictDoUpdate({ target: redirects.from, set: values });
  }
}

// The redirects that lead to a page or project, by their old path (for a refused delete).
export async function redirectsOnto(
  client: Db | Tx,
  target: { pageId: number } | { projektId: number },
): Promise<string[]> {
  const rows = await client
    .select({ from: redirects.from })
    .from(redirects)
    .where(
      "pageId" in target
        ? eq(redirects.toPageId, target.pageId)
        : eq(redirects.toProjektId, target.projektId),
    );
  return rows.map((r) => r.from);
}

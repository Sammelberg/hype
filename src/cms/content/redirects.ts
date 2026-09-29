// Redirects from an old path to a page, a project or any URL.
import { desc, eq } from "drizzle-orm";

import { normalizePath } from "../../lib/redirects";
import { db } from "../db/client";
import { pages, projekte, redirects } from "../db/schema";
import { projektPath } from "./projekte";
import { type Redirect, type RedirectInput, RedirectInputSchema } from "./types";

export class RedirectError extends Error {
  constructor(
    message: string,
    public readonly field?: keyof RedirectInput,
  ) {
    super(message);
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
    type: row.type === 302 ? 302 : 301,
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
    ? { destination: redirect.destination, permanent: redirect.type === 301 }
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

export async function createRedirect(raw: RedirectInput) {
  const input = RedirectInputSchema.parse(raw);
  const [existing] = await db
    .select({ id: redirects.id })
    .from(redirects)
    .where(eq(redirects.from, normalizePath(input.from)))
    .limit(1);
  if (existing)
    throw new RedirectError("Für diesen Pfad gibt es schon eine Weiterleitung.", "from");
  const [row] = await db.insert(redirects).values(columnsOf(input)).returning({ id: redirects.id });
  return row!.id;
}

export async function updateRedirect(id: number, raw: RedirectInput) {
  const input = RedirectInputSchema.parse(raw);
  const [row] = await db
    .update(redirects)
    .set(columnsOf(input))
    .where(eq(redirects.id, id))
    .returning({ from: redirects.from });
  if (!row) throw new RedirectError("Die Weiterleitung gibt es nicht mehr.");
}

export async function deleteRedirect(id: number) {
  const [row] = await db
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

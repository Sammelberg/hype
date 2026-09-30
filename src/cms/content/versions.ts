import { and, desc, eq, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { users, versions } from "../db/schema";
import type { Version } from "./types";

export type Collection = Version["collection"];

export async function addVersion(
  client: Db | Tx,
  entry: {
    collection: Collection;
    docId: number;
    snapshot: unknown;
    kind: Version["kind"];
    userId: number | null;
  },
) {
  await client.insert(versions).values({
    collection: entry.collection,
    docId: entry.docId,
    snapshot: entry.snapshot,
    kind: entry.kind,
    createdBy: entry.userId,
  });
}

export async function listVersions(
  collection: Collection,
  docId: number,
  limit = 50,
): Promise<Version[]> {
  const rows = await db
    .select({
      id: versions.id,
      collection: versions.collection,
      docId: versions.docId,
      snapshot: versions.snapshot,
      kind: versions.kind,
      createdAt: versions.createdAt,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
    })
    .from(versions)
    .leftJoin(users, eq(users.id, versions.createdBy))
    .where(and(eq(versions.collection, collection), eq(versions.docId, docId)))
    .orderBy(desc(versions.createdAt), desc(versions.id))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    collection: row.collection as Collection,
    docId: row.docId,
    snapshot: row.snapshot,
    kind: row.kind as Version["kind"],
    createdBy: row.userId ? { id: row.userId, name: row.userName ?? row.userEmail } : null,
    createdAt: row.createdAt,
  }));
}

export async function getVersion(id: number) {
  const [row] = await db.select().from(versions).where(eq(versions.id, id)).limit(1);
  return row ?? null;
}

// Publications per ISO week for the dashboard, oldest week first.
export async function publicationsPerWeek(weeks = 12): Promise<{ week: string; count: number }[]> {
  const { rows } = await db.execute<{ week: string; count: number }>(sql`
    with weeks as (
      select generate_series(
        date_trunc('week', now()) - make_interval(weeks => ${weeks - 1}),
        date_trunc('week', now()),
        interval '1 week') as week
    )
    select to_char(weeks.week, 'IYYY-"KW"IW') as week, count(v.id)::int as count
    from weeks
    left join cms.versions v on v.kind = 'published' and date_trunc('week', v.created_at) = weeks.week
    group by weeks.week order by weeks.week`);
  return rows;
}

// The latest publications across pages and projects, with the document's current title.
export async function recentPublications(limit = 8) {
  const { rows } = await db.execute<{
    id: number;
    collection: string;
    doc_id: number;
    created_at: Date;
    title: string | null;
    path: string | null;
    user_name: string | null;
  }>(sql`
    select v.id, v.collection, v.doc_id, v.created_at,
           coalesce(p.title, r.title, v.snapshot->>'title', case when v.collection = 'site_settings' then 'Website' end) as title,
           coalesce(p.path, case when r.slug is not null then '/projekte/' || r.slug end) as path,
           coalesce(u.name, u.email) as user_name
    from cms.versions v
    left join cms.pages p on v.collection = 'pages' and p.id = v.doc_id
    left join cms.projekte r on v.collection = 'projekte' and r.id = v.doc_id
    left join cms.users u on u.id = v.created_by
    where v.kind = 'published'
    order by v.created_at desc, v.id desc
    limit ${limit}`);
  return rows.map((row) => ({
    id: row.id,
    collection: row.collection as Collection,
    docId: row.doc_id,
    createdAt: new Date(row.created_at),
    title: row.title,
    path: row.path,
    userName: row.user_name,
  }));
}

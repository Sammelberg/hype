import { and, desc, eq } from "drizzle-orm";

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

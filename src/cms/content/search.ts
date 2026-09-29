// Full-text search over published pages and projects: Postgres' German dictionary on the
// generated `search` columns, ranked, with a plain title match as a safety net for compounds.
import { sql } from "drizzle-orm";

import { db } from "../db/client";
import { firstParagraph } from "../rich-text/text";
import type { LexicalDocument } from "../rich-text/schema";
import { projektPath } from "./projekte";

export type SearchResult = { id: string; title: string; summary: string | null; url: string };

type Hit = {
  kind: "page" | "projekt";
  id: number;
  title: string;
  path: string;
  summary: string | null;
  content: LexicalDocument | null;
  rank: number;
};

export async function searchSite(query: string, limit = 50): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const { rows } = await db.execute<Hit>(sql`
    with q as (select websearch_to_tsquery('german', ${q}) as ts)
    select * from (
      select 'page' as kind, p.id, p.title, p.path,
             coalesce(p.lead, p.meta_description) as summary, p.content,
             ts_rank_cd(p.search, q.ts) + (case when p.title ilike ${like} then 1 else 0 end) as rank
      from cms.pages p, q
      where p.status = 'published' and (p.search @@ q.ts or p.title ilike ${like})
      union all
      select 'projekt' as kind, r.id, r.title, r.slug as path,
             r.summary, r.content,
             ts_rank_cd(r.search, q.ts) + (case when r.title ilike ${like} then 1 else 0 end) as rank
      from cms.projekte r, q
      where r.status = 'published' and (r.search @@ q.ts or r.title ilike ${like})
    ) hits
    order by rank desc, title asc
    limit ${limit}`);
  return rows.map((hit) => ({
    id: `${hit.kind}-${hit.id}`,
    title: hit.title,
    summary: hit.summary ?? firstParagraph(hit.content),
    url: hit.kind === "page" ? hit.path : projektPath(hit.path),
  }));
}

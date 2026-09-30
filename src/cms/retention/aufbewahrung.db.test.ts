// @vitest-environment node
// Runs against DATABASE_URL inside a transaction that is rolled back: real messages stay.
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { purgeSubmissionsBefore } from "../content/forms";
import { db, type Tx } from "../db/client";
import { loeschGrenze } from "./grenze";

class Rueckgabe extends Error {}
async function imRollback(fn: (tx: Tx) => Promise<void>) {
  try {
    await db.transaction(async (tx) => {
      await fn(tx);
      throw new Rueckgabe();
    });
  } catch (error) {
    if (!(error instanceof Rueckgabe)) throw error;
  }
}

describe.skipIf(!process.env.DATABASE_URL)("retention of contact messages", () => {
  it("removes what is older than six months, read or not, and keeps the rest", async () => {
    await imRollback(async (tx) => {
      const now = new Date();
      const days = (n: number) => new Date(now.getTime() - n * 86_400_000);
      const { rows } = await tx.execute<{ id: number }>(sql`
        insert into cms.form_submissions (form_id, data, read_at, created_at)
        select f.id, '[{"field":"name","value":"test-aufbewahrung"}]', r, c
        from (select id from cms.forms order by id limit 1) f,
          (values (${days(200)}::timestamptz, null::timestamptz), (${days(190)}::timestamptz, ${days(189)}::timestamptz), (${days(20)}::timestamptz, null::timestamptz)) v(c, r)
        returning id`);
      expect(rows).toHaveLength(3);

      const gone = await purgeSubmissionsBefore(loeschGrenze(now), tx);
      expect(gone).toBeGreaterThanOrEqual(2);
      const { rows: left } = await tx.execute<{ n: number }>(sql`
        select count(*)::int as n from cms.form_submissions where data::text like '%test-aufbewahrung%'`);
      expect(left[0]!.n).toBe(1);
    });
  });
});

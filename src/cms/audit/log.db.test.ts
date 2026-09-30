// @vitest-environment node
// Runs against DATABASE_URL inside transactions that are rolled back: the log cannot be cleaned
// up afterwards (that is its point), so no test entry may ever be committed.
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db, type Tx } from "../db/client";
import { verifyAuditChain, writeAudit } from "./log";

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

const actor = { id: null, email: "test@example.com" };

// Three entries of this test, the ids they got.
async function threeEntries(tx: Tx) {
  for (const n of [1, 2, 3])
    await writeAudit(tx, {
      actor,
      action: "seite.veroeffentlicht",
      target: { type: "seite", id: n },
    });
  const { rows } = await tx.execute<{ id: string }>(
    sql`select id from cms.audit_log where user_email = 'test@example.com' order by id`,
  );
  return rows.map((r) => Number(r.id));
}

// A statement that must fail, in a savepoint so the transaction carries on.
const refused = (tx: Tx, statement: ReturnType<typeof sql>) =>
  expect(tx.transaction((sp) => sp.execute(statement))).rejects.toThrow();

describe.skipIf(!process.env.DATABASE_URL)("audit log", () => {
  it("chains every entry to the one before", async () => {
    await imRollback(async (tx) => {
      const ids = await threeEntries(tx);
      const { rows } = await tx.execute<{ id: string; prev_hash: string; hash: string }>(
        sql`select id, prev_hash, hash from cms.audit_log where id >= ${ids[0]} order by id`,
      );
      expect(rows[1]!.prev_hash).toBe(rows[0]!.hash);
      expect(rows[2]!.prev_hash).toBe(rows[1]!.hash);
      expect(rows[0]!.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(await verifyAuditChain(tx)).toMatchObject({ ok: true });
    });
  });

  it("ignores the hashes and time the application sends", async () => {
    await imRollback(async (tx) => {
      await tx.execute(sql`insert into cms.audit_log (action, at, prev_hash, hash)
        values ('anmeldung', '2000-01-01', 'gefälscht', 'gefälscht')`);
      const { rows } = await tx.execute<{ hash: string; at: Date }>(
        sql`select hash, at from cms.audit_log order by id desc limit 1`,
      );
      expect(rows[0]!.hash).not.toBe("gefälscht");
      expect(new Date(rows[0]!.at).getFullYear()).toBeGreaterThan(2000);
      expect(await verifyAuditChain(tx)).toMatchObject({ ok: true });
    });
  });

  it("refuses to change, delete or empty it", async () => {
    await imRollback(async (tx) => {
      const [id] = await threeEntries(tx);
      await refused(tx, sql`update cms.audit_log set action = 'anmeldung' where id = ${id}`);
      await refused(tx, sql`update cms.audit_log set details = '{"x":1}' where id = ${id}`);
      await refused(tx, sql`delete from cms.audit_log where id = ${id}`);
      await refused(tx, sql`truncate cms.audit_log`);
      expect(await verifyAuditChain(tx)).toMatchObject({ ok: true });
    });
  });

  it("finds an entry changed behind the triggers' back", async () => {
    await imRollback(async (tx) => {
      const ids = await threeEntries(tx);
      await tx.execute(sql`alter table cms.audit_log disable trigger audit_log_unveraenderlich`);
      await tx.execute(sql`update cms.audit_log set target_id = '99' where id = ${ids[1]}`);
      expect(await verifyAuditChain(tx)).toMatchObject({
        ok: false,
        brokenAt: ids[1],
        reason: "hash",
      });
    });
  });

  it("finds an entry removed behind the triggers' back", async () => {
    await imRollback(async (tx) => {
      const ids = await threeEntries(tx);
      await tx.execute(sql`alter table cms.audit_log disable trigger audit_log_unveraenderlich`);
      await tx.execute(sql`delete from cms.audit_log where id = ${ids[1]}`);
      expect(await verifyAuditChain(tx)).toMatchObject({
        ok: false,
        brokenAt: ids[2],
        reason: "link",
      });
    });
  });
});

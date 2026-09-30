// The audit log (cms.audit_log). Rows are written inside the transaction of what they record, so
// a change without its entry cannot happen; the database chains them (migration 0005).
import { and, desc, eq, lt, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { auditLog } from "../db/schema";
import type { AuditEntry, AuditRow, ChainCheck } from "./types";

export async function writeAudit(client: Db | Tx, entry: AuditEntry) {
  await client.insert(auditLog).values({
    userId: entry.actor?.id ?? null,
    userEmail: entry.actor?.email ?? null,
    action: entry.action,
    targetType: entry.target?.type ?? null,
    targetId: entry.target ? String(entry.target.id) : null,
    details: entry.details ?? {},
  });
}

// Runs `change` and records it in one transaction: both happen, or neither. The entry may be
// built from what the change returned (the new id, the path it had).
export async function audited<T>(
  change: (tx: Tx) => Promise<T>,
  entry: AuditEntry | ((result: T) => AuditEntry),
): Promise<T> {
  return db.transaction(async (tx) => {
    const result = await change(tx);
    await writeAudit(tx, typeof entry === "function" ? entry(result) : entry);
    return result;
  });
}

export const AUDIT_PAGE_SIZE = 100;

// Newest first, a page at a time (`before`: the smallest id already shown).
export async function listAudit(
  options: { action?: string; before?: number } = {},
): Promise<AuditRow[]> {
  const where = and(
    options.action ? eq(auditLog.action, options.action) : undefined,
    options.before ? lt(auditLog.id, options.before) : undefined,
  );
  const rows = await db
    .select({
      id: auditLog.id,
      at: auditLog.at,
      userEmail: auditLog.userEmail,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      details: auditLog.details,
    })
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.id))
    .limit(AUDIT_PAGE_SIZE);
  return rows;
}

// Recomputes every hash and every link, oldest first. A row changed behind the triggers' back
// (they can be switched off by the table's owner) no longer matches its hash; a row removed
// leaves its successor pointing at nothing.
export async function verifyAuditChain(client: Db | Tx = db): Promise<ChainCheck> {
  const result = await client.execute<{
    id: string;
    hash_ok: boolean;
    link_ok: boolean;
  }>(sql`
    select id,
      hash = cms.audit_hash(prev_hash, id, at, user_id, user_email, action, target_type,
        target_id, details) as hash_ok,
      prev_hash = coalesce(lag(hash) over (order by id), 'GENESIS') as link_ok
    from cms.audit_log
    order by id
  `);
  const rows = result.rows;
  for (const row of rows) {
    if (!row.hash_ok)
      return { ok: false, count: rows.length, brokenAt: Number(row.id), reason: "hash" };
    if (!row.link_ok)
      return { ok: false, count: rows.length, brokenAt: Number(row.id), reason: "link" };
  }
  return { ok: true, count: rows.length };
}

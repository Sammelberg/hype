// „Gesendete E-Mails“ (cms.email_log): one row per message the mail server accepted.
import { and, count, desc, eq } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { emailLog } from "../db/schema";

export type EmailLogRow = typeof emailLog.$inferSelect;

export async function logMail(values: typeof emailLog.$inferInsert, client: Db | Tx = db) {
  const [row] = await client.insert(emailLog).values(values).returning();
  return row!;
}

/** The latest first. */
export async function listMailLog(
  { limit = 25, offset = 0 }: { limit?: number; offset?: number } = {},
  client: Db | Tx = db,
): Promise<{ items: EmailLogRow[]; total: number }> {
  const [items, [total]] = await Promise.all([
    client
      .select()
      .from(emailLog)
      .orderBy(desc(emailLog.sentAt), desc(emailLog.id))
      .limit(limit)
      .offset(offset),
    client.select({ total: count() }).from(emailLog),
  ]);
  return { items, total: total?.total ?? 0 };
}

/** The mails that carried one document, the latest first. */
export async function mailsZu(
  target: { type: string; id: string | number },
  client: Db | Tx = db,
): Promise<EmailLogRow[]> {
  return client
    .select()
    .from(emailLog)
    .where(and(eq(emailLog.targetType, target.type), eq(emailLog.targetId, String(target.id))))
    .orderBy(desc(emailLog.sentAt), desc(emailLog.id));
}

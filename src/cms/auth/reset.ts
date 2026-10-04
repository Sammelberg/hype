// „Passwort vergessen“: a one-time link by e-mail, valid for an hour. The table keeps only the
// token's sha256; using the link sets the new password, ends every session and spends this link
// and every other open link of the account.
import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull, lt, or } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { passwordResets } from "../db/schema";
import { AuthError, findUserByEmail, setPassword } from "./users";

const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export const RESET_MINUTES = 60;

/** A link for the account with this address, or null when there is none (the page says nothing). */
export async function createReset(
  email: string,
  now = new Date(),
): Promise<{ token: string; userId: number; email: string } | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResets).values({
    id: digest(token),
    userId: user.id,
    expiresAt: new Date(now.getTime() + RESET_MINUTES * 60_000),
  });
  return { token, userId: user.id, email: user.email };
}

const open = (token: string, now: Date) =>
  and(
    eq(passwordResets.id, digest(token)),
    isNull(passwordResets.usedAt),
    gt(passwordResets.expiresAt, now),
  );

/** Whether a link still works (the page that asks for the new password). */
export async function resetValid(token: string, now = new Date()): Promise<boolean> {
  const [row] = await db
    .select({ id: passwordResets.id })
    .from(passwordResets)
    .where(open(token, now));
  return Boolean(row);
}

/**
 * Sets the new password through the link; returns the account's id. One transaction: a password
 * the rules refuse leaves the link open for another try.
 */
export async function redeemReset(
  token: string,
  password: string,
  tx?: Tx,
  now = new Date(),
): Promise<number> {
  if (!tx) return db.transaction((own) => redeemReset(token, password, own, now));
  const [row] = await tx
    .update(passwordResets)
    .set({ usedAt: now })
    .where(open(token, now))
    .returning({ userId: passwordResets.userId });
  if (!row) throw new AuthError("Dieser Link ist abgelaufen oder wurde schon benutzt.");
  await setPassword(row.userId, password, {}, tx);
  // Every other link of the account is spent with it.
  await tx
    .update(passwordResets)
    .set({ usedAt: now })
    .where(and(eq(passwordResets.userId, row.userId), isNull(passwordResets.usedAt)));
  return row.userId;
}

/** Used and expired links, removed by the nightly retention job. */
export async function purgeResets(now = new Date(), client: Db | Tx = db) {
  const gone = await client
    .delete(passwordResets)
    .where(or(lt(passwordResets.expiresAt, now), lt(passwordResets.usedAt, now)))
    .returning({ id: passwordResets.id });
  return gone.length;
}

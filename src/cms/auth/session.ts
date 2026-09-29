// Sessions live in cms.sessions: the cookie holds a random token, the table its sha256.
import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, lt } from "drizzle-orm";

import { db } from "../db/client";
import { sessions, users } from "../db/schema";
import type { User } from "../content/types";
import { SESSION_DAYS } from "./cookie";

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ id: digest(token), userId, expiresAt });
  return { token, expiresAt };
}

// The user behind a token, or null: expired, unknown, or created before the user's
// „überall abmelden“ moment. Touches last_seen_at at most once an hour.
export async function userForToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const id = digest(token);
  const now = new Date();
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, now)))
    .limit(1);
  if (!row) return null;
  if (row.user.sessionsRevokedAt && row.session.createdAt < row.user.sessionsRevokedAt) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  if (now.getTime() - row.session.lastSeenAt.getTime() > 3_600_000) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, id));
  }
  return {
    id: row.user.id,
    email: row.user.email,
    name: row.user.name,
    mustChangePassword: row.user.mustChangePassword,
    lockedUntil: row.user.lockedUntil,
    lastLoginAt: row.user.lastLoginAt,
    createdAt: row.user.createdAt,
  };
}

export async function destroySession(token: string | undefined) {
  if (token) await db.delete(sessions).where(eq(sessions.id, digest(token)));
}

export async function destroyAllSessions(userId: number) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// Housekeeping, called now and then from the login action.
export async function purgeExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

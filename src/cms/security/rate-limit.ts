// Rate limits on Postgres (cms.rate_limits), for the doors a stranger can knock on: sign-in,
// the contact form, „Passwort vergessen“, uploads. One atomic upsert per request: the row lock serialises parallel
// requests of one key, so no count is lost.
import { lt, eq, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { rateLimits } from "../db/schema";
import { type RateLimit, windowOf } from "./window";

export type RateLimitResult = { ok: boolean; count: number; retryAfterSeconds: number };

export const LIMITS = {
  // Before argon2 (64 MiB per check): without it, sign-in attempts are a way to exhaust memory.
  login: { limit: 20, windowSeconds: 600 },
  contact: { limit: 5, windowSeconds: 600 },
  upload: { limit: 60, windowSeconds: 600 },
  // „Passwort vergessen“: each request may send a mail; a few an hour per address is plenty.
  reset: { limit: 5, windowSeconds: 3600 },
} satisfies Record<string, RateLimit>;

export async function hitRateLimit(
  key: string,
  { limit, windowSeconds }: RateLimit,
  now = new Date(),
): Promise<RateLimitResult> {
  const { start, end } = windowOf(now, windowSeconds);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart: start, count: 1, expiresAt: end })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.windowStart} = excluded.window_start
          then ${rateLimits.count} + 1 else 1 end`,
        windowStart: sql`excluded.window_start`,
        expiresAt: sql`excluded.expires_at`,
      },
    })
    .returning({ count: rateLimits.count });
  const count = row!.count;
  return {
    ok: count <= limit,
    count,
    retryAfterSeconds: Math.ceil((end.getTime() - now.getTime()) / 1000),
  };
}

// After a successful sign-in the address starts afresh: a colleague who mistyped is not punished.
export async function resetRateLimit(key: string) {
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}

// Expired windows; `pnpm cms:aufbewahrung` calls it.
export async function purgeRateLimits(now = new Date(), client: Db | Tx = db) {
  const rows = await client
    .delete(rateLimits)
    .where(lt(rateLimits.expiresAt, now))
    .returning({ key: rateLimits.key });
  return rows.length;
}

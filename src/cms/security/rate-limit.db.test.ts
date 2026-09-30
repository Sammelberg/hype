// @vitest-environment node
// Runs against DATABASE_URL; every key it writes starts with `test-` and is removed afterwards.
import { like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { rateLimits } from "../db/schema";
import { hitRateLimit, purgeRateLimits, resetRateLimit } from "./rate-limit";

const key = (name: string) => `test-${name}-${Date.now()}`;
const rule = { limit: 3, windowSeconds: 600 };
const at = new Date("2026-09-30T10:01:00Z");

describe.skipIf(!process.env.DATABASE_URL)("rate limits", () => {
  afterAll(async () => {
    await db.delete(rateLimits).where(like(rateLimits.key, "test-%"));
  });

  it("lets the limit through and refuses the next one", async () => {
    const k = key("limit");
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await hitRateLimit(k, rule, at));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
    expect(results[3]!.retryAfterSeconds).toBe(540);
  });

  it("loses no count when requests arrive at once", async () => {
    const k = key("parallel");
    const results = await Promise.all(
      Array.from({ length: 20 }, () => hitRateLimit(k, { limit: 20, windowSeconds: 600 }, at)),
    );
    expect(results.map((r) => r.count).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });

  it("starts afresh in the next window and after a reset", async () => {
    const k = key("window");
    for (let i = 0; i < 4; i++) await hitRateLimit(k, rule, at);
    expect((await hitRateLimit(k, rule, new Date("2026-09-30T10:10:00Z"))).count).toBe(1);
    await resetRateLimit(k);
    expect((await hitRateLimit(k, rule, at)).count).toBe(1);
  });

  it("purges expired windows", async () => {
    const k = key("purge");
    await hitRateLimit(k, rule, new Date("2020-01-01T00:00:00Z"));
    expect(await purgeRateLimits(new Date("2026-09-30T00:00:00Z"))).toBeGreaterThanOrEqual(1);
  });
});

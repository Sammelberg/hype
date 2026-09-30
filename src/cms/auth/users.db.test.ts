// @vitest-environment node
// Runs against DATABASE_URL; its accounts are named test-…@example.com and removed afterwards.
import { like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { users } from "../db/schema";
import { afterFailure, MAX_ATTEMPTS } from "./lockout";
import { createUser, registerFailure } from "./users";

const account = async (name: string) =>
  createUser({
    email: `test-${name}-${Date.now()}@example.com`,
    password: "test-passwort-lang",
    role: "redakteur",
  });

describe.skipIf(!process.env.DATABASE_URL)("registerFailure", () => {
  afterAll(async () => {
    await db.delete(users).where(like(users.email, "test-%@example.com"));
  });

  it("counts like afterFailure, one by one", async () => {
    const user = await account("serial");
    const now = new Date();
    let expected = { failedAttempts: 0, lockedUntil: null as Date | null };
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      expected = afterFailure(expected, now);
      expect(await registerFailure(user.id, now)).toEqual(expected);
    }
    expect(expected.lockedUntil).not.toBeNull();
  });

  it("loses no attempt when they arrive at once", async () => {
    const user = await account("parallel");
    const now = new Date();
    await Promise.all(Array.from({ length: MAX_ATTEMPTS }, () => registerFailure(user.id, now)));
    const [row] = await db
      .select({ lockedUntil: users.lockedUntil })
      .from(users)
      .where(like(users.email, user.email));
    expect(row!.lockedUntil).not.toBeNull();
  });

  it("leaves a locked account locked", async () => {
    const user = await account("locked");
    const now = new Date();
    for (let i = 0; i < MAX_ATTEMPTS; i++) await registerFailure(user.id, now);
    const again = await registerFailure(user.id, new Date(now.getTime() + 1000));
    expect(again.lockedUntil?.getTime()).toBe(now.getTime() + 10 * 60_000);
  });
});

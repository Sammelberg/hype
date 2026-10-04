// @vitest-environment node
// Runs against DATABASE_URL; its accounts are named test-…@example.com and removed afterwards.
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import { passwordResets, sessions, users } from "../db/schema";
import { verifyPassword } from "./password";
import { createReset, purgeResets, redeemReset, RESET_MINUTES, resetValid } from "./reset";
import { createSession } from "./session";
import { createUser } from "./users";

const account = () =>
  createUser({
    email: `test-reset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`,
    password: "test-passwort-alt",
    role: "redakteur",
  });

describe.skipIf(!process.env.DATABASE_URL)("password reset links", () => {
  afterAll(async () => {
    await db.delete(users).where(like(users.email, "test-reset-%@example.com"));
  });

  it("gives no link for an unknown address", async () => {
    expect(await createReset("niemand-hier@example.com")).toBeNull();
  });

  it("stores only a hash, opens once, sets the password and ends the sessions", async () => {
    const user = await account();
    await createSession(user.id);
    const reset = await createReset(user.email.toUpperCase());
    expect(reset?.userId).toBe(user.id);
    const stored = await db
      .select({ id: passwordResets.id })
      .from(passwordResets)
      .where(eq(passwordResets.userId, user.id));
    expect(stored).toHaveLength(1);
    expect(stored[0]!.id).not.toBe(reset!.token);

    expect(await resetValid(reset!.token)).toBe(true);
    await redeemReset(reset!.token, "test-passwort-neu-lang");
    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(await verifyPassword("test-passwort-neu-lang", row!.passwordHash)).toBe(true);
    expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(0);

    expect(await resetValid(reset!.token)).toBe(false);
    await expect(redeemReset(reset!.token, "noch-ein-passwort-lang")).rejects.toThrow(/abgelaufen/);
  });

  it("refuses an expired link and a too short password, and spends the other links", async () => {
    const user = await account();
    const past = new Date(Date.now() - (RESET_MINUTES + 1) * 60_000);
    const old = await createReset(user.email, past);
    expect(await resetValid(old!.token)).toBe(false);

    const first = await createReset(user.email);
    const second = await createReset(user.email);
    await expect(redeemReset(first!.token, "kurz")).rejects.toThrow();
    expect(await resetValid(first!.token)).toBe(true);
    await redeemReset(first!.token, "test-passwort-neu-lang");
    expect(await resetValid(second!.token)).toBe(false);

    expect(await purgeResets()).toBeGreaterThanOrEqual(3);
    expect(
      await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)),
    ).toHaveLength(0);
  });
});

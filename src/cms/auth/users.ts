// Admin accounts. Emails compare case-insensitively; passwords never leave password.ts.
import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm";

import { db, type Db, type Tx } from "../db/client";
import { sessions, users } from "../db/schema";
import type { User } from "../content/types";
import type { Role } from "./roles";
import { afterSuccess, isLocked, LOCK_MINUTES, lockMessage, MAX_ATTEMPTS } from "./lockout";
import { hashPassword, passwordProblem, verifyPassword } from "./password";

type Row = typeof users.$inferSelect;

const toUser = (row: Row): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  mustChangePassword: row.mustChangePassword,
  lockedUntil: row.lockedUntil,
  lastLoginAt: row.lastLoginAt,
  createdAt: row.createdAt,
});

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly field?: "email" | "password" | "name",
  ) {
    super(message);
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isUniqueViolation = (error: unknown): boolean => {
  const cause = (error as { cause?: unknown })?.cause ?? error;
  return (cause as { code?: string })?.code === "23505";
};

export async function countUsers() {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  return row?.count ?? 0;
}

export async function listUsers(): Promise<User[]> {
  const rows = await db.select().from(users).orderBy(asc(users.createdAt));
  return rows.map(toUser);
}

export async function getUser(id: number): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ? toUser(row) : null;
}

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizeEmail(email)}`)
    .limit(1);
  return row ?? null;
}

export async function createUser(
  input: {
    email: string;
    name?: string | null;
    password: string;
    role: Role;
    mustChangePassword?: boolean;
  },
  client: Db | Tx = db,
) {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AuthError("Bitte eine gültige E-Mail-Adresse.", "email");
  const problem = passwordProblem(input.password);
  if (problem) throw new AuthError(problem, "password");
  if (await findUserByEmail(email))
    throw new AuthError("Diese E-Mail-Adresse ist schon vergeben.", "email");
  try {
    const [row] = await client
      .insert(users)
      .values({
        email,
        name: input.name?.trim() || null,
        passwordHash: await hashPassword(input.password),
        role: input.role,
        mustChangePassword: input.mustChangePassword ?? false,
      })
      .returning();
    return toUser(row!);
  } catch (error) {
    // Two requests at once: the unique index answers what the lookup above could not.
    if (isUniqueViolation(error))
      throw new AuthError("Diese E-Mail-Adresse ist schon vergeben.", "email");
    throw error;
  }
}

// Sets a new password and signs the user out everywhere else (old sessions become invalid).
export async function setPassword(
  id: number,
  password: string,
  options: { mustChange?: boolean } = {},
  client: Db | Tx = db,
) {
  const problem = passwordProblem(password);
  if (problem) throw new AuthError(problem, "password");
  const now = new Date();
  await client
    .update(users)
    .set({
      passwordHash: await hashPassword(password),
      mustChangePassword: options.mustChange ?? false,
      sessionsRevokedAt: now,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: now,
    })
    .where(eq(users.id, id));
  await client.delete(sessions).where(eq(sessions.userId, id));
}

// Someone must be able to manage accounts: the last admin can neither go nor become an editor.
// Both run in a transaction that locks the admins' rows, so two admins demoting each other at
// once cannot leave none.
async function keepAnAdmin(tx: Tx, id: number, message: string) {
  const admins = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .for("update");
  if (admins.length === 1 && admins[0]!.id === id) throw new AuthError(message);
}

export async function setUserRole(id: number, role: Role, client: Db | Tx = db) {
  await client.transaction(async (tx) => {
    if (role !== "admin") {
      await keepAnAdmin(
        tx,
        id,
        "Der letzte Admin bleibt Admin: sonst verwaltet niemand die Zugänge.",
      );
    }
    await tx.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  });
}

// Lifts a lock after too many wrong passwords.
export async function unlockUser(id: number, client: Db | Tx = db) {
  await client
    .update(users)
    .set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(users.id, id));
}

// The last admin stays, unless a script (the e2e cleanup) insists.
export async function deleteUser(
  id: number,
  options: { evenTheLast?: boolean } = {},
  client: Db | Tx = db,
) {
  await client.transaction(async (tx) => {
    if (!options.evenTheLast) {
      await keepAnAdmin(tx, id, "Der letzte Admin kann nicht gelöscht werden.");
    }
    await tx.delete(users).where(eq(users.id, id));
  });
}

// One wrong password, counted in one statement: parallel attempts each see the row as the one
// before left it (the row lock serialises them), so none of them is lost. Mirrors afterFailure
// in lockout.ts: a failure after an expired lock starts a fresh count; the fifth one locks.
// A row locked in the meantime is left alone and reported as it is.
export async function registerFailure(id: number, now = new Date()) {
  const attempts = sql`(case when ${users.lockedUntil} is not null and ${users.lockedUntil} <= ${now}::timestamptz
    then 1 else ${users.failedAttempts} + 1 end)`;
  const lockUntil = new Date(now.getTime() + LOCK_MINUTES * 60_000);
  const [row] = await db
    .update(users)
    .set({
      failedAttempts: sql`case when ${attempts} >= ${MAX_ATTEMPTS} then 0 else ${attempts} end`,
      lockedUntil: sql`case when ${attempts} >= ${MAX_ATTEMPTS} then ${lockUntil}::timestamptz else null end`,
      updatedAt: now,
    })
    .where(and(eq(users.id, id), or(isNull(users.lockedUntil), lte(users.lockedUntil, now))))
    .returning({ failedAttempts: users.failedAttempts, lockedUntil: users.lockedUntil });
  if (row) return row;
  const [current] = await db
    .select({ failedAttempts: users.failedAttempts, lockedUntil: users.lockedUntil })
    .from(users)
    .where(eq(users.id, id));
  return current ?? { failedAttempts: 0, lockedUntil: null };
}

export type LoginResult = { ok: true; user: User } | { ok: false; message: string };

const WRONG = "E-Mail-Adresse oder Passwort ist falsch.";

// One answer for an unknown address and a wrong password; a lock answers before the password
// is even checked, but the check still runs so timing does not tell the two apart.
export async function checkCredentials(
  email: string,
  password: string,
  now = new Date(),
): Promise<LoginResult> {
  const row = await findUserByEmail(email);
  const valid = await verifyPassword(password, row?.passwordHash);
  if (!row) return { ok: false, message: WRONG };
  const state = { failedAttempts: row.failedAttempts, lockedUntil: row.lockedUntil };
  if (isLocked(state, now)) return { ok: false, message: lockMessage(state, now)! };
  if (!valid) {
    const next = await registerFailure(row.id, now);
    return { ok: false, message: lockMessage(next, now) ?? WRONG };
  }
  await db
    .update(users)
    .set({ ...afterSuccess(), lastLoginAt: now, updatedAt: now })
    .where(eq(users.id, row.id));
  return { ok: true, user: toUser(row) };
}

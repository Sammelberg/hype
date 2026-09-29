"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, sessionCookieOptions } from "@/cms/auth/cookie";
import { getSessionUser } from "@/cms/auth/guard";
import { createSession, destroySession, purgeExpiredSessions } from "@/cms/auth/session";
import { AuthError, checkCredentials, countUsers, createUser, setPassword } from "@/cms/auth/users";
import { verifyPassword } from "@/cms/auth/password";
import { findUserByEmail } from "@/cms/auth/users";

export type AuthState = { error?: string; field?: string; values?: Record<string, string> };

// Only paths inside the admin may be the target after login.
const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
};

async function signIn(userId: number) {
  const { token, expiresAt } = await createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Bitte E-Mail-Adresse und Passwort eingeben.", values: { email } };
  }
  const result = await checkCredentials(email, password);
  if (!result.ok) return { error: result.message, values: { email } };
  await signIn(result.user.id);
  void purgeExpiredSessions().catch(() => undefined);
  redirect(
    (result.user.mustChangePassword
      ? "/admin/passwort"
      : safeNext(formData.get("weiter"))) as never,
  );
}

export async function logout() {
  const jar = await cookies();
  await destroySession(jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login" as never);
}

// The first account, only while there is none.
export async function setup(_: AuthState, formData: FormData): Promise<AuthState> {
  if ((await countUsers()) > 0) redirect("/admin/login" as never);
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const values = { name, email };
  if (password !== confirm)
    return { error: "Die Passwörter stimmen nicht überein.", field: "confirm", values };
  try {
    const user = await createUser({ name, email, password });
    await signIn(user.id);
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message, field: error.field, values };
    throw error;
  }
  redirect("/admin" as never);
}

// Own password: the current one is required unless the account was told to change it.
export async function changePassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login" as never);
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm)
    return { error: "Die Passwörter stimmen nicht überein.", field: "confirm" };
  if (!user.mustChangePassword) {
    const row = await findUserByEmail(user.email);
    if (!(await verifyPassword(current, row?.passwordHash))) {
      return { error: "Das aktuelle Passwort ist falsch.", field: "current" };
    }
  }
  try {
    await setPassword(user.id, password);
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message, field: error.field };
    throw error;
  }
  // setPassword ends every session, including this one: sign in again silently.
  await signIn(user.id);
  redirect("/admin?passwort=geaendert" as never);
}

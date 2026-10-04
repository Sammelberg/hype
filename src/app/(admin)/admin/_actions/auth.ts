"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { audited, writeAudit } from "@/cms/audit/log";
import { SESSION_COOKIE, sessionCookieOptions } from "@/cms/auth/cookie";
import { getSessionUser } from "@/cms/auth/guard";
import { createSession, destroySession, purgeExpiredSessions } from "@/cms/auth/session";
import { createReset, redeemReset, RESET_MINUTES } from "@/cms/auth/reset";
import { AuthError, checkCredentials, setPassword } from "@/cms/auth/users";
import { verifyPassword } from "@/cms/auth/password";
import { findUserByEmail } from "@/cms/auth/users";
import { getSiteSettings } from "@/cms/content/site-settings";
import { db } from "@/cms/db/client";
import { sendSiteMail } from "@/cms/mail/send";
import { env } from "@/env";
import { passwordResetMail } from "@/lib/email/messages";
import { clientIp } from "@/cms/security/client-ip";
import { hitRateLimit, LIMITS, resetRateLimit } from "@/cms/security/rate-limit";
import { retryMessage } from "@/cms/security/window";

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
  // Per address before the password check (argon2 costs 64 MiB each); per account the lock.
  const ipKey = `login:${clientIp(await headers())}`;
  const limit = await hitRateLimit(ipKey, LIMITS.login);
  const failed = (message: string) =>
    writeAudit(db, {
      actor: null,
      action: "anmeldung.fehlgeschlagen",
      details: { email: email.trim().toLowerCase().slice(0, 320), grund: message },
    });
  if (!limit.ok) {
    const message = retryMessage(limit.retryAfterSeconds);
    // One entry when the wall goes up, not one per knock on it.
    if (limit.count === LIMITS.login.limit + 1) await failed(message);
    return { error: message, values: { email } };
  }
  const result = await checkCredentials(email, password);
  if (!result.ok) {
    await failed(result.message);
    return { error: result.message, values: { email } };
  }
  await resetRateLimit(ipKey);
  await writeAudit(db, { actor: result.user, action: "anmeldung" });
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
    await audited((tx) => setPassword(user.id, password, {}, tx), {
      actor: user,
      action: "zugang.passwort-geaendert",
      target: { type: "zugang", id: user.id },
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message, field: error.field };
    throw error;
  }
  // setPassword ends every session, including this one: sign in again silently.
  await signIn(user.id);
  redirect("/admin?passwort=geaendert" as never);
}

// „Passwort vergessen“: the same answer whether the address has an account or not, so the form
// tells nobody which addresses exist. Limited per address, since each request may send a mail.
export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Bitte Ihre E-Mail-Adresse eingeben.", field: "email" };
  const limit = await hitRateLimit(`reset:${clientIp(await headers())}`, LIMITS.reset);
  if (!limit.ok) return { error: retryMessage(limit.retryAfterSeconds), values: { email } };
  try {
    const reset = await createReset(email);
    if (reset) {
      const settings = await getSiteSettings();
      const url = new URL(`/admin/passwort-vergessen/${reset.token}`, env.NEXT_PUBLIC_SERVER_URL);
      const mail = passwordResetMail({
        url: url.toString(),
        siteName: settings?.siteName || "Website",
        minutes: RESET_MINUTES,
      });
      // To the address of the account, not as typed.
      const { sent } = await sendSiteMail({ to: reset.email, ...mail }, "system");
      await writeAudit(db, {
        actor: null,
        action: "zugang.passwort-link",
        target: { type: "zugang", id: reset.userId },
        details: { gesendet: sent },
      });
    }
  } catch (error) {
    // The mail server refused: logged for the admin, the same answer for the visitor.
    console.error("Link „Passwort vergessen“ nicht gesendet", error);
  }
  redirect("/admin/passwort-vergessen?gesendet=1" as never);
}

// The new password through the link: one transaction with the audit entry, then signed in.
export async function resetPasswordWithLink(_: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm)
    return { error: "Die Passwörter stimmen nicht überein.", field: "confirm" };
  let userId: number;
  try {
    userId = await audited(
      (tx) => redeemReset(token, password, tx),
      (id) => ({
        actor: null,
        action: "zugang.passwort-zurueckgesetzt",
        target: { type: "zugang", id },
      }),
    );
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message, field: error.field };
    throw error;
  }
  await signIn(userId);
  redirect("/admin?passwort=geaendert" as never);
}

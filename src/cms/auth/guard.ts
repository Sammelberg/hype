import "server-only";

import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import type { User } from "../content/types";
import { CmsError } from "../errors";
import type { Role } from "./roles";
import { SESSION_COOKIE } from "./cookie";
import { userForToken } from "./session";

// The signed-in admin for this request, or null. Cached per request.
export const getSessionUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  return userForToken(jar.get(SESSION_COOKIE)?.value);
});

// For admin pages: the user, or a redirect to the login. An account with a temporary password
// reaches nothing but the password page until it has chosen its own.
export async function requireUser(
  options: { next?: string; passwordPage?: boolean } = {},
): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    // src/proxy.ts writes the request path into this header for every /admin request.
    const path = options.next ?? (await headers()).get("x-admin-path") ?? "";
    const next = path && path !== "/admin" ? `?weiter=${encodeURIComponent(path)}` : "";
    redirect(`/admin/login${next}` as never);
  }
  if (user.mustChangePassword && !options.passwordPage) redirect("/admin/passwort" as never);
  return user;
}

// For pages of one role: the user, or the login / the password page as above; an account
// without the role gets a 404, as if the page did not exist (its navigation hides it anyway).
export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) notFound();
  return user;
}

export class NotSignedIn extends CmsError {
  constructor() {
    super("Bitte melden Sie sich an.");
  }
}

export class PasswordChangeRequired extends CmsError {
  constructor() {
    super("Bitte ersetzen Sie zuerst Ihr vorläufiges Passwort.");
  }
}

export class NotAllowed extends CmsError {
  constructor() {
    super("Dafür fehlt Ihrem Zugang die Berechtigung.");
  }
}

// For actions and route handlers: the user, or an error the action client turns into German.
export async function requireUserForAction(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new NotSignedIn();
  if (user.mustChangePassword) throw new PasswordChangeRequired();
  return user;
}

export async function requireRoleForAction(role: Role): Promise<User> {
  const user = await requireUserForAction();
  if (user.role !== role) throw new NotAllowed();
  return user;
}

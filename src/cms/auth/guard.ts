import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { User } from "../content/types";
import { SESSION_COOKIE } from "./cookie";
import { userForToken } from "./session";

// The signed-in admin for this request, or null. Cached per request.
export const getSessionUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  return userForToken(jar.get(SESSION_COOKIE)?.value);
});

// For admin pages and actions: the user, or a redirect to the login (pages) / an error (actions).
export async function requireUser(options: { next?: string } = {}): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    // src/proxy.ts writes the request path into this header for every /admin request.
    const path = options.next ?? (await headers()).get("x-admin-path") ?? "";
    const next = path && path !== "/admin" ? `?weiter=${encodeURIComponent(path)}` : "";
    redirect(`/admin/login${next}` as never);
  }
  return user;
}

export class NotSignedIn extends Error {
  constructor() {
    super("Bitte melden Sie sich an.");
  }
}

export async function requireUserForAction(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new NotSignedIn();
  return user;
}

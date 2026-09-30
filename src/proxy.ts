import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/cms/auth/cookie";

// Paths below /admin that need no session.
const OPEN = new Set(["/admin/login"]);

// Every admin request: without a session cookie a page request goes straight to the login,
// before any page code runs. This is only the first gate: the cookie may be stale or forged,
// so every page and action still checks the session itself (`requireUser`, `authActionClient`).
// Layouts cannot see the path they render; the login redirect needs it (`?weiter=`),
// so every admin request carries its path in a request header.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPage = request.method === "GET" || request.method === "HEAD";
  if (isPage && !OPEN.has(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/admin/login", request.url);
    if (pathname !== "/admin") login.searchParams.set("weiter", pathname);
    return NextResponse.redirect(login);
  }
  const headers = new Headers(request.headers);
  headers.set("x-admin-path", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/admin/:path*"] };

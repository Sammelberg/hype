import { type NextRequest, NextResponse } from "next/server";

// Layouts cannot see the path they render; the admin's login redirect needs it (`?weiter=`),
// so every admin request carries its path in a request header.
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-admin-path", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/admin/:path*"] };

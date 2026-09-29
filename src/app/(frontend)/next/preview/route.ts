import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { getSessionUser } from "@/cms/auth/guard";

// Only a signed-in admin can turn on draft mode; the editor's preview iframe sends the session cookie.
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "/";
  if (!path.startsWith("/") || path.startsWith("//")) {
    return new Response("Ungültiger Pfad", { status: 400 });
  }
  if (!(await getSessionUser())) return new Response("Nicht angemeldet", { status: 403 });

  (await draftMode()).enable();
  redirect(path as never);
}

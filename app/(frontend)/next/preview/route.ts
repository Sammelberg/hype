import { draftMode, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { getPayloadClient } from "@/lib/payload";

// Only a logged-in Payload user can turn on draft mode; the admin iframe sends the session cookie.
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "/";
  if (!path.startsWith("/") || path.startsWith("//")) {
    return new Response("Ungültiger Pfad", { status: 400 });
  }
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) return new Response("Nicht angemeldet", { status: 403 });

  (await draftMode()).enable();
  redirect(path as never);
}

import { NextResponse } from "next/server";

import { requireUserForAction } from "@/cms/auth/guard";
import { createMedia } from "@/cms/content/media";
import { clientIp } from "@/cms/security/client-ip";
import { hitRateLimit, LIMITS } from "@/cms/security/rate-limit";
import { retryMessage } from "@/cms/security/window";
import { storeUpload, UploadError } from "@/cms/media/store";

// Uploads: a route of their own, so the server actions' body limit stays small (next.config.ts:
// the public contact form is one of them) and src/proxy.ts does not buffer the body (its matcher
// leaves this path out). Several files per request, together at most MAX_REQUEST_BYTES.
const MAX_REQUEST_BYTES = 60 * 1024 * 1024;

const refuse = (message: string, status: number) => NextResponse.json({ message }, { status });

export async function POST(request: Request) {
  let userId: number;
  try {
    userId = (await requireUserForAction()).id;
  } catch (error) {
    return refuse((error as Error).message, 401);
  }
  // SameSite=Lax already keeps the session cookie off cross-site POSTs; the origin check is
  // what server actions do on their own.
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return refuse("Nicht erlaubt.", 403);

  const limit = await hitRateLimit(`upload:${userId}`, LIMITS.upload);
  if (!limit.ok) return refuse(retryMessage(limit.retryAfterSeconds), 429);

  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) return refuse("Bitte wählen Sie eine Datei.", 411);
  if (length > MAX_REQUEST_BYTES)
    return refuse("Zu viel auf einmal: höchstens 60 MB je Upload.", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return refuse("Die Dateien kamen nicht vollständig an. Bitte noch einmal.", 400);
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const alt = String(form.get("alt") ?? "").trim();
  if (files.length === 0) return refuse("Bitte wählen Sie mindestens eine Datei.", 400);

  const ids: number[] = [];
  try {
    for (const file of files) {
      const stored = await storeUpload(file);
      const doc = await createMedia({ ...stored, alt: alt || file.name.replace(/\.[^.]+$/, "") });
      ids.push(doc.id);
    }
  } catch (error) {
    if (error instanceof UploadError) return refuse(error.message, 422);
    console.error("Upload fehlgeschlagen", error, { ip: clientIp(request.headers) });
    return refuse("Das Hochladen hat nicht geklappt. Bitte versuchen Sie es noch einmal.", 500);
  }
  return NextResponse.json({ ids });
}

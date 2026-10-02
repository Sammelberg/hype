import { NextResponse } from "next/server";

import { requireUserForAction } from "@/cms/auth/guard";
import { audited } from "@/cms/audit/log";
import { createMedia } from "@/cms/content/media";
import { clientIp } from "@/cms/security/client-ip";
import { hitRateLimit, LIMITS } from "@/cms/security/rate-limit";
import { sameOrigin } from "@/cms/security/same-origin";
import { retryMessage } from "@/cms/security/window";
import { storeUpload, UploadError } from "@/cms/media/store";

// Uploads: a route of their own, so the server actions' body limit stays small (next.config.ts:
// the public contact form is one of them) and src/proxy.ts does not buffer the body (its matcher
// leaves this path out). Several files per request, together at most MAX_REQUEST_BYTES.
const MAX_REQUEST_BYTES = 60 * 1024 * 1024;

const refuse = (message: string, status: number) => NextResponse.json({ message }, { status });

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof requireUserForAction>>;
  try {
    user = await requireUserForAction();
  } catch (error) {
    return refuse((error as Error).message, 401);
  }
  // SameSite=Lax already keeps the session cookie off cross-site POSTs; the origin check is
  // what server actions do on their own.
  if (!sameOrigin(request.headers)) return refuse("Nicht erlaubt.", 403);

  const limit = await hitRateLimit(`upload:${user.id}`, LIMITS.upload);
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
  // The folder the library shows while uploading: the new images land in it.
  const ordner =
    String(form.get("ordner") ?? "")
      .trim()
      .slice(0, 100) || null;
  if (files.length === 0) return refuse("Bitte wählen Sie mindestens eine Datei.", 400);

  const ids: number[] = [];
  try {
    for (const file of files) {
      const stored = await storeUpload(file);
      const record = { ...stored, ordner, alt: alt || file.name.replace(/\.[^.]+$/, "") };
      const doc = await audited(
        (tx) => createMedia(record, tx),
        (d) => ({
          actor: user,
          action: "medien.hochgeladen",
          target: { type: "medien", id: d.id },
          details: { datei: d.filename },
        }),
      );
      ids.push(doc.id);
    }
  } catch (error) {
    if (error instanceof UploadError) return refuse(error.message, 422);
    console.error("Upload fehlgeschlagen", error, { ip: clientIp(request.headers) });
    return refuse("Das Hochladen hat nicht geklappt. Bitte versuchen Sie es noch einmal.", 500);
  }
  return NextResponse.json({ ids });
}

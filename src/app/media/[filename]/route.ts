import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { mediaFilePath, SAFE_FILENAME } from "@/cms/media/paths";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

// Serves an upload from /media. Filenames carry a content hash, so they may be cached for a year.
// Its Content-Security-Policy (`sandbox`) comes from next.config.ts, which would override one set here.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!SAFE_FILENAME.test(filename)) return new Response("Nicht gefunden", { status: 404 });
  const file = mediaFilePath(filename);
  let size: number;
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("kein Regulärfile");
    size = info.size;
  } catch {
    return new Response("Nicht gefunden", { status: 404 });
  }
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Files on disk under /media: the original plus the resized variants the site uses
// (480 / 960 / 1920 wide, never enlarged). Names carry a content hash, so they never collide
// and may be cached forever.
import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { MEDIA_SIZES, type MediaSizes } from "../content/types";
import { MEDIA_DIR } from "./paths";

export const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_SIDE = 8192;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export class UploadError extends Error {}

// A safe base name from the original: umlauts written out, everything else hyphens.
function baseName(original: string) {
  const stem = original.replace(/\.[^.]+$/, "").toLowerCase();
  const safe = stem
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return safe || "bild";
}

// What the magic bytes say the file is; the browser's claim is not trusted.
function sniff(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP")
    return "image/webp";
  if (bytes.subarray(4, 12).toString() === "ftypavif") return "image/avif";
  if (bytes.subarray(0, 6).toString() === "GIF89a" || bytes.subarray(0, 6).toString() === "GIF87a")
    return "image/gif";
  const head = bytes.subarray(0, 512).toString("utf8");
  if (/<svg[\s>]/i.test(head) && !/<script/i.test(bytes.toString("utf8"))) return "image/svg+xml";
  return null;
}

export type StoredFile = {
  filename: string;
  mimeType: string;
  filesize: number;
  width: number | null;
  height: number | null;
  sizes: MediaSizes;
};

export async function storeUpload(file: File): Promise<StoredFile> {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Die Datei ist größer als 20 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = sniff(bytes);
  if (!mimeType || !ACCEPTED_TYPES.has(mimeType)) {
    throw new UploadError("Bitte ein Bild hochladen: JPG, PNG, WebP, AVIF, GIF oder SVG.");
  }
  await mkdir(MEDIA_DIR, { recursive: true });
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 10);
  const base = `${baseName(file.name)}-${hash}`;
  const ext = EXT[mimeType]!;
  const filename = `${base}.${ext}`;

  if (mimeType === "image/svg+xml") {
    await writeFile(path.join(MEDIA_DIR, filename), bytes);
    return { filename, mimeType, filesize: bytes.length, width: null, height: null, sizes: {} };
  }

  // `rotate()` applies the camera's orientation tag and drops it, so the pixels are upright.
  const image = sharp(bytes, { animated: mimeType === "image/gif" }).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? null;
  const height = meta.pageHeight ?? meta.height ?? null;
  if ((width ?? 0) > MAX_SIDE || (height ?? 0) > MAX_SIDE) {
    throw new UploadError(`Bitte ein Bild mit höchstens ${MAX_SIDE} Pixeln Kantenlänge.`);
  }
  await writeFile(path.join(MEDIA_DIR, filename), bytes);

  const sizes: MediaSizes = {};
  if (mimeType !== "image/gif" && width) {
    for (const [name, target] of Object.entries(MEDIA_SIZES)) {
      if (width <= target && name !== "thumbnail") continue;
      const variantName = `${base}-${target}.webp`;
      const output = await sharp(bytes)
        .rotate()
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(MEDIA_DIR, variantName));
      sizes[name as keyof typeof MEDIA_SIZES] = {
        filename: variantName,
        width: output.width,
        height: output.height,
        filesize: output.size,
      };
    }
  }
  return { filename, mimeType, filesize: bytes.length, width, height, sizes };
}

export async function removeFiles(filenames: string[]) {
  await Promise.all(filenames.map((name) => rm(path.join(MEDIA_DIR, name), { force: true })));
}

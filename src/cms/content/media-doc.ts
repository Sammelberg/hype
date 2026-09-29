import type { media } from "../db/schema";
import type { MediaDoc, MediaSizeName, MediaVariant } from "./types";

export const MEDIA_URL_PREFIX = "/media";

export const mediaUrlOf = (filename: string) =>
  `${MEDIA_URL_PREFIX}/${encodeURIComponent(filename)}`;

export function toMediaDoc(row: typeof media.$inferSelect): MediaDoc {
  const sizes: MediaDoc["sizes"] = {};
  for (const [name, variant] of Object.entries(row.sizes) as [MediaSizeName, MediaVariant][]) {
    sizes[name] = { ...variant, url: mediaUrlOf(variant.filename) };
  }
  return {
    id: row.id,
    alt: row.alt,
    filename: row.filename,
    mimeType: row.mimeType,
    filesize: row.filesize,
    width: row.width,
    height: row.height,
    focalX: row.focalX,
    focalY: row.focalY,
    url: mediaUrlOf(row.filename),
    sizes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

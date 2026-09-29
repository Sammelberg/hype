import path from "node:path";

// Uploads live on local disk (a persistent volume in production), next to the app.
export const MEDIA_DIR = process.env.MEDIA_DIR || path.join(process.cwd(), "media");

// Only names our store writes: letters, digits, dot, hyphen, underscore — never a path.
export const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/;

export const mediaFilePath = (filename: string) => path.join(MEDIA_DIR, filename);

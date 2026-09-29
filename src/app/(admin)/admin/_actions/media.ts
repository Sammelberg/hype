"use server";

import { z } from "zod";

import { createMedia, deleteMedia, updateMedia } from "@/cms/content/media";
import { removeFiles, storeUpload } from "@/cms/media/store";
import { authActionClient } from "./client";

// Uploads arrive as FormData: one or more files under `files`, the alt text under `alt`.
export const uploadMediaAction = authActionClient
  .inputSchema(z.instanceof(FormData))
  .action(async ({ parsedInput }) => {
    const files = parsedInput
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);
    const alt = String(parsedInput.get("alt") ?? "").trim();
    if (files.length === 0) throw new Error("Bitte wählen Sie mindestens eine Datei.");
    const created = [];
    for (const file of files) {
      const stored = await storeUpload(file);
      created.push(await createMedia({ ...stored, alt: alt || file.name.replace(/\.[^.]+$/, "") }));
    }
    return { ids: created.map((m) => m.id) };
  });

export const updateMediaAction = authActionClient
  .inputSchema(
    z.object({
      id: z.number().int().positive(),
      alt: z.string().trim().min(1, "Bitte beschreiben Sie das Bild.").max(500),
      focalX: z.number().min(0).max(100),
      focalY: z.number().min(0).max(100),
    }),
  )
  .action(async ({ parsedInput: { id, ...patch } }) => {
    const doc = await updateMedia(id, patch);
    if (!doc) throw new Error("Die Datei gibt es nicht mehr.");
  });

export const deleteMediaAction = authActionClient
  .inputSchema(z.object({ id: z.number().int().positive() }))
  .action(async ({ parsedInput }) => {
    const doc = await deleteMedia(parsedInput.id);
    if (doc) await removeFiles([doc.filename, ...Object.values(doc.sizes).map((s) => s.filename)]);
  });

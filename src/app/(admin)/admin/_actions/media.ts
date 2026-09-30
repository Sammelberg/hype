"use server";

import { z } from "zod";

import { deleteMedia, updateMedia } from "@/cms/content/media";
import { removeFiles } from "@/cms/media/store";
import { authActionClient } from "./client";

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

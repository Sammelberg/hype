"use server";

import { z } from "zod";

import { audited } from "@/cms/audit/log";
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
  .action(async ({ parsedInput, ctx }) => {
    const doc = await audited(
      (tx) => deleteMedia(parsedInput.id, tx),
      (d) => ({
        actor: ctx.user,
        action: "medien.geloescht",
        target: { type: "medien", id: parsedInput.id },
        details: { datei: d?.filename ?? null },
      }),
    );
    if (doc) await removeFiles([doc.filename, ...Object.values(doc.sizes).map((s) => s.filename)]);
  });

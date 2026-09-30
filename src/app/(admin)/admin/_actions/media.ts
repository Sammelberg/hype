"use server";

import { z } from "zod";

import { audited } from "@/cms/audit/log";
import { deleteMedia, updateMedia } from "@/cms/content/media";
import { CmsError } from "@/cms/errors";
import { removeFiles } from "@/cms/media/store";
import { revalidateSite } from "@/cms/revalidate";
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
    if (!doc) throw new CmsError("Die Datei gibt es nicht mehr.");
    // An image may appear on any page (its alt text, its crop): the pages are static.
    revalidateSite();
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
    // Pages that showed it are static: they must stop pointing at a file that is gone.
    revalidateSite();
  });

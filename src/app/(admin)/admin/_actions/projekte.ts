"use server";

import { z } from "zod";

import {
  createProjekt,
  deleteProjekt,
  discardProjektDraft,
  publishProjekt,
  restoreProjektVersion,
  saveProjektDraft,
  unpublishProjekt,
} from "@/cms/content/projekte";
import { ProjektInputSchema } from "@/cms/content/types";
import { getVersion } from "@/cms/content/versions";
import { revalidateDocument } from "@/cms/revalidate";
import { authActionClient } from "./client";

const id = z.object({ id: z.number().int().positive() });

export const createProjektAction = authActionClient
  .inputSchema(ProjektInputSchema)
  .action(async ({ parsedInput }) => ({ id: await createProjekt(parsedInput) }));

export const saveProjektDraftAction = authActionClient
  .inputSchema(id.extend({ input: ProjektInputSchema }))
  .action(async ({ parsedInput }) => {
    await saveProjektDraft(parsedInput.id, parsedInput.input);
    return { savedAt: new Date().toISOString() };
  });

export const publishProjektAction = authActionClient
  .inputSchema(id.extend({ input: ProjektInputSchema.optional() }))
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.input) await saveProjektDraft(parsedInput.id, parsedInput.input);
    const result = await publishProjekt(parsedInput.id, ctx.user.id);
    revalidateDocument([...result.pathsBefore, ...result.pathsAfter, "/projekte"]);
    return result;
  });

export const unpublishProjektAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    const result = await unpublishProjekt(parsedInput.id);
    revalidateDocument([...result.pathsBefore, "/projekte"]);
    return result;
  });

export const discardProjektDraftAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    await discardProjektDraft(parsedInput.id);
  });

export const deleteProjektAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    const paths = await deleteProjekt(parsedInput.id);
    revalidateDocument([...paths, "/projekte"]);
  });

export const restoreProjektVersionAction = authActionClient
  .inputSchema(id.extend({ versionId: z.number().int().positive() }))
  .action(async ({ parsedInput, ctx }) => {
    const version = await getVersion(parsedInput.versionId);
    if (!version || version.collection !== "projekte" || version.docId !== parsedInput.id) {
      throw new Error("Diese Version gehört nicht zu diesem Projekt.");
    }
    await restoreProjektVersion(parsedInput.id, version.snapshot, ctx.user.id);
  });

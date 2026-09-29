"use server";

import { z } from "zod";

import {
  createPage,
  deletePage,
  discardDraft,
  publishPage,
  restorePageVersion,
  saveDraft,
  unpublishPage,
} from "@/cms/content/pages";
import { PageInputSchema } from "@/cms/content/types";
import { getVersion } from "@/cms/content/versions";
import { revalidateDocument } from "@/cms/revalidate";
import { authActionClient } from "./client";

const id = z.object({ id: z.number().int().positive() });

export const createPageAction = authActionClient
  .inputSchema(PageInputSchema)
  .action(async ({ parsedInput }) => ({ id: await createPage(parsedInput) }));

export const savePageDraftAction = authActionClient
  .inputSchema(id.extend({ input: PageInputSchema }))
  .action(async ({ parsedInput }) => {
    await saveDraft(parsedInput.id, parsedInput.input);
    return { savedAt: new Date().toISOString() };
  });

export const publishPageAction = authActionClient
  .inputSchema(id.extend({ input: PageInputSchema.optional() }))
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.input) await saveDraft(parsedInput.id, parsedInput.input);
    const result = await publishPage(parsedInput.id, ctx.user.id);
    revalidateDocument([...result.pathsBefore, ...result.pathsAfter]);
    return result;
  });

export const unpublishPageAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    const result = await unpublishPage(parsedInput.id);
    revalidateDocument(result.pathsBefore);
    return result;
  });

export const discardPageDraftAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    await discardDraft(parsedInput.id);
  });

export const deletePageAction = authActionClient.inputSchema(id).action(async ({ parsedInput }) => {
  const paths = await deletePage(parsedInput.id);
  revalidateDocument(paths);
});

export const restorePageVersionAction = authActionClient
  .inputSchema(id.extend({ versionId: z.number().int().positive() }))
  .action(async ({ parsedInput, ctx }) => {
    const version = await getVersion(parsedInput.versionId);
    if (!version || version.collection !== "pages" || version.docId !== parsedInput.id) {
      throw new Error("Diese Version gehört nicht zu dieser Seite.");
    }
    await restorePageVersion(parsedInput.id, version.snapshot, ctx.user.id);
  });

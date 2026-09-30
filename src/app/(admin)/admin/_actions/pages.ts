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
import { audited } from "@/cms/audit/log";
import { PageInputSchema } from "@/cms/content/types";
import { getVersion } from "@/cms/content/versions";
import { revalidateDocument } from "@/cms/revalidate";
import { CmsError } from "@/cms/errors";
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
    const result = await audited(
      (tx) => publishPage(parsedInput.id, ctx.user.id, tx),
      (r) => ({
        actor: ctx.user,
        action: "seite.veroeffentlicht",
        target: { type: "seite", id: parsedInput.id },
        details: { pfad: r.pathsAfter[0] },
      }),
    );
    revalidateDocument([...result.pathsBefore, ...result.pathsAfter]);
    return result;
  });

export const unpublishPageAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    const result = await audited(
      (tx) => unpublishPage(parsedInput.id, tx),
      (r) => ({
        actor: ctx.user,
        action: "seite.zurueckgezogen",
        target: { type: "seite", id: parsedInput.id },
        details: { pfad: r.pathsBefore[0] },
      }),
    );
    revalidateDocument(result.pathsBefore);
    return result;
  });

export const discardPageDraftAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    await discardDraft(parsedInput.id);
  });

export const deletePageAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    const paths = await audited(
      (tx) => deletePage(parsedInput.id, tx),
      (p) => ({
        actor: ctx.user,
        action: "seite.geloescht",
        target: { type: "seite", id: parsedInput.id },
        details: { pfad: p[0] },
      }),
    );
    revalidateDocument(paths);
  });

export const restorePageVersionAction = authActionClient
  .inputSchema(id.extend({ versionId: z.number().int().positive() }))
  .action(async ({ parsedInput, ctx }) => {
    const version = await getVersion(parsedInput.versionId);
    if (!version || version.collection !== "pages" || version.docId !== parsedInput.id) {
      throw new CmsError("Diese Version gehört nicht zu dieser Seite.");
    }
    await restorePageVersion(parsedInput.id, version.snapshot, ctx.user.id);
  });

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
import { audited } from "@/cms/audit/log";
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
    const result = await audited(
      (tx) => publishProjekt(parsedInput.id, ctx.user.id, tx),
      (r) => ({
        actor: ctx.user,
        action: "projekt.veroeffentlicht",
        target: { type: "projekt", id: parsedInput.id },
        details: { pfad: r.pathsAfter[0] },
      }),
    );
    revalidateDocument([...result.pathsBefore, ...result.pathsAfter, "/projekte"]);
    return result;
  });

export const unpublishProjektAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    const result = await audited(
      (tx) => unpublishProjekt(parsedInput.id, tx),
      (r) => ({
        actor: ctx.user,
        action: "projekt.zurueckgezogen",
        target: { type: "projekt", id: parsedInput.id },
        details: { pfad: r.pathsBefore[0] },
      }),
    );
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
  .action(async ({ parsedInput, ctx }) => {
    const paths = await audited(
      (tx) => deleteProjekt(parsedInput.id, tx),
      (p) => ({
        actor: ctx.user,
        action: "projekt.geloescht",
        target: { type: "projekt", id: parsedInput.id },
        details: { pfad: p[0] },
      }),
    );
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

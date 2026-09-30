"use server";

import { z } from "zod";

import {
  createRedirect,
  deleteRedirect,
  getRedirect,
  updateRedirect,
} from "@/cms/content/redirects";
import { audited } from "@/cms/audit/log";
import { RedirectInputSchema } from "@/cms/content/types";
import { revalidatePaths } from "@/cms/revalidate";
import { authActionClient } from "./client";

const id = z.object({ id: z.number().int().positive() });

export const createRedirectAction = authActionClient
  .inputSchema(RedirectInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const created = await audited(
      (tx) => createRedirect(parsedInput, tx),
      (newId) => ({
        actor: ctx.user,
        action: "weiterleitung.angelegt",
        target: { type: "weiterleitung", id: newId },
        details: { von: parsedInput.from },
      }),
    );
    revalidatePaths([parsedInput.from]);
    return { id: created };
  });

export const updateRedirectAction = authActionClient
  .inputSchema(id.extend({ input: RedirectInputSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const before = await getRedirect(parsedInput.id);
    await audited((tx) => updateRedirect(parsedInput.id, parsedInput.input, tx), {
      actor: ctx.user,
      action: "weiterleitung.geaendert",
      target: { type: "weiterleitung", id: parsedInput.id },
      details: { von: parsedInput.input.from },
    });
    revalidatePaths([before?.from, parsedInput.input.from]);
  });

export const deleteRedirectAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => {
    const from = await audited(
      (tx) => deleteRedirect(parsedInput.id, tx),
      (von) => ({
        actor: ctx.user,
        action: "weiterleitung.geloescht",
        target: { type: "weiterleitung", id: parsedInput.id },
        details: { von },
      }),
    );
    revalidatePaths([from]);
  });

"use server";

import { z } from "zod";

import {
  createRedirect,
  deleteRedirect,
  getRedirect,
  updateRedirect,
} from "@/cms/content/redirects";
import { RedirectInputSchema } from "@/cms/content/types";
import { revalidatePaths } from "@/cms/revalidate";
import { authActionClient } from "./client";

const id = z.object({ id: z.number().int().positive() });

export const createRedirectAction = authActionClient
  .inputSchema(RedirectInputSchema)
  .action(async ({ parsedInput }) => {
    const created = await createRedirect(parsedInput);
    revalidatePaths([parsedInput.from]);
    return { id: created };
  });

export const updateRedirectAction = authActionClient
  .inputSchema(id.extend({ input: RedirectInputSchema }))
  .action(async ({ parsedInput }) => {
    const before = await getRedirect(parsedInput.id);
    await updateRedirect(parsedInput.id, parsedInput.input);
    revalidatePaths([before?.from, parsedInput.input.from]);
  });

export const deleteRedirectAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    const from = await deleteRedirect(parsedInput.id);
    revalidatePaths([from]);
  });

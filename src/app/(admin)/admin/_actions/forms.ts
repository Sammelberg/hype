"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { deleteSubmission, markSubmissionRead, saveForm } from "@/cms/content/forms";
import { FormInputSchema } from "@/cms/content/types";
import { revalidatePaths } from "@/cms/revalidate";
import { authActionClient } from "./client";

const id = z.object({ id: z.number().int().positive() });

export const saveFormAction = authActionClient
  .inputSchema(id.extend({ input: FormInputSchema }))
  .action(async ({ parsedInput }) => {
    await saveForm(parsedInput.id, parsedInput.input);
    revalidatePaths(["/kontakt"]);
  });

export const markSubmissionAction = authActionClient
  .inputSchema(id.extend({ read: z.boolean() }))
  .action(async ({ parsedInput }) => {
    await markSubmissionRead(parsedInput.id, parsedInput.read);
    // The sidebar counts unread messages: the page comes back refreshed with the action's answer.
    revalidatePath("/admin", "layout");
  });

export const deleteSubmissionAction = authActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => {
    await deleteSubmission(parsedInput.id);
  });

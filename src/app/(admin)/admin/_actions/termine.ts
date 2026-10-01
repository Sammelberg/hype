"use server";

import { z } from "zod";

import { createTermin, deleteTermin, updateTermin } from "@/buero/daten/kalender";
import { TerminSchema } from "@/buero/logik/typen";
import { adminActionClient } from "./client";

// The owner's own Termine in the calendar (src/buero/daten/kalender.ts).
const id = z.object({ id: z.number().int().positive() });

export const createTerminAction = adminActionClient
  .inputSchema(TerminSchema)
  .action(async ({ parsedInput }) => ({ id: await createTermin(parsedInput) }));

export const updateTerminAction = adminActionClient
  .inputSchema(id.extend({ input: TerminSchema }))
  .action(async ({ parsedInput }) => updateTermin(parsedInput.id, parsedInput.input));

export const deleteTerminAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => deleteTermin(parsedInput.id));

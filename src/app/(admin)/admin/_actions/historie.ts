"use server";

import { z } from "zod";

import {
  addHistorie,
  createWiedervorlage,
  deleteHistorie,
  deleteWiedervorlage,
  erledigeWiedervorlage,
  verschiebeWiedervorlage,
} from "@/buero/daten/historie";
import { HistorieSchema, WiedervorlageSchema } from "@/buero/logik/typen";
import { adminActionClient } from "./client";

// The customer's history and the Wiedervorlagen (src/buero/daten/historie.ts).
const id = z.object({ id: z.number().int().positive() });
const tag = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const addHistorieAction = adminActionClient
  .inputSchema(HistorieSchema)
  .action(async ({ parsedInput, ctx }) => ({
    id: await addHistorie(parsedInput, ctx.user.name || ctx.user.email),
  }));

export const deleteHistorieAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => deleteHistorie(parsedInput.id));

export const createWiedervorlageAction = adminActionClient
  .inputSchema(WiedervorlageSchema)
  .action(async ({ parsedInput }) => ({ id: await createWiedervorlage(parsedInput) }));

export const erledigeWiedervorlageAction = adminActionClient
  .inputSchema(id.extend({ erledigt: z.boolean() }))
  .action(async ({ parsedInput }) => erledigeWiedervorlage(parsedInput.id, parsedInput.erledigt));

export const verschiebeWiedervorlageAction = adminActionClient
  .inputSchema(id.extend({ faelligAm: tag }))
  .action(async ({ parsedInput }) =>
    verschiebeWiedervorlage(parsedInput.id, parsedInput.faelligAm),
  );

export const deleteWiedervorlageAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => deleteWiedervorlage(parsedInput.id));

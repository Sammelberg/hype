"use server";

import { z } from "zod";

import {
  createAngebot,
  deleteAngebot,
  lehneAngebotAb,
  nimmAngebotAn,
  saveAngebot,
  versendeAngebot,
} from "@/buero/daten/angebote";
import { AngebotSchema } from "@/buero/logik/typen";
import { audited } from "@/cms/audit/log";
import { adminActionClient } from "./client";

// Offers (src/buero/daten/angebote.ts): written, sent with a number, accepted into an order.
const id = z.object({ id: z.number().int().positive() });

export const createAngebotAction = adminActionClient
  .inputSchema(AngebotSchema)
  .action(async ({ parsedInput }) => ({ id: await createAngebot(parsedInput) }));

export const saveAngebotAction = adminActionClient
  .inputSchema(id.extend({ input: AngebotSchema }))
  .action(async ({ parsedInput }) => saveAngebot(parsedInput.id, parsedInput.input));

export const deleteAngebotAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => deleteAngebot(parsedInput.id));

// Saves what is on screen, then sends: the offer that goes out is the one the owner saw.
export const versendeAngebotAction = adminActionClient
  .inputSchema(id.extend({ input: AngebotSchema }))
  .action(async ({ parsedInput, ctx }) => {
    await saveAngebot(parsedInput.id, parsedInput.input);
    const nummer = await audited(
      (tx) => versendeAngebot(parsedInput.id, tx),
      (n) => ({
        actor: ctx.user,
        action: "angebot.versendet",
        target: { type: "angebot", id: parsedInput.id },
        details: { nummer: n },
      }),
    );
    return { nummer };
  });

export const nimmAngebotAnAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => ({ auftragId: await nimmAngebotAn(parsedInput.id) }));

export const lehneAngebotAbAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => lehneAngebotAb(parsedInput.id));

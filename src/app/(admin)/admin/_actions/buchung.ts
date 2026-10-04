"use server";

import { z } from "zod";

import {
  loescheDarsteller,
  loescheExtra,
  loescheFigur,
  loeschePaket,
  loescheStadt,
  loescheZone,
  speichereDarsteller,
  speichereEinstellungen,
  speichereExtra,
  speichereFigur,
  speicherePaket,
  speichereStadt,
  speichereZone,
} from "@/buchung/daten/stammdaten";
import {
  DarstellerSchema,
  EinstellungenSchema,
  ExtraSchema,
  FigurSchema,
  PaketSchema,
  StadtSchema,
  ZoneSchema,
} from "@/buchung/logik/schemas";
import { revalidateSite } from "@/cms/revalidate";
import { adminActionClient } from "./client";

// The booking engine's master data. Admins only: prices and the people sent out are the owner's.
// Every change rebuilds the site, whose catalogue, prices and city pages read this data.
const id = z.object({ id: z.number().int().positive() });
const vielleichtId = z.object({ id: z.number().int().positive().nullable() });

const nachher = <T>(ergebnis: T) => {
  revalidateSite();
  return ergebnis;
};

export const speichereFigurAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: FigurSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereFigur(parsedInput.id, parsedInput.input)),
  );
export const loescheFigurAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loescheFigur(parsedInput.id)));

export const speichereDarstellerAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: DarstellerSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereDarsteller(parsedInput.id, parsedInput.input)),
  );
export const loescheDarstellerAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loescheDarsteller(parsedInput.id)));

export const speicherePaketAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: PaketSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speicherePaket(parsedInput.id, parsedInput.input)),
  );
export const loeschePaketAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loeschePaket(parsedInput.id)));

export const speichereExtraAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: ExtraSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereExtra(parsedInput.id, parsedInput.input)),
  );
export const loescheExtraAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loescheExtra(parsedInput.id)));

export const speichereZoneAction = adminActionClient
  .inputSchema(z.object({ code: z.string().nullable(), input: ZoneSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereZone(parsedInput.code, parsedInput.input)),
  );
export const loescheZoneAction = adminActionClient
  .inputSchema(z.object({ code: z.string() }))
  .action(async ({ parsedInput }) => nachher(await loescheZone(parsedInput.code)));

export const speichereStadtAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: StadtSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereStadt(parsedInput.id, parsedInput.input)),
  );
export const loescheStadtAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loescheStadt(parsedInput.id)));

export const speichereEinstellungenAction = adminActionClient
  .inputSchema(EinstellungenSchema)
  .action(async ({ parsedInput }) => nachher(await speichereEinstellungen(parsedInput)));

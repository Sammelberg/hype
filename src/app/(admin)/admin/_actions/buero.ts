"use server";

import { z } from "zod";

import {
  createAuftrag,
  deleteAuftrag,
  setAuftragStatus,
  updateAuftrag,
} from "@/buero/daten/auftraege";
import { saveFirma } from "@/buero/daten/firma";
import {
  archiveKunde,
  createKunde,
  deleteKunde,
  getKundeOption,
  updateKunde,
} from "@/buero/daten/kunden";
import {
  createRechnung,
  deleteRechnung,
  markiereBezahlt,
  saveRechnung,
  stelleRechnung,
  storniereRechnung,
} from "@/buero/daten/rechnungen";
import {
  createVertrag,
  deleteVertrag,
  setVertragStatus,
  updateVertrag,
} from "@/buero/daten/vertraege";
import { STATUS } from "@/buero/logik/ablauf";
import {
  AuftragSchema,
  FirmaSchema,
  KundeSchema,
  RechnungSchema,
  VertragSchema,
} from "@/buero/logik/typen";
import { audited } from "@/cms/audit/log";
import { adminActionClient } from "./client";

// The office: customers, orders, contracts, invoices and the issuer's details. The repositories
// in src/buero/daten enforce the rules (status steps, GoBD); these only validate and delegate.
const id = z.object({ id: z.number().int().positive() });
const tag = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const saveFirmaAction = adminActionClient
  .inputSchema(FirmaSchema)
  .action(async ({ parsedInput }) => saveFirma(parsedInput));

export const createKundeAction = adminActionClient
  .inputSchema(KundeSchema)
  .action(async ({ parsedInput }) => ({ id: await createKunde(parsedInput) }));
// From a picker („Neuen Kunden anlegen“): creates the customer and hands back what the picker
// shows, so the order, contract or invoice goes on with it selected.
export const schnellKundeAction = adminActionClient
  .inputSchema(KundeSchema)
  .action(async ({ parsedInput }) => getKundeOption(await createKunde(parsedInput)));
export const updateKundeAction = adminActionClient
  .inputSchema(id.extend({ input: KundeSchema }))
  .action(async ({ parsedInput }) => updateKunde(parsedInput.id, parsedInput.input));
export const archiveKundeAction = adminActionClient
  .inputSchema(id.extend({ archivieren: z.boolean() }))
  .action(async ({ parsedInput }) => archiveKunde(parsedInput.id, parsedInput.archivieren));
export const deleteKundeAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => deleteKunde(parsedInput.id));

export const createAuftragAction = adminActionClient
  .inputSchema(AuftragSchema)
  .action(async ({ parsedInput }) => ({ id: await createAuftrag(parsedInput) }));
export const updateAuftragAction = adminActionClient
  .inputSchema(id.extend({ input: AuftragSchema }))
  .action(async ({ parsedInput }) => updateAuftrag(parsedInput.id, parsedInput.input));
export const setAuftragStatusAction = adminActionClient
  .inputSchema(id.extend({ status: z.enum(STATUS.auftrag) }))
  .action(async ({ parsedInput }) => setAuftragStatus(parsedInput.id, parsedInput.status));
export const deleteAuftragAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => deleteAuftrag(parsedInput.id));

export const createVertragAction = adminActionClient
  .inputSchema(VertragSchema)
  .action(async ({ parsedInput }) => ({ id: await createVertrag(parsedInput) }));
export const updateVertragAction = adminActionClient
  .inputSchema(id.extend({ input: VertragSchema }))
  .action(async ({ parsedInput }) => updateVertrag(parsedInput.id, parsedInput.input));
export const setVertragStatusAction = adminActionClient
  .inputSchema(id.extend({ status: z.enum(STATUS.vertrag) }))
  .action(async ({ parsedInput }) => setVertragStatus(parsedInput.id, parsedInput.status));
export const deleteVertragAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => deleteVertrag(parsedInput.id));

export const createRechnungAction = adminActionClient
  .inputSchema(RechnungSchema)
  .action(async ({ parsedInput }) => ({ id: await createRechnung(parsedInput) }));
export const saveRechnungAction = adminActionClient
  .inputSchema(id.extend({ input: RechnungSchema }))
  .action(async ({ parsedInput }) => saveRechnung(parsedInput.id, parsedInput.input));
export const deleteRechnungAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => deleteRechnung(parsedInput.id));
// Saves the draft as it is on screen, then issues it: what the owner sees is what is frozen.
export const stelleRechnungAction = adminActionClient
  .inputSchema(id.extend({ input: RechnungSchema }))
  .action(async ({ parsedInput, ctx }) => {
    await saveRechnung(parsedInput.id, parsedInput.input);
    const nummer = await audited(
      (tx) => stelleRechnung(parsedInput.id, tx),
      (n) => ({
        actor: ctx.user,
        action: "rechnung.gestellt",
        target: { type: "rechnung", id: parsedInput.id },
        details: { nummer: n },
      }),
    );
    return { nummer };
  });
export const bezahltAction = adminActionClient
  .inputSchema(id.extend({ am: tag }))
  .action(async ({ parsedInput }) => markiereBezahlt(parsedInput.id, parsedInput.am));
export const stornoAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput, ctx }) => ({
    id: await audited(
      (tx) => storniereRechnung(parsedInput.id, tx),
      (stornoId) => ({
        actor: ctx.user,
        action: "rechnung.storniert",
        target: { type: "rechnung", id: parsedInput.id },
        details: { storno: stornoId },
      }),
    ),
  }));

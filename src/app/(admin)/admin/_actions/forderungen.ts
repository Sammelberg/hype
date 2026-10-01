"use server";

import { z } from "zod";

import {
  entferneZahlung,
  erfasseZahlung,
  mahnungsvorschlag,
  schreibeMahnung,
} from "@/buero/daten/forderungen";
import { MahnungSchema, ZahlungSchema } from "@/buero/logik/typen";
import { audited } from "@/cms/audit/log";
import { adminActionClient } from "./client";

// What issued invoices still claim: payments and Mahnungen (src/buero/daten/forderungen.ts).
// Each change goes into the audit log with it.
const tag = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const erfasseZahlungAction = adminActionClient
  .inputSchema(ZahlungSchema)
  .action(async ({ parsedInput, ctx }) =>
    audited(
      (tx) => erfasseZahlung(parsedInput, tx),
      (z) => ({
        actor: ctx.user,
        action: "zahlung.erfasst",
        target: { type: "rechnung", id: parsedInput.rechnungId },
        details: { zahlung: z.id, betrag: parsedInput.betrag, am: parsedInput.am },
      }),
    ),
  );

export const entferneZahlungAction = adminActionClient
  .inputSchema(z.object({ id: z.number().int().positive() }))
  .action(async ({ parsedInput, ctx }) => {
    await audited(
      (tx) => entferneZahlung(parsedInput.id, tx),
      (z) => ({
        actor: ctx.user,
        action: "zahlung.entfernt",
        target: { type: "rechnung", id: z.rechnungId },
        details: { zahlung: parsedInput.id, betrag: z.betrag },
      }),
    );
  });

export const mahnungsvorschlagAction = adminActionClient
  .inputSchema(z.object({ rechnungId: z.number().int().positive(), am: tag }))
  .action(async ({ parsedInput }) => mahnungsvorschlag(parsedInput.rechnungId, parsedInput.am));

export const schreibeMahnungAction = adminActionClient
  .inputSchema(MahnungSchema)
  .action(async ({ parsedInput, ctx }) =>
    audited(
      (tx) => schreibeMahnung(parsedInput, tx),
      (m) => ({
        actor: ctx.user,
        action: "mahnung.geschrieben",
        target: { type: "rechnung", id: parsedInput.rechnungId },
        details: { mahnung: m.id, stufe: m.stufe },
      }),
    ),
  );
